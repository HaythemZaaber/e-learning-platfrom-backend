import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreatePaymentIntentDto, 
  UpdatePaymentStatusDto,
  CalculateSessionPriceDto,
  PaymentFilterDto,
  CreateSessionPaymentDto,
  ProcessRefundDto,
  CreateInstructorPayoutDto,
  UpdatePayoutStatusDto,
  PayoutFilterDto
} from '../dto/payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async createPaymentIntent(createDto: CreatePaymentIntentDto) {
    const { bookingId, amount, currency, paymentMethodId, customerId, paymentTiming } = createDto;

    // Validate booking request exists
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingId },
      include: {
        offering: {
          include: {
            instructor: true
          }
        }
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    if (bookingRequest.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Payment already completed for this booking');
    }

    // Create payment intent (placeholder implementation - would integrate with Stripe)
    const paymentIntent = {
      id: `pi_${Math.random().toString(36).substr(2, 9)}`,
      bookingId,
      amount,
      currency,
      status: 'requires_payment_method',
      clientSecret: `pi_${Math.random().toString(36).substr(2, 9)}_secret_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return paymentIntent;
  }

  async updatePaymentStatus(paymentIntentId: string, updateDto: UpdatePaymentStatusDto) {
    const { status, transactionId, stripePaymentId, paymentMethod, paidAt, failureReason } = updateDto;

    // Find payment intent (placeholder implementation)
    const paymentIntent = {
      id: paymentIntentId,
      bookingRequest: await this.prisma.bookingRequest.findFirst({
        where: { id: paymentIntentId }
      })
    };

    if (!paymentIntent) {
      throw new NotFoundException('Payment intent not found');
    }

    // Update payment intent (placeholder implementation)
    const updatedPaymentIntent = {
      ...paymentIntent,
      status,
      updatedAt: new Date()
    };

    // Update booking request payment status
    if (paymentIntent.bookingRequest) {
      await this.prisma.bookingRequest.update({
        where: { id: paymentIntent.bookingRequest.id },
        data: {
          paymentStatus: status,
          stripeSessionId: stripePaymentId,
          updatedAt: new Date()
        }
      });
    }

    return updatedPaymentIntent;
  }

  async createSessionPayment(createDto: CreateSessionPaymentDto) {
    // Validate session exists
    const session = await this.prisma.liveSession.findUnique({
      where: { id: createDto.sessionId }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    // Validate payer exists
    const payer = await this.prisma.user.findUnique({
      where: { id: createDto.payerId }
    });

    if (!payer) {
      throw new NotFoundException('Payer not found');
    }

    const payment = await this.prisma.sessionPayment.create({
      data: {
        reservationId: createDto.reservationId,
        sessionId: createDto.sessionId,
        payerId: createDto.payerId,
        amount: createDto.amount,
        currency: createDto.currency,
        paymentTiming: createDto.paymentTiming,
        status: 'PENDING',
        paymentMethod: createDto.paymentMethod,
        transactionId: createDto.transactionId,
        stripePaymentId: createDto.stripePaymentId,
        dueAt: createDto.dueAt,
        refundAmount: 0
      },
      include: {
        payer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        session: {
          select: {
            id: true,
            title: true,
            scheduledStart: true
          }
        }
      }
    });

    return payment;
  }

  async processRefund(processRefundDto: ProcessRefundDto) {
    // Find the booking request
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id: processRefundDto.bookingId },
      include: {
        offering: true,
        student: true,
        liveSession: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    if (bookingRequest.paymentStatus !== 'PAID') {
      throw new BadRequestException('Cannot refund unpaid booking');
    }

    // Calculate refund amount based on cancellation policy
    const refundAmount = this.calculateRefundAmount(
      processRefundDto.amount,
      bookingRequest.offering.cancellationPolicy,
      bookingRequest.liveSession?.scheduledStart || new Date()
    );

    // Create refund record
    let refundPayment;
    if (bookingRequest.liveSession && bookingRequest.liveSession.payments.length > 0) {
      const originalPayment = bookingRequest.liveSession.payments[0];
      refundPayment = await this.prisma.sessionPayment.update({
        where: { id: originalPayment.id },
        data: {
          refundAmount: refundAmount,
          refundReason: processRefundDto.reason,
          refundedAt: new Date(),
          status: processRefundDto.isPartialRefund ? 'PARTIAL_REFUND' : 'REFUNDED'
        },
        include: {
          payer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    }

    // Update booking request status
    await this.prisma.bookingRequest.update({
      where: { id: processRefundDto.bookingId },
      data: {
        paymentStatus: processRefundDto.isPartialRefund ? 'PARTIAL_REFUND' : 'REFUNDED'
      }
    });

    return refundPayment || {
      bookingId: processRefundDto.bookingId,
      refundAmount,
      refundReason: processRefundDto.reason,
      refundedAt: new Date()
    };
  }

  async createInstructorPayout(createDto: CreateInstructorPayoutDto) {
    // Validate instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: createDto.instructorId }
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Validate all sessions belong to this instructor and are completed
    const sessions = await this.prisma.liveSession.findMany({
      where: {
        id: { in: createDto.sessionIds },
        instructorId: createDto.instructorId,
        status: 'COMPLETED',
        payoutStatus: 'PENDING'
      }
    });

    if (sessions.length !== createDto.sessionIds.length) {
      throw new BadRequestException('Some sessions are not eligible for payout');
    }

    // Calculate total amounts
    const totalAmount = sessions.reduce((sum, session) => sum + session.pricePerPerson, 0);
    const totalPlatformFee = sessions.reduce((sum, session) => sum + session.platformFee, 0);
    const netAmount = sessions.reduce((sum, session) => sum + session.instructorPayout, 0);

    // Create payout
    const payout = await this.prisma.instructorPayout.create({
      data: {
        instructorId: createDto.instructorId,
        amount: totalAmount,
        platformFee: totalPlatformFee,
        netAmount,
        currency: sessions[0].currency,
        status: 'PENDING',
        payoutMethod: createDto.payoutMethod,
        scheduledDate: createDto.scheduledDate || new Date(),
      }
    });

    // Create payout session relationships
    for (const session of sessions) {
      await this.prisma.payoutSession.create({
        data: {
          payoutId: payout.id,
          sessionId: session.id,
          sessionAmount: session.pricePerPerson,
          platformFee: session.platformFee,
          netAmount: session.instructorPayout
        }
      });

      // Update session payout status
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { payoutStatus: 'PROCESSING' }
      });
    }

    return payout;
  }

  async updatePayoutStatus(payoutId: string, updateDto: UpdatePayoutStatusDto) {
    const payout = await this.prisma.instructorPayout.findUnique({
      where: { id: payoutId },
      include: {
        payoutSessions: {
          include: {
            session: true
          }
        }
      }
    });

    if (!payout) {
      throw new NotFoundException('Payout not found');
    }

    const updatedPayout = await this.prisma.instructorPayout.update({
      where: { id: payoutId },
      data: {
        status: updateDto.status,
        stripePayoutId: updateDto.stripePayoutId,
        bankTransferId: updateDto.bankTransferId,
        processedAt: updateDto.processedAt,
        paidAt: updateDto.paidAt,
        failedAt: updateDto.failedAt,
        failureReason: updateDto.failureReason
      }
    });

    // Update session payout statuses
    const sessionPayoutStatus = updateDto.status === 'PAID' ? 'PAID' : 
                               updateDto.status === 'FAILED' ? 'PENDING' : 
                               'PROCESSING';

    await this.prisma.liveSession.updateMany({
      where: {
        id: { in: payout.payoutSessions.map(ps => ps.sessionId) }
      },
      data: {
        payoutStatus: sessionPayoutStatus
      }
    });

    return updatedPayout;
  }

  async calculateSessionPrice(calculateDto: CalculateSessionPriceDto) {
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id: calculateDto.offeringId },
      include: {
        instructor: {
          include: {
            instructorProfile: true
          }
        }
      }
    });

    if (!offering) {
      throw new NotFoundException('Session offering not found');
    }

    let basePrice = offering.basePrice;
    const participantCount = calculateDto.participantCount || 1;

    // Apply group pricing if applicable
    if (calculateDto.sessionType !== 'INDIVIDUAL' && participantCount > 1) {
      const groupRate = offering.instructor.instructorProfile?.groupSessionRate || offering.basePrice;
      basePrice = groupRate * participantCount;
    }

    // Apply custom pricing if provided
    if (calculateDto.customPrice && calculateDto.customPrice >= basePrice * 0.5) {
      basePrice = calculateDto.customPrice;
    }

    // Calculate platform fee
    const platformFeeRate = offering.instructor.instructorProfile?.platformFeeRate || 20;
    const platformFee = (basePrice * platformFeeRate) / 100;
    const instructorPayout = basePrice - platformFee;

    return {
      basePrice: offering.basePrice,
      finalPrice: basePrice,
      platformFee,
      instructorPayout,
      participantCount,
      currency: offering.currency
    };
  }

  async getSessionPayments(sessionId: string) {
    return this.prisma.sessionPayment.findMany({
      where: { sessionId },
      include: {
        payer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async getInstructorPayouts(instructorId: string, status?: string) {
    const where: any = { instructorId };
    if (status) where.status = status;

    return this.prisma.instructorPayout.findMany({
      where,
      include: {
        payoutSessions: {
          include: {
            session: {
              select: {
                id: true,
                title: true,
                scheduledStart: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  private calculateRefundAmount(originalAmount: number, cancellationPolicy: string, sessionStart: Date): number {
    const now = new Date();
    const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);

    switch (cancellationPolicy) {
      case 'FLEXIBLE':
        if (hoursUntilSession >= 24) return originalAmount;
        if (hoursUntilSession >= 12) return originalAmount * 0.5;
        return 0;
      
      case 'MODERATE':
        if (hoursUntilSession >= 48) return originalAmount;
        if (hoursUntilSession >= 24) return originalAmount * 0.5;
        return 0;
      
      case 'STRICT':
        if (hoursUntilSession >= 72) return originalAmount;
        if (hoursUntilSession >= 48) return originalAmount * 0.25;
        return 0;
      
      default:
        return originalAmount * 0.5;
    }
  }
}