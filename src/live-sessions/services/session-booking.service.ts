import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  OnModuleDestroy,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from '../../payment/payment.service';
import { LiveSessionService } from './live-session.service';
import {
  SessionStatus,
  PaymentStatus,
  ReservationStatus,
  ParticipantStatus,
  ParticipantRole,
  PayoutStatus,
  BookingMode,
  LiveSessionType,
  SessionFormat,
  SessionMode,
} from '@prisma/client';
import {
  CreateSessionBookingDto,
  ConfirmSessionBookingDto,
  CompleteSessionDto,
  SessionBookingFilterDto,
  CancelSessionBookingDto,
  RescheduleSessionDto,
  BookingStatus,
} from '../dto/session-booking.dto';

@Injectable()
export class SessionBookingService implements OnModuleDestroy {
  private readonly logger = new Logger(SessionBookingService.name);
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => LiveSessionService))
    private readonly liveSessionService: LiveSessionService,
  ) {
    // Run expired-booking cleanup every 5 minutes
    this.cleanupInterval = setInterval(
      () => this.cleanupAllExpiredBookings(),
      5 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Global cleanup: expire all abandoned bookings across all time slots.
   * Runs every 5 minutes via interval and can also be called manually.
   */
  async cleanupAllExpiredBookings(): Promise<number> {
    const now = new Date();
    const result = await this.prisma.bookingRequest.updateMany({
      where: {
        paymentStatus: PaymentStatus.PENDING,
        expiresAt: { lt: now },
        status: { in: ['PENDING', 'ACCEPTED'] },
      },
      data: {
        status: BookingStatus.EXPIRED,
        paymentStatus: PaymentStatus.EXPIRED,
      },
    });
    if (result.count > 0) {
      this.logger.log(`[Cleanup] Expired ${result.count} abandoned booking(s)`);

      // Recalculate isBooked for affected time slots
      const expiredBookings = await this.prisma.bookingRequest.findMany({
        where: { paymentStatus: PaymentStatus.EXPIRED },
        select: { timeSlotId: true },
        distinct: ['timeSlotId'],
      });

      for (const { timeSlotId } of expiredBookings) {
        if (!timeSlotId) continue;
        const activeCount = await this.prisma.bookingRequest.count({
          where: {
            timeSlotId,
            status: { in: ['PENDING', 'ACCEPTED'] },
            paymentStatus: { notIn: ['EXPIRED', 'FAILED', 'CANCELED'] },
          },
        });
        const slot = await this.prisma.timeSlot.findUnique({
          where: { id: timeSlotId },
          select: { maxBookings: true, currentBookings: true },
        });
        if (slot) {
          const totalActive = slot.currentBookings + activeCount;
          await this.prisma.timeSlot.update({
            where: { id: timeSlotId },
            data: { isBooked: totalActive >= slot.maxBookings },
          });
        }
      }
    }
    return result.count;
  }

  /**
   * Expire abandoned bookings for a specific time slot within a transaction.
   */
  private async expireAbandonedBookings(tx: any, timeSlotId: string) {
    const now = new Date();
    const expired = await tx.bookingRequest.updateMany({
      where: {
        timeSlotId,
        paymentStatus: PaymentStatus.PENDING,
        expiresAt: { lt: now },
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
      },
      data: {
        status: BookingStatus.EXPIRED,
        paymentStatus: PaymentStatus.EXPIRED,
      },
    });
    if (expired.count > 0) {
      this.logger.log(
        `Expired ${expired.count} abandoned booking(s) for time slot ${timeSlotId}`,
      );
    }
    return expired.count;
  }

  async createSessionBooking(dto: CreateSessionBookingDto) {
    // Use a database transaction to ensure atomicity and prevent race conditions
    return await this.prisma.$transaction(async (tx) => {
      // Clean up any expired unpaid bookings for this slot first
      await this.expireAbandonedBookings(tx, dto.timeSlotId);

      // ── Check if this student already has an active booking for this slot ──
      const existingBooking = await tx.bookingRequest.findFirst({
        where: {
          studentId: dto.studentId,
          timeSlotId: dto.timeSlotId,
          status: { in: ['PENDING', 'ACCEPTED'] },
          paymentStatus: { notIn: ['EXPIRED', 'FAILED', 'CANCELED'] },
        },
        include: {
          offering: { include: { instructor: true } },
          student: true,
          timeSlot: { include: { availability: true } },
        },
      });

      if (existingBooking) {
        // Student already has an unpaid booking for this slot — give them
        // the existing booking info so the frontend can redirect to payment.
        if (existingBooking.paymentStatus === PaymentStatus.PENDING) {
          this.logger.log(
            `Student ${dto.studentId} already has unpaid booking ${existingBooking.id} for slot ${dto.timeSlotId}`,
          );

          // Create a fresh Stripe checkout session for the existing booking
          const paymentResult =
            await this.paymentService.createSessionBookingPayment(
              existingBooking.id,
              existingBooking.offeringId,
              dto.studentId,
              existingBooking.offering.instructorId,
              existingBooking.finalPrice || existingBooking.offeredPrice,
              existingBooking.currency,
              dto.returnUrl,
              dto.cancelUrl,
            );

          if (paymentResult.success) {
            await tx.bookingRequest.update({
              where: { id: existingBooking.id },
              data: {
                stripeSessionId: paymentResult.checkoutSession!.id,
                expiresAt: new Date(Date.now() + 30 * 60 * 1000),
              },
            });
          }

          return {
            success: true,
            existingBooking: true,
            bookingRequest: existingBooking,
            paymentIntent: paymentResult.success ? paymentResult.paymentIntent : null,
            checkoutSession: paymentResult.success ? paymentResult.checkoutSession : null,
            autoApproved: existingBooking.status === BookingStatus.ACCEPTED,
            liveSession: null,
            message: 'You already have a booking for this time slot. Please complete your payment.',
          };
        }

        // Student already has a PAID booking
        if (existingBooking.paymentStatus === PaymentStatus.PAID) {
          throw new BadRequestException(
            'You already have a confirmed booking for this time slot.',
          );
        }
      }

      // Validate time slot availability with proper locking
      const timeSlot = await tx.timeSlot.findUnique({
        where: { id: dto.timeSlotId },
        include: {
          availability: {
            include: {
              instructor: true,
            },
          },
          bookingRequests: {
            where: {
              status: {
                in: ['PENDING', 'ACCEPTED'],
              },
              paymentStatus: {
                notIn: ['EXPIRED', 'FAILED', 'CANCELED'],
              },
            },
          },
          sessions: {
            where: {
              status: {
                in: ['SCHEDULED', 'IN_PROGRESS'],
              },
            },
          },
        },
      });

      if (!timeSlot) {
        throw new NotFoundException('Time slot not found');
      }

      if (!timeSlot.isAvailable || timeSlot.isBlocked) {
        throw new BadRequestException('Time slot is not available for booking');
      }

      // Count only active (non-expired, non-failed) bookings from OTHER students
      const activeBookingCount = timeSlot.bookingRequests.length;
      const totalBookings = timeSlot.currentBookings + activeBookingCount;
      if (totalBookings >= timeSlot.maxBookings) {
        throw new BadRequestException(
          'This time slot is fully booked. Please choose a different time.',
        );
      }

      if (timeSlot.sessions.length > 0) {
        throw new BadRequestException('Time slot has conflicting sessions');
      }

      // Validate offering
      const offering = await tx.sessionOffering.findUnique({
        where: { id: dto.offeringId },
        include: {
          instructor: true,
        },
      });

      if (!offering) {
        throw new NotFoundException('Session offering not found');
      }

      if (!offering.isActive) {
        throw new BadRequestException('Session offering is not active');
      }

      // Validate student
      const student = await tx.user.findUnique({
        where: { id: dto.studentId },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      // ── Auto-approval logic ──
      // Use the availability from the timeSlot relation (already loaded above)
      // instead of a separate query by specificDate that may miss due to
      // DateTime precision differences.
      const instructorProfile = await tx.instructorProfile.findUnique({
        where: { userId: offering.instructorId },
      });

      const availability = timeSlot.availability;

      const shouldAutoApprove = this.shouldAutoApproveBooking({
        instructorProfile,
        availability,
        timeSlot,
        offering,
        totalBookings,
      });

      // Create booking request — NO time slot update and NO live session
      // until payment is confirmed.
      const bookingRequest = await tx.bookingRequest.create({
        data: {
          offeringId: dto.offeringId,
          studentId: dto.studentId,
          bookingMode: BookingMode.DIRECT,
          timeSlotId: dto.timeSlotId,
          customTopic: dto.customTopic,
          studentMessage: dto.studentMessage,
          customRequirements: dto.customRequirements,
          offeredPrice: dto.agreedPrice,
          finalPrice: dto.agreedPrice,
          currency: dto.currency,
          status: shouldAutoApprove
            ? BookingStatus.ACCEPTED
            : BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          priority: 1,
        },
        include: {
          offering: {
            include: {
              instructor: true,
            },
          },
          student: true,
          timeSlot: {
            include: {
              availability: true,
            },
          },
        },
      });

      this.logger.debug(
        `Booking created: ${bookingRequest.id}, autoApprove=${shouldAutoApprove}, ` +
        `status=${bookingRequest.status}, payment=PENDING — awaiting payment before any slot/session changes`,
      );

      // Create Stripe checkout session
      const paymentResult =
        await this.paymentService.createSessionBookingPayment(
          bookingRequest.id,
          dto.offeringId,
          dto.studentId,
          offering.instructorId,
          dto.agreedPrice,
          dto.currency,
          dto.returnUrl,
          dto.cancelUrl,
        );

      if (!paymentResult.success) {
        throw new BadRequestException(
          paymentResult.error || 'Failed to create payment',
        );
      }

      // Store the Stripe checkout session ID on the booking
      await tx.bookingRequest.update({
        where: { id: bookingRequest.id },
        data: {
          stripeSessionId: paymentResult.checkoutSession!.id,
          paymentStatus: PaymentStatus.PENDING,
        },
      });

      return {
        success: true,
        existingBooking: false,
        bookingRequest,
        paymentIntent: paymentResult.paymentIntent,
        checkoutSession: paymentResult.checkoutSession,
        autoApproved: shouldAutoApprove,
        liveSession: null,
      };
    });
  }

  /**
   * Auto-approval logic.
   * Priority: Availability-level autoAcceptBookings overrides instructor profile.
   * The booking-window (min/max advance hours) is NOT checked here — it is
   * already enforced when generating/displaying available time slots. If a slot
   * is visible and bookable, the advance-hours constraint is satisfied.
   */
  private shouldAutoApproveBooking(params: {
    instructorProfile: any;
    availability: any;
    timeSlot: any;
    offering: any;
    totalBookings: number;
  }): boolean {
    const {
      instructorProfile,
      availability,
      timeSlot,
      offering,
      totalBookings,
    } = params;

    // 1) Determine auto-accept setting (availability overrides profile)
    const slotAutoAccept = availability?.autoAcceptBookings;
    const shouldAutoAccept =
      slotAutoAccept !== undefined
        ? slotAutoAccept
        : instructorProfile?.autoAcceptBookings === true;

    if (!shouldAutoAccept) {
      this.logger.debug('Auto-accept: disabled (availability or profile)');
      return false;
    }

    // 2) Check if offering explicitly disables auto-accept
    const offeringAllowsAutoAccept = offering?.autoAcceptBookings !== false;

    // 3) Check capacity
    const hasCapacity = totalBookings < timeSlot.maxBookings;

    // 4) Instructor-level gates
    const instructorAcceptingStudents =
      instructorProfile?.isAcceptingStudents !== false;
    const liveSessionsEnabled =
      instructorProfile?.liveSessionsEnabled !== false;

    const result =
      offeringAllowsAutoAccept &&
      hasCapacity &&
      instructorAcceptingStudents &&
      liveSessionsEnabled;

    this.logger.debug('Auto-accept evaluation:', {
      slotAutoAccept,
      shouldAutoAccept,
      offeringAllowsAutoAccept,
      hasCapacity,
      instructorAcceptingStudents,
      liveSessionsEnabled,
      finalResult: result,
    });

    return result;
  }

  /**
   * Create live session from booking within a transaction
   */
  private async createLiveSessionFromBookingInTransaction(
    bookingRequest: any,
    tx: any,
  ) {
    // Create live session
    const liveSession = await tx.liveSession.create({
      data: {
        bookingRequestId: bookingRequest.id,
        offeringId: bookingRequest.offeringId,
        instructorId: bookingRequest.offering.instructorId,
        sessionType: LiveSessionType.CUSTOM,
        title: bookingRequest.customTopic || bookingRequest.offering.title,
        description: bookingRequest.offering.description,
        finalTopic: bookingRequest.customTopic,
        format: bookingRequest.offering.sessionType,
        sessionFormat: bookingRequest.offering.sessionFormat,
        sessionMode: SessionMode.LIVE,
        maxParticipants: bookingRequest.offering.capacity,
        minParticipants: bookingRequest.offering.minParticipants || 1,
        currentParticipants: 1,
        scheduledStart: bookingRequest.timeSlot!.startTime,
        scheduledEnd: bookingRequest.timeSlot!.endTime,
        duration: bookingRequest.offering.duration,
        pricePerPerson: bookingRequest.finalPrice || 0,
        totalPrice: bookingRequest.finalPrice || 0,
        totalRevenue: bookingRequest.finalPrice || 0,
        platformFee: (bookingRequest.finalPrice || 0) * 0.2, // 20% platform fee
        instructorPayout: (bookingRequest.finalPrice || 0) * 0.8, // 80% to instructor
        currency: bookingRequest.currency,
        status: SessionStatus.SCHEDULED,
        timeSlotId: bookingRequest.timeSlotId || undefined,
        materials: bookingRequest.offering.materials,
        recordingEnabled: bookingRequest.offering.recordingEnabled,
      },
    });

    // Create session participant
    await tx.sessionParticipant.create({
      data: {
        sessionId: liveSession.id,
        userId: bookingRequest.studentId,
        role: ParticipantRole.STUDENT,
        status: ParticipantStatus.ENROLLED,
        paidAmount: bookingRequest.finalPrice || 0,
        currency: bookingRequest.currency,
        paymentDate: new Date(),
      },
    });

    // Create session reservation
    await tx.sessionReservation.create({
      data: {
        sessionId: liveSession.id,
        learnerId: bookingRequest.studentId,
        status: ReservationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING, // Keep as PENDING until session completion
        agreedPrice: bookingRequest.finalPrice || 0,
        currency: bookingRequest.currency,
        confirmedAt: new Date(),
      },
    });

    // Generate meeting room ID (will be updated when Stream call is created on session start)
    const meetingRoomId = this.generateMeetingId(liveSession.id);
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const inAppPath = `${frontendUrl}/sessions/${liveSession.id}/video-call`;

    const updatedLiveSession = await tx.liveSession.update({
      where: { id: liveSession.id },
      data: {
        meetingRoomId,
        meetingLink: inAppPath,
      },
    });

    return {
      ...updatedLiveSession,
      meetingRoomId,
      meetingLink: inAppPath,
    };
  }

  async confirmSessionBooking(dto: ConfirmSessionBookingDto) {
    // Use a database transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      // Check if this booking was already expired
      const preCheck = await tx.bookingRequest.findUnique({
        where: { id: dto.bookingId },
        select: { status: true, paymentStatus: true, expiresAt: true, timeSlotId: true },
      });

      if (!preCheck) {
        throw new NotFoundException('Booking request not found');
      }

      // If the webhook already marked payment as PAID, treat this as idempotent success
      if (preCheck.paymentStatus === PaymentStatus.PAID) {
        this.logger.log(
          `Booking ${dto.bookingId} already has paymentStatus=PAID (likely via webhook). Proceeding to finalize.`,
        );
      } else {
        // Only enforce expiry checks when payment is still pending
        if (preCheck.status === BookingStatus.EXPIRED || preCheck.paymentStatus === PaymentStatus.EXPIRED) {
          throw new BadRequestException('This booking has expired. Please create a new booking.');
        }

        if (preCheck.expiresAt && new Date() > preCheck.expiresAt && preCheck.paymentStatus === PaymentStatus.PENDING) {
          await tx.bookingRequest.update({
            where: { id: dto.bookingId },
            data: { status: BookingStatus.EXPIRED, paymentStatus: PaymentStatus.EXPIRED },
          });
          throw new BadRequestException('This booking has expired. Please create a new booking.');
        }
      }

      const bookingRequest = await tx.bookingRequest.findUnique({
        where: { id: dto.bookingId },
        include: {
          offering: {
            include: {
              instructor: true,
            },
          },
          student: true,
          timeSlot: {
            include: {
              availability: true,
              bookingRequests: {
                where: {
                  status: {
                    in: ['PENDING', 'ACCEPTED'],
                  },
                  id: {
                    not: dto.bookingId,
                  },
                },
              },
              sessions: {
                where: {
                  status: {
                    in: ['SCHEDULED', 'IN_PROGRESS'],
                  },
                },
              },
            },
          },
        },
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }

      const timeSlot = bookingRequest.timeSlot;
      if (!timeSlot) {
        throw new BadRequestException('Time slot not found for this booking');
      }

      if (!timeSlot.isAvailable || timeSlot.isBlocked) {
        throw new BadRequestException(
          'Time slot is no longer available for booking',
        );
      }

      if (timeSlot.sessions.length > 0) {
        throw new BadRequestException('Time slot has conflicting sessions');
      }

      // Skip expiry check when already PAID (webhook beat us)
      if (
        bookingRequest.paymentStatus !== PaymentStatus.PAID &&
        bookingRequest.expiresAt &&
        new Date() > bookingRequest.expiresAt
      ) {
        throw new BadRequestException('Booking request has expired');
      }

      // Get PaymentIntent from checkout session if not already stored
      let paymentIntentId = dto.paymentIntentId || bookingRequest.paymentIntentId;
      if (!paymentIntentId && bookingRequest.stripeSessionId) {
        try {
          const paymentIntentResult =
            await this.paymentService.getPaymentIntentFromCheckoutSession(
              bookingRequest.stripeSessionId,
            );

          if (paymentIntentResult.success) {
            paymentIntentId = paymentIntentResult.paymentIntent!.id;

            await tx.bookingRequest.update({
              where: { id: dto.bookingId },
              data: { paymentIntentId },
            });
          }
        } catch (err) {
          this.logger.warn(
            `Could not retrieve PaymentIntent for booking ${dto.bookingId}: ${err.message}`,
          );
        }
      }

      // Verify payment intent status — accept requires_capture OR succeeded
      if (paymentIntentId && bookingRequest.paymentStatus !== PaymentStatus.PAID) {
        try {
          const paymentIntentResult =
            await this.paymentService.getPaymentIntentFromCheckoutSession(
              bookingRequest.stripeSessionId!,
            );

          if (paymentIntentResult.success) {
            const status = paymentIntentResult.paymentIntent!.status;
            const validStatuses = ['requires_capture', 'succeeded', 'processing'];
            if (!validStatuses.includes(status)) {
              throw new BadRequestException(
                `Payment is not ready. Current status: ${status}. Expected one of: ${validStatuses.join(', ')}`,
              );
            }
          }
        } catch (err) {
          if (err instanceof BadRequestException) throw err;
          this.logger.warn(
            `PaymentIntent verification failed for booking ${dto.bookingId}: ${err.message}`,
          );
        }
      }

      const wasAutoApproved = bookingRequest.status === BookingStatus.ACCEPTED;
      let liveSession: any = null;

      if (wasAutoApproved) {
        liveSession = await tx.liveSession.findUnique({
          where: { bookingRequestId: bookingRequest.id },
        });

        if (!liveSession) {
          liveSession = await tx.liveSession.create({
            data: {
              bookingRequestId: bookingRequest.id,
              offeringId: bookingRequest.offeringId,
              instructorId: bookingRequest.offering.instructorId,
              sessionType: LiveSessionType.CUSTOM,
              title: bookingRequest.customTopic || bookingRequest.offering.title,
              description: bookingRequest.offering.description,
              finalTopic: bookingRequest.customTopic,
              format: bookingRequest.offering.sessionType,
              sessionFormat: bookingRequest.offering.sessionFormat,
              sessionMode: SessionMode.LIVE,
              maxParticipants: bookingRequest.offering.capacity,
              minParticipants: bookingRequest.offering.minParticipants || 1,
              currentParticipants: 1,
              scheduledStart: bookingRequest.timeSlot!.startTime,
              scheduledEnd: bookingRequest.timeSlot!.endTime,
              duration: bookingRequest.offering.duration,
              pricePerPerson: bookingRequest.finalPrice || 0,
              totalPrice: bookingRequest.finalPrice || 0,
              totalRevenue: bookingRequest.finalPrice || 0,
              platformFee: (bookingRequest.finalPrice || 0) * 0.2,
              instructorPayout: (bookingRequest.finalPrice || 0) * 0.8,
              currency: bookingRequest.currency,
              status: SessionStatus.SCHEDULED,
              timeSlotId: bookingRequest.timeSlotId || undefined,
              materials: bookingRequest.offering.materials,
              recordingEnabled: bookingRequest.offering.recordingEnabled,
            },
          });

          // Only increment time slot count when we actually create the live session
          await tx.timeSlot.update({
            where: { id: bookingRequest.timeSlotId! },
            data: {
              currentBookings: { increment: 1 },
              isBooked: timeSlot.currentBookings + 1 >= timeSlot.maxBookings,
            },
          });
        }

        const existingParticipant = await tx.sessionParticipant.findFirst({
          where: {
            sessionId: liveSession.id,
            userId: bookingRequest.studentId,
          },
        });

        if (!existingParticipant) {
          await tx.sessionParticipant.create({
            data: {
              sessionId: liveSession.id,
              userId: bookingRequest.studentId,
              role: ParticipantRole.STUDENT,
              status: ParticipantStatus.ENROLLED,
              paidAmount: bookingRequest.finalPrice || 0,
              currency: bookingRequest.currency,
              paymentDate: new Date(),
            },
          });
        }

        const existingReservation = await tx.sessionReservation.findFirst({
          where: {
            sessionId: liveSession.id,
            learnerId: bookingRequest.studentId,
          },
        });

        if (!existingReservation) {
          await tx.sessionReservation.create({
            data: {
              sessionId: liveSession.id,
              learnerId: bookingRequest.studentId,
              status: ReservationStatus.CONFIRMED,
              paymentStatus: PaymentStatus.PENDING,
              agreedPrice: bookingRequest.finalPrice || 0,
              currency: bookingRequest.currency,
              confirmedAt: new Date(),
            },
          });
        }

        await tx.bookingRequest.update({
          where: { id: dto.bookingId },
          data: {
            paymentStatus: PaymentStatus.PAID,
            acceptedAt: bookingRequest.acceptedAt || new Date(),
            liveSession: {
              connect: { id: liveSession.id },
            },
          },
        });

        const meetingRoomId = this.generateMeetingId(liveSession.id);
        const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
        const inAppPath = `${frontendUrl}/sessions/${liveSession.id}/video-call`;

        await tx.liveSession.update({
          where: { id: liveSession.id },
          data: {
            meetingRoomId,
            meetingLink: inAppPath,
          },
        });
      } else {
        this.logger.log(
          `Booking ${dto.bookingId} requires instructor approval — payment marked PAID, booking status stays PENDING`,
        );

        await tx.bookingRequest.update({
          where: { id: dto.bookingId },
          data: {
            paymentStatus: PaymentStatus.PAID,
          },
        });
      }

      return {
        success: true,
        autoApproved: wasAutoApproved,
        liveSession: liveSession || null,
        bookingRequest: {
          ...bookingRequest,
          paymentStatus: PaymentStatus.PAID,
          status: wasAutoApproved ? BookingStatus.ACCEPTED : bookingRequest.status,
        },
        paymentIntent: {
          id: paymentIntentId || dto.paymentIntentId,
          status: 'requires_capture',
          amount: bookingRequest.finalPrice || 0,
          currency: bookingRequest.currency,
        },
      };
    });
  }

  /**
   * Allow a student to retry / resume payment for an unpaid booking.
   * Creates a fresh Stripe checkout session and extends the expiry window.
   */
  async retryBookingPayment(
    bookingId: string,
    studentId: string,
    returnUrl: string,
    cancelUrl: string,
  ) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        offering: { include: { instructor: true } },
        student: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.studentId !== studentId) {
      throw new ForbiddenException('You can only retry payment for your own bookings');
    }

    // Only allow retry if payment is still PENDING or EXPIRED (but booking not rejected/cancelled)
    if (
      booking.paymentStatus !== PaymentStatus.PENDING &&
      booking.paymentStatus !== PaymentStatus.EXPIRED
    ) {
      throw new BadRequestException(
        `Payment cannot be retried. Current payment status: ${booking.paymentStatus}`,
      );
    }

    if (
      booking.status === BookingStatus.REJECTED ||
      booking.status === BookingStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'This booking has been rejected or cancelled and cannot be retried.',
      );
    }

    // Create a new Stripe checkout session
    const paymentResult =
      await this.paymentService.createSessionBookingPayment(
        booking.id,
        booking.offeringId,
        booking.studentId,
        booking.offering.instructorId,
        booking.finalPrice || booking.offeredPrice,
        booking.currency,
        returnUrl,
        cancelUrl,
      );

    if (!paymentResult.success) {
      throw new BadRequestException(
        paymentResult.error || 'Failed to create payment session',
      );
    }

    // Reset the booking: if it was EXPIRED reset to PENDING, otherwise keep current status
    const resetStatus =
      (booking.status as string) === 'EXPIRED'
        ? BookingStatus.PENDING
        : booking.status;

    await this.prisma.bookingRequest.update({
      where: { id: bookingId },
      data: {
        stripeSessionId: paymentResult.checkoutSession!.id,
        paymentStatus: PaymentStatus.PENDING,
        status: resetStatus,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    this.logger.log(`Payment retry initiated for booking ${bookingId}`);

    return {
      success: true,
      checkoutSession: paymentResult.checkoutSession,
      paymentIntent: paymentResult.paymentIntent,
      bookingId,
    };
  }

  async completeSession(dto: CompleteSessionDto) {
    return this.liveSessionService.endLiveSession(dto.sessionId, {
      notes: dto.summary,
      summary: dto.summary,
      instructorNotes: dto.instructorNotes,
      sessionArtifacts: dto.sessionArtifacts,
      actualDuration: dto.actualDuration,
    });
  }

  async approveSessionBooking(
    bookingId: string,
    instructorId: string,
    instructorMessage?: string,
  ) {
    // Use a database transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      const bookingRequest = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          offering: {
            include: {
              instructor: true,
            },
          },
          student: true,
          timeSlot: {
            include: {
              availability: true,
              bookingRequests: {
                where: {
                  status: {
                    in: ['PENDING', 'ACCEPTED'],
                  },
                  id: {
                    not: bookingId, // Exclude this booking request
                  },
                },
              },
              sessions: {
                where: {
                  status: {
                    in: ['SCHEDULED', 'IN_PROGRESS'],
                  },
                },
              },
            },
          },
        },
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }

      // Verify the instructor owns this booking
      if (bookingRequest.offering.instructorId !== instructorId) {
        throw new ForbiddenException('You can only approve your own bookings');
      }

      // Check if booking has expired
      if (
        bookingRequest.status === BookingStatus.EXPIRED ||
        (bookingRequest.paymentStatus as string) === 'EXPIRED'
      ) {
        throw new BadRequestException(
          'This booking has expired and can no longer be approved.',
        );
      }

      // Check if booking is in pending status
      if (bookingRequest.status !== BookingStatus.PENDING) {
        throw new BadRequestException('Only pending bookings can be approved');
      }

      // Only allow approval if the student has completed payment
      if (
        bookingRequest.paymentStatus !== PaymentStatus.PAID &&
        bookingRequest.paymentStatus !== PaymentStatus.FREE
      ) {
        throw new BadRequestException(
          'Cannot approve booking — the student has not completed payment yet. ' +
          `Current payment status: ${bookingRequest.paymentStatus}`,
        );
      }

      // Enhanced slot availability validation
      const timeSlot = bookingRequest.timeSlot;
      if (!timeSlot) {
        throw new BadRequestException('Time slot not found for this booking');
      }

      if (!timeSlot.isAvailable || timeSlot.isBlocked) {
        throw new BadRequestException(
          'Time slot is no longer available for booking',
        );
      }

      // Check if slot has capacity
      const totalBookings = timeSlot.currentBookings;

      this.logger.debug(`Slot capacity check for approval:`, {
        timeSlotId: timeSlot.id,
        currentBookings: timeSlot.currentBookings,
        maxBookings: timeSlot.maxBookings,
        hasCapacity: totalBookings < timeSlot.maxBookings,
      });

      if (totalBookings >= timeSlot.maxBookings) {
        throw new BadRequestException('Time slot is already fully booked');
      }

      // Check if there are conflicting sessions
      if (timeSlot.sessions.length > 0) {
        throw new BadRequestException('Time slot has conflicting sessions');
      }

      // Update booking request status
      await tx.bookingRequest.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.ACCEPTED,
          instructorResponse: instructorMessage,
          acceptedAt: new Date(),
        },
      });

      // Update time slot booking count
      await tx.timeSlot.update({
        where: { id: timeSlot.id },
        data: {
          currentBookings: {
            increment: 1,
          },
          isBooked: totalBookings + 1 >= timeSlot.maxBookings,
        },
      });

      // Create live session
      const liveSession = await this.createLiveSessionFromBookingInTransaction(
        bookingRequest,
        tx,
      );

      return {
        success: true,
        message: 'Booking approved successfully',
        bookingRequest: {
          ...bookingRequest,
          status: BookingStatus.ACCEPTED,
          instructorResponse: instructorMessage,
          acceptedAt: new Date(),
        },
        liveSession,
      };
    });
  }

  async rejectSessionBooking(
    bookingId: string,
    instructorId: string,
    reason?: string,
  ) {
    // Use a database transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      const bookingRequest = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          offering: {
            include: {
              instructor: true,
            },
          },
          student: true,
          timeSlot: true,
          liveSession: true,
        },
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }

      // Verify the instructor owns this booking
      if (bookingRequest.offering.instructorId !== instructorId) {
        throw new ForbiddenException('You can only reject your own bookings');
      }

      // Check if booking is in pending status
      if (bookingRequest.status !== BookingStatus.PENDING) {
        throw new BadRequestException('Only pending bookings can be rejected');
      }

      // Handle payment processing based on payment status
      let paymentHandlingResult: any = null;

      if (bookingRequest.paymentIntentId) {
        // Payment was made - process refund
        try {
          this.logger.log(
            `Processing refund for rejected booking ${bookingId}, payment intent: ${bookingRequest.paymentIntentId}`,
          );

          const refundResult = await this.paymentService.refundSessionPayment(
            bookingRequest.paymentIntentId,
            'instructor_rejected',
          );

          if (refundResult.success) {
            paymentHandlingResult = {
              success: true,
              refundId: refundResult.refund?.id,
              amount: refundResult.refund?.amount,
              currency: refundResult.refund?.currency,
              message: 'Refund processed successfully',
            };

            this.logger.log(
              `Refund processed successfully: ${refundResult.refund?.id}`,
            );
          } else {
            paymentHandlingResult = {
              success: false,
              error: refundResult.error,
              requiresManualIntervention: true,
            };

            this.logger.error(
              `Refund failed for booking ${bookingId}:`,
              refundResult.error,
            );
          }
        } catch (error) {
          this.logger.error(
            `Exception during refund processing for booking ${bookingId}:`,
            error,
          );
          paymentHandlingResult = {
            success: false,
            error: error.message,
            requiresManualIntervention: true,
          };
        }
      } else if (bookingRequest.stripeSessionId) {
        // Payment session exists but no payment intent yet - log for manual intervention
        this.logger.log(
          `Stripe session exists for rejected booking ${bookingId}, session: ${bookingRequest.stripeSessionId}`,
        );

        paymentHandlingResult = {
          success: false,
          error:
            'Stripe session exists but no payment intent - requires manual intervention',
          requiresManualIntervention: true,
          message: 'Payment session requires manual cancellation',
        };

        this.logger.warn(
          `Stripe session ${bookingRequest.stripeSessionId} requires manual cancellation for rejected booking ${bookingId}`,
        );
      } else {
        // No payment made yet
        paymentHandlingResult = {
          success: true,
          noPaymentToProcess: true,
          message: 'No payment to process',
        };
      }

      // Update time slot if it was already booked
      if (bookingRequest.timeSlot) {
        await tx.timeSlot.update({
          where: { id: bookingRequest.timeSlot.id },
          data: {
            currentBookings: {
              decrement: 1,
            },
            isBooked: false,
          },
        });
      }

      // Cancel live session if it was created
      if (bookingRequest.liveSession) {
        await tx.liveSession.update({
          where: { id: bookingRequest.liveSession.id },
          data: {
            status: SessionStatus.CANCELLED,
          },
        });
      }

      // Update booking request with comprehensive status changes
      const updatedBookingRequest = await tx.bookingRequest.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.REJECTED,
          instructorResponse: reason,
          rejectedAt: new Date(),
          paymentStatus:
            paymentHandlingResult?.success &&
            !paymentHandlingResult?.noPaymentToProcess
              ? PaymentStatus.REFUNDED
              : PaymentStatus.CANCELED,
        },
      });

      // Send notification to student about rejection
      // This would typically be handled by a notification service
      this.logger.log(
        `Sending rejection notification to student ${bookingRequest.studentId} for booking ${bookingId}`,
      );

      return {
        success: true,
        message: 'Booking rejected successfully',
        bookingRequest: updatedBookingRequest,
        paymentHandling: paymentHandlingResult,
        requiresManualIntervention:
          paymentHandlingResult?.requiresManualIntervention || false,
      };
    });
  }

  async cancelSessionBooking(dto: CancelSessionBookingDto) {
    // Use a database transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      const bookingRequest = await tx.bookingRequest.findUnique({
        where: { id: dto.bookingId },
        include: {
          liveSession: true,
          timeSlot: true,
        },
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }

      // Handle payment processing based on payment status
      let paymentHandlingResult: any = null;

      if (dto.processRefund && bookingRequest.paymentIntentId) {
        try {
          this.logger.log(
            `Processing refund for cancelled booking ${dto.bookingId}, payment intent: ${bookingRequest.paymentIntentId}`,
          );

          const refundResult = await this.paymentService.refundSessionPayment(
            bookingRequest.paymentIntentId,
            'requested_by_customer',
          );

          if (refundResult.success) {
            paymentHandlingResult = {
              success: true,
              refundId: refundResult.refund?.id,
              amount: refundResult.refund?.amount,
              currency: refundResult.refund?.currency,
              message: 'Refund processed successfully',
            };

            this.logger.log(
              `Refund processed successfully: ${refundResult.refund?.id}`,
            );
          } else {
            paymentHandlingResult = {
              success: false,
              error: refundResult.error,
              requiresManualIntervention: true,
            };

            this.logger.error(
              `Refund failed for booking ${dto.bookingId}:`,
              refundResult.error,
            );
            throw new BadRequestException('Failed to process refund');
          }
        } catch (error) {
          this.logger.error(
            `Exception during refund processing for booking ${dto.bookingId}:`,
            error,
          );
          throw new BadRequestException('Failed to process refund');
        }
      } else if (
        bookingRequest.stripeSessionId &&
        !bookingRequest.paymentIntentId
      ) {
        // Payment session exists but no payment intent yet - log for manual intervention
        this.logger.log(
          `Stripe session exists for cancelled booking ${dto.bookingId}, session: ${bookingRequest.stripeSessionId}`,
        );

        paymentHandlingResult = {
          success: false,
          error:
            'Stripe session exists but no payment intent - requires manual intervention',
          requiresManualIntervention: true,
          message: 'Payment session requires manual cancellation',
        };

        this.logger.warn(
          `Stripe session ${bookingRequest.stripeSessionId} requires manual cancellation for cancelled booking ${dto.bookingId}`,
        );
      } else {
        // No payment to process
        paymentHandlingResult = {
          success: true,
          noPaymentToProcess: true,
          message: 'No payment to process',
        };
      }

      // Update time slot if session was created
      if (bookingRequest.liveSession) {
        await tx.timeSlot.update({
          where: { id: bookingRequest.timeSlotId! },
          data: {
            currentBookings: {
              decrement: 1,
            },
            isBooked: false,
          },
        });

        await tx.liveSession.update({
          where: { id: bookingRequest.liveSession.id },
          data: {
            status: SessionStatus.CANCELLED,
          },
        });
      }

      // Update booking request status
      const updatedBookingRequest = await tx.bookingRequest.update({
        where: { id: dto.bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          paymentStatus:
            paymentHandlingResult?.success &&
            !paymentHandlingResult?.noPaymentToProcess
              ? PaymentStatus.REFUNDED
              : PaymentStatus.CANCELED,
        },
      });

      return {
        success: true,
        message: 'Booking cancelled successfully',
        bookingRequest: updatedBookingRequest,
        paymentHandling: paymentHandlingResult,
        refundProcessed: dto.processRefund,
        requiresManualIntervention:
          paymentHandlingResult?.requiresManualIntervention || false,
      };
    });
  }

  async rescheduleSession(dto: RescheduleSessionDto) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id: dto.bookingId },
      include: {
        liveSession: true,
        timeSlot: true,
      },
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    // Validate new time slot
    const newTimeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: dto.newTimeSlotId },
    });

    if (!newTimeSlot || !newTimeSlot.isAvailable || newTimeSlot.isBooked) {
      throw new BadRequestException('New time slot is not available');
    }

    // Update booking request
    await this.prisma.bookingRequest.update({
      where: { id: dto.bookingId },
      data: {
        timeSlotId: dto.newTimeSlotId,
        rescheduleCount: {
          increment: 1,
        },
      },
    });

    // Update live session if exists
    if (bookingRequest.liveSession) {
      await this.prisma.liveSession.update({
        where: { id: bookingRequest.liveSession.id },
        data: {
          scheduledStart: newTimeSlot.startTime,
          scheduledEnd: newTimeSlot.endTime,
          timeSlotId: dto.newTimeSlotId,
        },
      });
    }

    // Update time slots
    await this.prisma.timeSlot.update({
      where: { id: bookingRequest.timeSlotId! },
      data: {
        currentBookings: {
          decrement: 1,
        },
        isBooked: false,
      },
    });

    await this.prisma.timeSlot.update({
      where: { id: dto.newTimeSlotId },
      data: {
        currentBookings: {
          increment: 1,
        },
        isBooked: true,
      },
    });

    return {
      success: true,
      message: 'Session rescheduled successfully',
    };
  }

  async getSessionBookings(filter: SessionBookingFilterDto = {}) {
    const { instructorId, studentId, status, offeringId, startDate, endDate } =
      filter;

    const where: any = {};

    if (instructorId) {
      where.offering = { instructorId };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (status) {
      where.status = status;
    }

    if (offeringId) {
      where.offeringId = offeringId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const bookings = await this.prisma.bookingRequest.findMany({
      where,
      include: {
        offering: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true,
          },
        },
        timeSlot: {
          include: {
            availability: true,
          },
        },
        liveSession: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true,
            meetingLink: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return bookings;
  }

  async getSessionBookingById(id: string) {
    const booking = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        offering: {
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                email: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true,
          },
        },
        timeSlot: {
          include: {
            availability: true,
          },
        },
        liveSession: {
          include: {
            participants: true,
            reservations: true,
          },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking request not found');
    }

    return booking;
  }

  // REMOVED: Duplicate startSession method
  // Use LiveSessionService.startLiveSession instead
  // This method was removed to consolidate session lifecycle operations

  private generateMeetingId(sessionId: string): string {
    // Generate a unique meeting ID based on session ID and timestamp
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `session-${sessionId}-${timestamp}-${randomSuffix}`;
  }

  private async createLiveSessionFromBooking(bookingRequest: any) {
    // Create live session
    const liveSession = await this.prisma.liveSession.create({
      data: {
        bookingRequestId: bookingRequest.id,
        offeringId: bookingRequest.offeringId,
        instructorId: bookingRequest.offering.instructorId,
        sessionType: LiveSessionType.CUSTOM,
        title: bookingRequest.customTopic || bookingRequest.offering.title,
        description: bookingRequest.offering.description,
        finalTopic: bookingRequest.customTopic,
        format: bookingRequest.offering.sessionType,
        sessionFormat: bookingRequest.offering.sessionFormat,
        sessionMode: SessionMode.LIVE,
        maxParticipants: bookingRequest.offering.capacity,
        minParticipants: bookingRequest.offering.minParticipants || 1,
        currentParticipants: 1,
        scheduledStart: bookingRequest.timeSlot!.startTime,
        scheduledEnd: bookingRequest.timeSlot!.endTime,
        duration: bookingRequest.offering.duration,
        pricePerPerson: bookingRequest.finalPrice || 0,
        totalPrice: bookingRequest.finalPrice || 0,
        totalRevenue: bookingRequest.finalPrice || 0,
        platformFee: (bookingRequest.finalPrice || 0) * 0.2, // 20% platform fee
        instructorPayout: (bookingRequest.finalPrice || 0) * 0.8, // 80% to instructor
        currency: bookingRequest.currency,
        status: SessionStatus.SCHEDULED,
        timeSlotId: bookingRequest.timeSlotId || undefined,
        materials: bookingRequest.offering.materials,
        recordingEnabled: bookingRequest.offering.recordingEnabled,
      },
    });

    // Create session participant
    await this.prisma.sessionParticipant.create({
      data: {
        sessionId: liveSession.id,
        userId: bookingRequest.studentId,
        role: ParticipantRole.STUDENT,
        status: ParticipantStatus.ENROLLED,
        paidAmount: bookingRequest.finalPrice || 0,
        currency: bookingRequest.currency,
        paymentDate: new Date(),
      },
    });

    // Create session reservation
    await this.prisma.sessionReservation.create({
      data: {
        sessionId: liveSession.id,
        learnerId: bookingRequest.studentId,
        status: ReservationStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING, // Keep as PENDING until session completion
        agreedPrice: bookingRequest.finalPrice || 0,
        currency: bookingRequest.currency,
        confirmedAt: new Date(),
      },
    });

    // Update time slot booking count
    await this.prisma.timeSlot.update({
      where: { id: bookingRequest.timeSlotId! },
      data: {
        currentBookings: {
          increment: 1,
        },
        isBooked: true,
      },
    });

    const meetingRoomId = this.generateMeetingId(liveSession.id);
    const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    const inAppPath = `${frontendUrl}/sessions/${liveSession.id}/video-call`;

    const updatedLiveSession = await this.prisma.liveSession.update({
      where: { id: liveSession.id },
      data: {
        meetingRoomId,
        meetingLink: inAppPath,
      },
    });

    return {
      ...updatedLiveSession,
      meetingRoomId,
      meetingLink: inAppPath,
    };
  }
}
