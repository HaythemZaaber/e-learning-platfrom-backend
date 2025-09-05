import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from '../../payment/payment.service';

@Injectable()
export class PayoutService {
  private readonly logger = new Logger(PayoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async processInstructorPayout(instructorId: string, sessionIds: string[]) {
    // Get instructor's Stripe Connect account
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId }
    });

    if (!instructor || !(instructor as any).stripeAccountId) {
      throw new BadRequestException('Instructor has not set up payment processing');
    }

    // Get completed sessions that need payout
    const sessions = await this.prisma.liveSession.findMany({
      where: {
        id: { in: sessionIds },
        instructorId,
        status: 'COMPLETED',
        payoutStatus: 'PENDING'
      },
      include: {
        bookingRequest: true
      }
    });

    if (sessions.length === 0) {
      throw new BadRequestException('No completed sessions found for payout');
    }

    // Calculate total payout amount
    let totalPayoutAmount = 0;
    const payoutSessions: Array<{
      sessionId: string;
      sessionAmount: number;
      platformFee: number;
      netAmount: number;
    }> = [];

    for (const session of sessions) {
      const instructorPayout = session.instructorPayout || ((session.totalPrice || 0) * 0.80);
      totalPayoutAmount += instructorPayout;
      
      payoutSessions.push({
        sessionId: session.id,
        sessionAmount: session.totalPrice || 0,
        platformFee: session.platformFee,
        netAmount: instructorPayout
      });
    }

    // Use the payment service to process instructor payout
    const payoutResult = await this.paymentService.processInstructorPayout(instructorId, sessionIds);
    
    if (!payoutResult.success) {
      throw new BadRequestException(payoutResult.error || 'Failed to process payout');
    }

    return payoutResult;
  }

  async getInstructorPayouts(instructorId: string, status?: string) {
    const where: any = { instructorId };
    
    if (status) {
      where.status = status;
    }

    const payouts = await this.prisma.instructorPayout.findMany({
      where,
      include: {
        payoutSessions: {
          include: {
            session: {
              select: {
                id: true,
                title: true,
                scheduledStart: true,
                totalPrice: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return payouts;
  }

  async getPayoutById(payoutId: string) {
    const payout = await this.prisma.instructorPayout.findUnique({
      where: { id: payoutId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        payoutSessions: {
          include: {
            session: {
              select: {
                id: true,
                title: true,
                scheduledStart: true,
                totalPrice: true,
                status: true
              }
            }
          }
        }
      }
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    return payout;
  }

  async updatePayoutStatus(payoutId: string, status: string, stripePayoutId?: string) {
    const updateData: any = { status };

    if (stripePayoutId) {
      updateData.stripePayoutId = stripePayoutId;
    }

    if (status === 'PAID') {
      updateData.paidAt = new Date();
    } else if (status === 'FAILED') {
      updateData.failedAt = new Date();
    }

    const payout = await this.prisma.instructorPayout.update({
      where: { id: payoutId },
      data: updateData
    });

    return payout;
  }

  async getPayoutStats(instructorId: string) {
    const payouts = await this.prisma.instructorPayout.findMany({
      where: { instructorId },
      select: {
        amount: true,
        status: true,
        createdAt: true,
        currency: true
      }
    });

    const totalPayouts = payouts.reduce((sum, payout) => sum + payout.amount, 0);
    const pendingPayouts = payouts
      .filter(payout => payout.status === 'PENDING' || payout.status === 'PROCESSING')
      .reduce((sum, payout) => sum + payout.amount, 0);
    const completedPayouts = payouts
      .filter(payout => payout.status === 'PAID')
      .reduce((sum, payout) => sum + payout.amount, 0);

    return {
      totalPayouts,
      pendingPayouts,
      completedPayouts,
      totalPayoutCount: payouts.length,
      averagePayout: payouts.length > 0 ? totalPayouts / payouts.length : 0
    };
  }

  async processAutomaticPayouts() {
    // Find all completed sessions that are ready for payout
    const completedSessions = await this.prisma.liveSession.findMany({
      where: {
        status: 'COMPLETED',
        payoutStatus: 'PENDING',
        scheduledEnd: {
          lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours after completion
        }
      },
      include: {
        instructor: true
      }
    });

    // Group sessions by instructor
    const sessionsByInstructor = new Map();
    for (const session of completedSessions) {
      if (!sessionsByInstructor.has(session.instructorId)) {
        sessionsByInstructor.set(session.instructorId, []);
      }
      sessionsByInstructor.get(session.instructorId).push(session);
    }

    const results: Array<{
      instructorId: string;
      success: boolean;
      error?: string;
      payout?: any;
      sessionsProcessed?: number;
    }> = [];

    // Process payouts for each instructor
    for (const [instructorId, sessions] of sessionsByInstructor) {
      try {
        const sessionIds = sessions.map(session => session.id);
        const result = await this.processInstructorPayout(instructorId, sessionIds);
        results.push({
          instructorId,
          ...result
        });
      } catch (error) {
        this.logger.error(`Failed to process payout for instructor ${instructorId}:`, error);
        results.push({
          instructorId,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }

  async handleStripePayoutWebhook(event: any) {
    const { type, data } = event;

    switch (type) {
      case 'transfer.created':
        await this.handleTransferCreated(data.object);
        break;
      case 'transfer.paid':
        await this.handleTransferPaid(data.object);
        break;
      case 'transfer.failed':
        await this.handleTransferFailed(data.object);
        break;
      default:
        this.logger.log(`Unhandled Stripe payout event: ${type}`);
    }
  }

  private async handleTransferCreated(transfer: any) {
    // Transfer was created but not yet paid
    this.logger.log(`Transfer created: ${transfer.id}`);
  }

  private async handleTransferPaid(transfer: any) {
    // Find the payout record and update status
    const payout = await this.prisma.instructorPayout.findFirst({
      where: { stripePayoutId: transfer.id }
    });

    if (payout) {
      await this.updatePayoutStatus(payout.id, 'PAID', transfer.id);
      this.logger.log(`Payout ${payout.id} marked as paid`);
    }
  }

  private async handleTransferFailed(transfer: any) {
    // Find the payout record and update status
    const payout = await this.prisma.instructorPayout.findFirst({
      where: { stripePayoutId: transfer.id }
    });

    if (payout) {
      await this.updatePayoutStatus(payout.id, 'FAILED', transfer.id);
      this.logger.error(`Payout ${payout.id} failed: ${transfer.failure_message}`);
    }
  }
}
