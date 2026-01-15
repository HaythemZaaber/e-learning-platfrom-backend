import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from './payment.service';
import { NotificationService } from './notification.service';

@Injectable()
export class GroupAutoCancelService {
  private readonly logger = new Logger(GroupAutoCancelService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Check and auto-cancel group instances that don't meet minimum participants
   * This should be called by a cron job or scheduled task
   */
  async checkAndAutoCancelInstances() {
    const now = new Date();

    // Find instances that need to be checked
    // Filter by offering's autoCancelEnabled, not instance's
    const instancesToCheck = await this.prisma.groupOfferingInstance.findMany({
      where: {
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        isBookable: true,
        autoCancelAt: {
          lte: now, // Time to check has arrived
        },
        autoCancelChecked: false,
        scheduledStart: {
          gt: now, // Still in the future
        },
        offering: {
          autoCancelEnabled: true, // Check offering's setting
        },
      },
      include: {
        offering: {
          select: {
            id: true,
            title: true,
            autoCancelEnabled: true,
            autoCancelHoursBefore: true,
            autoCancelRefund: true,
            instructorId: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    this.logger.log(
      `Found ${instancesToCheck.length} group instances to check for auto-cancel`,
    );

    const results = {
      checked: 0,
      cancelled: 0,
      errors: [] as string[],
    };

    for (const instance of instancesToCheck) {
      try {
        results.checked++;

        // Count confirmed enrollments
        const confirmedEnrollments = instance.bookings.filter(
          (b) => b.status === 'ACCEPTED',
        ).length;

        // Check if minimum participants met
        if (confirmedEnrollments < instance.minEnrollments) {
          this.logger.warn(
            `Auto-cancelling instance ${instance.id}: Only ${confirmedEnrollments}/${instance.minEnrollments} participants`,
          );

          await this.cancelInstance(instance.id, {
            reason: `Auto-cancelled: Minimum participants (${instance.minEnrollments}) not met. Only ${confirmedEnrollments} enrolled.`,
            refund: instance.offering.autoCancelRefund ?? true,
          });

          results.cancelled++;
        } else {
          // Minimum met, mark as confirmed and checked
          await this.prisma.groupOfferingInstance.update({
            where: { id: instance.id },
            data: {
              autoCancelChecked: true,
              status: 'CONFIRMED',
            },
          });

          this.logger.log(
            `Instance ${instance.id} confirmed: ${confirmedEnrollments} participants (min: ${instance.minEnrollments})`,
          );
        }
      } catch (error) {
        const errorMessage = `Error processing instance ${instance.id}: ${error.message}`;
        this.logger.error(errorMessage, error.stack);
        results.errors.push(errorMessage);
      }
    }

    return results;
  }

  /**
   * Manually trigger auto-cancel check for a specific instance
   */
  async checkInstance(instanceId: string) {
    const instance = await this.prisma.groupOfferingInstance.findUnique({
      where: { id: instanceId },
      include: {
        offering: {
          select: {
            id: true,
            title: true,
            autoCancelEnabled: true,
            autoCancelRefund: true,
            instructorId: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!instance) {
      throw new BadRequestException('Group instance not found');
    }

    if (!instance.offering.autoCancelEnabled) {
      throw new BadRequestException(
        'Auto-cancel is not enabled for this offering',
      );
    }

    const confirmedEnrollments = instance.bookings.filter(
      (b) => b.status === 'ACCEPTED',
    ).length;

    if (confirmedEnrollments < instance.minEnrollments) {
      await this.cancelInstance(instanceId, {
        reason: `Auto-cancelled: Minimum participants (${instance.minEnrollments}) not met. Only ${confirmedEnrollments} enrolled.`,
        refund: instance.offering.autoCancelRefund ?? true,
      });

      return {
        cancelled: true,
        reason: `Minimum participants not met (${confirmedEnrollments}/${instance.minEnrollments})`,
      };
    }

    // Update status to confirmed
    await this.prisma.groupOfferingInstance.update({
      where: { id: instanceId },
      data: {
        autoCancelChecked: true,
        status: 'CONFIRMED',
      },
    });

    return {
      cancelled: false,
      message: `Instance confirmed with ${confirmedEnrollments} participants`,
    };
  }

  /**
   * Cancel a group instance and handle refunds
   */
  private async cancelInstance(
    instanceId: string,
    options: { reason: string; refund: boolean },
  ) {
    return await this.prisma.$transaction(async (tx) => {
      // Get instance with all related data
      const instance = await tx.groupOfferingInstance.findUnique({
        where: { id: instanceId },
        include: {
          offering: {
            select: {
              id: true,
              title: true,
              instructorId: true,
            },
          },
          bookings: {
            where: {
              status: { in: ['PENDING', 'ACCEPTED'] },
            },
            include: {
              student: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          liveSession: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (!instance) {
        throw new BadRequestException('Instance not found');
      }

      if (instance.status === 'CANCELLED') {
        this.logger.warn(`Instance ${instanceId} already cancelled`);
        return instance;
      }

      // Cancel the instance
      const cancelledInstance = await tx.groupOfferingInstance.update({
        where: { id: instanceId },
        data: {
          status: 'CANCELLED',
          isBookable: false,
          cancelledAt: new Date(),
          cancelReason: options.reason,
          autoCancelChecked: true,
        },
      });

      // Cancel associated live session if exists and not started
      if (instance.liveSession && instance.liveSession.status === 'SCHEDULED') {
        await tx.liveSession.update({
          where: { id: instance.liveSession.id },
          data: {
            status: 'CANCELLED',
          },
        });
      }

      // Cancel all pending/accepted bookings
      const cancelledBookings = await tx.bookingRequest.updateMany({
        where: {
          groupInstanceId: instanceId,
          status: { in: ['PENDING', 'ACCEPTED'] },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Process refunds if enabled
      if (options.refund) {
        for (const booking of instance.bookings) {
          if (booking.paymentStatus === 'PAID') {
            try {
              await this.paymentService.processRefund({
                bookingId: booking.id,
                reason:
                  'Group session auto-cancelled - minimum participants not met',
                amount: booking.finalPrice || booking.offeredPrice,
              });

              // Update booking payment status
              await tx.bookingRequest.update({
                where: { id: booking.id },
                data: {
                  paymentStatus: 'REFUNDED',
                },
              });

              this.logger.log(
                `Refunded booking ${booking.id}: ${booking.finalPrice || booking.offeredPrice}`,
              );
            } catch (error) {
              this.logger.error(
                `Failed to refund booking ${booking.id}: ${error.message}`,
              );
            }
          }
        }
      }

      // Send notifications to all affected students
      for (const booking of instance.bookings) {
        await this.notificationService.createNotification({
          userId: booking.studentId,
          type: 'BOOKING_REJECTED' as any, // Using BOOKING_REJECTED as closest match
          title: 'Session Cancelled',
          message: `The group session "${instance.offering.title}" scheduled for ${new Date(instance.scheduledStart).toLocaleString()} has been cancelled. ${options.refund ? 'Your payment has been refunded.' : ''}`,
          sessionId: instance.liveSession?.id,
          bookingRequestId: booking.id,
        });
      }

      // Notify instructor
      await this.notificationService.createNotification({
        userId: instance.offering.instructorId,
        type: 'BOOKING_REJECTED' as any, // Using BOOKING_REJECTED as closest match
        title: 'Group Session Auto-Cancelled',
        message: `Your group session "${instance.offering.title}" has been auto-cancelled due to insufficient participants.`,
        sessionId: instance.liveSession?.id,
      });

      this.logger.log(
        `Cancelled instance ${instanceId}: ${cancelledBookings.count} bookings cancelled`,
      );

      return cancelledInstance;
    });
  }

  /**
   * Get instances that are approaching auto-cancel check time
   * Useful for sending warning notifications
   */
  async getInstancesApproachingAutoCancel(hoursBefore: number = 24) {
    const checkTime = new Date(Date.now() + hoursBefore * 60 * 60 * 1000);

    return await this.prisma.groupOfferingInstance.findMany({
      where: {
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        autoCancelAt: {
          lte: checkTime,
          gte: new Date(),
        },
        autoCancelChecked: false,
        offering: {
          autoCancelEnabled: true, // Check offering's setting
        },
      },
      include: {
        offering: {
          select: {
            id: true,
            title: true,
            minParticipants: true,
          },
        },
        bookings: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED'] },
          },
        },
      },
    });
  }
}
