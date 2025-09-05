import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService } from '../../payment/payment.service';
import { SessionStatus, PaymentStatus, ReservationStatus, ParticipantStatus, ParticipantRole, PayoutStatus, BookingMode, LiveSessionType, SessionFormat, SessionMode } from '@prisma/client';
import { 
  CreateSessionBookingDto,
  ConfirmSessionBookingDto,
  CompleteSessionDto,
  SessionBookingFilterDto,
  CancelSessionBookingDto,
  RescheduleSessionDto,
  BookingStatus
} from '../dto/session-booking.dto';

@Injectable()
export class SessionBookingService {
  private readonly logger = new Logger(SessionBookingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  async createSessionBooking(dto: CreateSessionBookingDto) {
    // Use a database transaction to ensure atomicity and prevent race conditions
    return await this.prisma.$transaction(async (tx) => {
      // Validate time slot availability with proper locking
      const timeSlot = await tx.timeSlot.findUnique({
        where: { id: dto.timeSlotId },
        include: {
          availability: {
            include: {
              instructor: true
            }
          },
          bookingRequests: {
            where: {
              status: {
                in: ['PENDING', 'ACCEPTED']
              }
            }
          },
          sessions: {
            where: {
              status: {
                in: ['SCHEDULED', 'IN_PROGRESS']
              }
            }
          }
        }
      });

      if (!timeSlot) {
        throw new NotFoundException('Time slot not found');
      }

      // Enhanced slot availability validation
      if (!timeSlot.isAvailable || timeSlot.isBlocked) {
        throw new BadRequestException('Time slot is not available for booking');
      }

      // Check if slot is already fully booked (including pending bookings)
      const totalBookings = timeSlot.currentBookings + timeSlot.bookingRequests.length;
      if (totalBookings >= timeSlot.maxBookings) {
        throw new BadRequestException('Time slot is already fully booked');
      }

      // Check if there are conflicting sessions
      if (timeSlot.sessions.length > 0) {
        throw new BadRequestException('Time slot has conflicting sessions');
      }

      // Validate offering
      const offering = await tx.sessionOffering.findUnique({
        where: { id: dto.offeringId },
        include: {
          instructor: true
        }
      });

      if (!offering) {
        throw new NotFoundException('Session offering not found');
      }

      if (!offering.isActive) {
        throw new BadRequestException('Session offering is not active');
      }

      // Validate student
      const student = await tx.user.findUnique({
        where: { id: dto.studentId }
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      // Check instructor's auto-approval settings
      // Note: Availability-level autoAcceptBookings overrides instructor profile setting
      const instructorProfile = await tx.instructorProfile.findUnique({
        where: { userId: offering.instructorId }
      });

      const availability = await tx.instructorAvailability.findFirst({
        where: { 
          instructorId: offering.instructorId,
          specificDate: timeSlot.date,
          isActive: true
        }
      });

      // Enhanced auto-approval logic with availability-level priority
      const shouldAutoApprove = this.shouldAutoApproveBooking({
        instructorProfile,
        availability,
        timeSlot,
        offering,
        totalBookings: totalBookings + 1 // Include this booking
      });

      // Create booking request
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
          status: shouldAutoApprove ? BookingStatus.ACCEPTED : BookingStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
          priority: 1
        },
        include: {
          offering: {
            include: {
              instructor: true
            }
          },
          student: true,
          timeSlot: {
            include: {
              availability: true
            }
          }
        }
      });

      // Only update time slot booking count if auto-approval is enabled
      // For manual approval, the count will be updated when the instructor approves
      if (shouldAutoApprove) {
        this.logger.debug(`Auto-approval enabled: updating slot ${dto.timeSlotId}`, {
          currentBookings: timeSlot.currentBookings,
          maxBookings: timeSlot.maxBookings,
          willBeBooked: totalBookings + 1 >= timeSlot.maxBookings
        });
        
        await tx.timeSlot.update({
          where: { id: dto.timeSlotId },
          data: {
            currentBookings: {
              increment: 1
            },
            isBooked: totalBookings + 1 >= timeSlot.maxBookings
          }
        });
      } else {
        this.logger.debug(`Manual approval required: slot ${dto.timeSlotId} not updated yet`, {
          currentBookings: timeSlot.currentBookings,
          maxBookings: timeSlot.maxBookings,
          autoApproval: shouldAutoApprove
        });
      }

      // Create payment using the payment service
      const paymentResult = await this.paymentService.createSessionBookingPayment(
        bookingRequest.id,
        dto.offeringId,
        dto.studentId,
        offering.instructorId,
        dto.agreedPrice,
        dto.currency,
        dto.returnUrl,
        dto.cancelUrl
      );

      if (!paymentResult.success) {
        // The transaction will automatically rollback if we throw an error
        throw new BadRequestException(paymentResult.error || 'Failed to create payment');
      }

      // Update booking request with payment details
      await tx.bookingRequest.update({
        where: { id: bookingRequest.id },
        data: {
          paymentIntentId: null, // Will be updated when payment is completed
          stripeSessionId: paymentResult.checkoutSession!.id,
          paymentStatus: PaymentStatus.PENDING
        }
      });

      // If auto-approval is enabled, create live session immediately
      let liveSession: any = null;
      if (shouldAutoApprove) {
        liveSession = await this.createLiveSessionFromBookingInTransaction(bookingRequest, tx);
      }

      return {
        success: true,
        bookingRequest,
        paymentIntent: paymentResult.paymentIntent,
        checkoutSession: paymentResult.checkoutSession,
        autoApproved: shouldAutoApprove,
        liveSession: liveSession
      };
    });
  }

  /**
   * Enhanced auto-approval logic with comprehensive checks
   * Priority: Availability autoAcceptBookings overrides instructor profile setting
   */
  private shouldAutoApproveBooking(params: {
    instructorProfile: any;
    availability: any;
    timeSlot: any;
    offering: any;
    totalBookings: number;
  }): boolean {
    const { instructorProfile, availability, timeSlot, offering, totalBookings } = params;

    // Debug logging
    this.logger.debug('Auto-accept logic inputs:', {
      instructorProfileAutoAccept: instructorProfile?.autoAcceptBookings,
      availabilityAutoAccept: availability?.autoAcceptBookings,
      availabilityId: availability?.id,
      timeSlotId: timeSlot?.id,
      offeringAutoAccept: offering?.autoAcceptBookings
    });

    // PRIORITY: Check availability autoAcceptBookings first (this overrides instructor profile)
    const slotAutoAccept = availability?.autoAcceptBookings;
    
    // If slot has explicit autoAcceptBookings setting, use it (true/false)
    // If slot doesn't have this setting, fall back to instructor profile
    const shouldAutoAccept = slotAutoAccept !== undefined ? slotAutoAccept : instructorProfile?.autoAcceptBookings === true;

    this.logger.debug('Auto-accept decision:', {
      slotAutoAccept,
      shouldAutoAccept,
      finalDecision: shouldAutoAccept === true ? 'AUTO_ACCEPT' : 'MANUAL_APPROVAL'
    });

    // If auto-accept is disabled at slot level, don't proceed
    if (shouldAutoAccept === false) {
      this.logger.debug('Auto-accept disabled at availability level');
      return false;
    }

    // If auto-accept is not enabled (either slot or profile), don't proceed
    if (shouldAutoAccept !== true) {
      this.logger.debug('Auto-accept not enabled');
      return false;
    }

    // Check if offering allows auto-approval
    const offeringAllowsAutoAccept = offering.autoAcceptBookings !== false;

    // Check if time slot is within acceptable booking window
    const now = new Date();
    const slotDate = new Date(timeSlot.date);
    const hoursUntilSlot = (slotDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    const minAdvanceHours = availability?.minAdvanceHours || instructorProfile?.minAdvanceBooking || 12;
    const maxAdvanceHours = availability?.maxAdvanceHours || 720; // 30 days default
    
    const withinBookingWindow = hoursUntilSlot >= minAdvanceHours && hoursUntilSlot <= maxAdvanceHours;

    // Check if slot has capacity
    const hasCapacity = totalBookings < timeSlot.maxBookings;

    // Check if instructor is accepting students
    const instructorAcceptingStudents = instructorProfile?.isAcceptingStudents !== false;

    // Check if live sessions are enabled for instructor
    const liveSessionsEnabled = instructorProfile?.liveSessionsEnabled !== false;

    // Auto-approve only if ALL conditions are met
    return (
      shouldAutoAccept &&
      offeringAllowsAutoAccept &&
      withinBookingWindow &&
      hasCapacity &&
      instructorAcceptingStudents &&
      liveSessionsEnabled
    );
  }

  /**
   * Create live session from booking within a transaction
   */
  private async createLiveSessionFromBookingInTransaction(bookingRequest: any, tx: any) {
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
        platformFee: (bookingRequest.finalPrice || 0) * 0.20, // 20% platform fee
        instructorPayout: (bookingRequest.finalPrice || 0) * 0.80, // 80% to instructor
        currency: bookingRequest.currency,
        status: SessionStatus.SCHEDULED,
        timeSlotId: bookingRequest.timeSlotId || undefined,
        materials: bookingRequest.offering.materials,
        recordingEnabled: bookingRequest.offering.recordingEnabled
      }
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
        paymentDate: new Date()
      }
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
        confirmedAt: new Date()
      }
    });

    // Generate Jitsi meeting room
    const meetingRoomId = this.generateJitsiMeetingId(liveSession.id);
    
    const updatedLiveSession = await tx.liveSession.update({
      where: { id: liveSession.id },
      data: {
        meetingRoomId,
        meetingLink: `https://meet.jit.si/${meetingRoomId}`
      }
    });

    return {
      ...updatedLiveSession,
      meetingRoomId,
      meetingLink: `https://meet.jit.si/${meetingRoomId}`
    };
  }

  async confirmSessionBooking(dto: ConfirmSessionBookingDto) {
    // Use a database transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      const bookingRequest = await tx.bookingRequest.findUnique({
        where: { id: dto.bookingId },
        include: {
          offering: {
            include: {
              instructor: true
            }
          },
          student: true,
          timeSlot: {
            include: {
              availability: true,
              bookingRequests: {
                where: {
                  status: {
                    in: ['PENDING', 'ACCEPTED']
                  },
                  id: {
                    not: dto.bookingId // Exclude this booking request
                  }
                }
              },
              sessions: {
                where: {
                  status: {
                    in: ['SCHEDULED', 'IN_PROGRESS']
                  }
                }
              }
            }
          }
        }
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }

      // Enhanced slot availability validation
      const timeSlot = bookingRequest.timeSlot;
      if (!timeSlot) {
        throw new BadRequestException('Time slot not found for this booking');
      }

      if (!timeSlot.isAvailable || timeSlot.isBlocked) {
        throw new BadRequestException('Time slot is no longer available for booking');
      }

                             

      // Check if there are conflicting sessions
      if (timeSlot.sessions.length > 0) {
        throw new BadRequestException('Time slot has conflicting sessions');
      }

      // Check if the booking hasn't expired
      if (bookingRequest.expiresAt && new Date() > bookingRequest.expiresAt) {
        throw new BadRequestException('Booking request has expired');
      }

      // Get PaymentIntent from checkout session if not already set
      let paymentIntentId = dto.paymentIntentId;
      if (!paymentIntentId && bookingRequest.stripeSessionId) {
        const paymentIntentResult = await this.paymentService.getPaymentIntentFromCheckoutSession(
          bookingRequest.stripeSessionId
        );
        
        if (paymentIntentResult.success) {
          paymentIntentId = paymentIntentResult.paymentIntent!.id;
          
          // Update booking request with PaymentIntent ID
          await tx.bookingRequest.update({
            where: { id: dto.bookingId },
            data: {
              paymentIntentId: paymentIntentId
            }
          });
        } else {
          throw new BadRequestException('Failed to retrieve PaymentIntent from checkout session');
        }
      }

      // Verify payment intent status
      if (paymentIntentId) {
        const paymentIntentResult = await this.paymentService.getPaymentIntentFromCheckoutSession(
          bookingRequest.stripeSessionId!
        );
        
        if (paymentIntentResult.success) {
          const status = paymentIntentResult.paymentIntent!.status;
          if (status !== 'requires_capture') {
            throw new BadRequestException(
              `Payment is not ready for capture. Current status: ${status}. Expected: requires_capture`
            );
          }
        }
      }

      // Check if live session already exists for this booking request
      let liveSession = await tx.liveSession.findUnique({
        where: { bookingRequestId: bookingRequest.id }
      });

      if (!liveSession) {
        // Create live session only if it doesn't exist
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
            platformFee: (bookingRequest.finalPrice || 0) * 0.20, // 20% platform fee
            instructorPayout: (bookingRequest.finalPrice || 0) * 0.80, // 80% to instructor
            currency: bookingRequest.currency,
            status: SessionStatus.SCHEDULED,
            timeSlotId: bookingRequest.timeSlotId || undefined,
            materials: bookingRequest.offering.materials,
            recordingEnabled: bookingRequest.offering.recordingEnabled
          }
        });
      }

      // Check if session participant already exists
      const existingParticipant = await tx.sessionParticipant.findFirst({
        where: {
          sessionId: liveSession.id,
          userId: bookingRequest.studentId
        }
      });

      if (!existingParticipant) {
        // Create session participant only if it doesn't exist
        await tx.sessionParticipant.create({
          data: {
            sessionId: liveSession.id,
            userId: bookingRequest.studentId,
            role: ParticipantRole.STUDENT,
            status: ParticipantStatus.ENROLLED,
            paidAmount: bookingRequest.finalPrice || 0,
            currency: bookingRequest.currency,
            paymentDate: new Date()
          }
        });
      }

      // Check if session reservation already exists
      const existingReservation = await tx.sessionReservation.findFirst({
        where: {
          sessionId: liveSession.id,
          learnerId: bookingRequest.studentId
        }
      });

      if (!existingReservation) {
        // Create session reservation only if it doesn't exist
        await tx.sessionReservation.create({
          data: {
            sessionId: liveSession.id,
            learnerId: bookingRequest.studentId,
            status: ReservationStatus.CONFIRMED,
            paymentStatus: PaymentStatus.PENDING, // Keep as PENDING until session completion
            agreedPrice: bookingRequest.finalPrice || 0,
            currency: bookingRequest.currency,
            confirmedAt: new Date()
          }
        });
      }

      // Update time slot booking count
      await tx.timeSlot.update({
        where: { id: bookingRequest.timeSlotId! },
        data: {
          currentBookings: {
            increment: 1
          },
          isBooked: (timeSlot.currentBookings + 1) >= timeSlot.maxBookings
        }
      });

      // Update booking request status
      await tx.bookingRequest.update({
        where: { id: dto.bookingId },
        data: {
          status: BookingStatus.ACCEPTED,
          paymentStatus: PaymentStatus.PENDING, // Keep as PENDING until session completion
          acceptedAt: new Date(),
          liveSession: {
            connect: { id: liveSession.id }
          }
        }
      });

      // Generate Jitsi meeting room
      const meetingRoomId = this.generateJitsiMeetingId(liveSession.id);
      
      await tx.liveSession.update({
        where: { id: liveSession.id },
        data: {
          meetingRoomId,
          meetingLink: `https://meet.jit.si/${meetingRoomId}`
        }
      });

      return {
        success: true,
        liveSession: {
          ...liveSession,
          meetingRoomId,
          meetingLink: `https://meet.jit.si/${meetingRoomId}`
        },
        paymentIntent: {
          id: dto.paymentIntentId,
          status: 'requires_capture',
          amount: bookingRequest.finalPrice || 0,
          currency: bookingRequest.currency
        }
      };
    });
  }

  async completeSession(dto: CompleteSessionDto) {
    // Delegate to LiveSessionService for consistency
    // This method is kept for backward compatibility but now uses the unified logic
    const { LiveSessionService } = await import('./live-session.service');
    const liveSessionService = new LiveSessionService(this.prisma, this.paymentService);
    
    return liveSessionService.endLiveSession(dto.sessionId, {
      notes: dto.summary,
      summary: dto.summary,
      instructorNotes: dto.instructorNotes,
      sessionArtifacts: dto.sessionArtifacts,
      actualDuration: dto.actualDuration
    });
  }

  async approveSessionBooking(bookingId: string, instructorId: string, instructorMessage?: string) {
    // Use a database transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      const bookingRequest = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          offering: {
            include: {
              instructor: true
            }
          },
          student: true,
          timeSlot: {
            include: {
              availability: true,
              bookingRequests: {
                where: {
                  status: {
                    in: ['PENDING', 'ACCEPTED']
                  },
                  id: {
                    not: bookingId // Exclude this booking request
                  }
                }
              },
              sessions: {
                where: {
                  status: {
                    in: ['SCHEDULED', 'IN_PROGRESS']
                  }
                }
              }
            }
          }
        }
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }

      // Verify the instructor owns this booking
      if (bookingRequest.offering.instructorId !== instructorId) {
        throw new ForbiddenException('You can only approve your own bookings');
      }

      // Check if booking is in pending status
      if (bookingRequest.status !== BookingStatus.PENDING) {
        throw new BadRequestException('Only pending bookings can be approved');
      }

      // Enhanced slot availability validation
      const timeSlot = bookingRequest.timeSlot;
      if (!timeSlot) {
        throw new BadRequestException('Time slot not found for this booking');
      }

      if (!timeSlot.isAvailable || timeSlot.isBlocked) {
        throw new BadRequestException('Time slot is no longer available for booking');
      }

      // Check if slot has capacity (excluding this booking request)
      // The current booking request is already counted in currentBookings if it was auto-accepted
      const totalBookings = timeSlot.currentBookings;
      
      this.logger.debug(`Slot capacity check for approval:`, {
        timeSlotId: timeSlot.id,
        currentBookings: timeSlot.currentBookings,
        maxBookings: timeSlot.maxBookings,
        hasCapacity: totalBookings < timeSlot.maxBookings
      });
      
      if (totalBookings >= timeSlot.maxBookings) {
        throw new BadRequestException('Time slot is already fully booked');
      }

      // Check if there are conflicting sessions
      if (timeSlot.sessions.length > 0) {
        throw new BadRequestException('Time slot has conflicting sessions');
      }

      // Check if the booking hasn't expired
      if (bookingRequest.expiresAt && new Date() > bookingRequest.expiresAt) {
        throw new BadRequestException('Booking request has expired');
      }

      // Update booking request status
      await tx.bookingRequest.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.ACCEPTED,
          instructorResponse: instructorMessage,
          acceptedAt: new Date()
        }
      });

      // Update time slot booking count
      await tx.timeSlot.update({
        where: { id: timeSlot.id },
        data: {
          currentBookings: {
            increment: 1
          },
          isBooked: totalBookings + 1 >= timeSlot.maxBookings
        }
      });

      // Create live session
      const liveSession = await this.createLiveSessionFromBookingInTransaction(bookingRequest, tx);

      return {
        success: true,
        message: 'Booking approved successfully',
        bookingRequest: {
          ...bookingRequest,
          status: BookingStatus.ACCEPTED,
          instructorResponse: instructorMessage,
          acceptedAt: new Date()
        },
        liveSession
      };
    });
  }

  async rejectSessionBooking(bookingId: string, instructorId: string, reason?: string) {
    // Use a database transaction to ensure atomicity
    return await this.prisma.$transaction(async (tx) => {
      const bookingRequest = await tx.bookingRequest.findUnique({
        where: { id: bookingId },
        include: {
          offering: {
            include: {
              instructor: true
            }
          },
          student: true,
          timeSlot: true,
          liveSession: true
        }
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
          this.logger.log(`Processing refund for rejected booking ${bookingId}, payment intent: ${bookingRequest.paymentIntentId}`);
          
          const refundResult = await this.paymentService.refundSessionPayment(
            bookingRequest.paymentIntentId,
            'instructor_rejected'
          );

          if (refundResult.success) {
            paymentHandlingResult = {
              success: true,
              refundId: refundResult.refund?.id,
              amount: refundResult.refund?.amount,
              currency: refundResult.refund?.currency,
              message: 'Refund processed successfully'
            };
            
            this.logger.log(`Refund processed successfully: ${refundResult.refund?.id}`);
          } else {
            paymentHandlingResult = {
              success: false,
              error: refundResult.error,
              requiresManualIntervention: true
            };
            
            this.logger.error(`Refund failed for booking ${bookingId}:`, refundResult.error);
          }
        } catch (error) {
          this.logger.error(`Exception during refund processing for booking ${bookingId}:`, error);
          paymentHandlingResult = {
            success: false,
            error: error.message,
            requiresManualIntervention: true
          };
        }
      } else if (bookingRequest.stripeSessionId) {
        // Payment session exists but no payment intent yet - log for manual intervention
        this.logger.log(`Stripe session exists for rejected booking ${bookingId}, session: ${bookingRequest.stripeSessionId}`);
        
        paymentHandlingResult = {
          success: false,
          error: 'Stripe session exists but no payment intent - requires manual intervention',
          requiresManualIntervention: true,
          message: 'Payment session requires manual cancellation'
        };
        
        this.logger.warn(`Stripe session ${bookingRequest.stripeSessionId} requires manual cancellation for rejected booking ${bookingId}`);
      } else {
        // No payment made yet
        paymentHandlingResult = {
          success: true,
          noPaymentToProcess: true,
          message: 'No payment to process'
        };
      }

      // Update time slot if it was already booked
      if (bookingRequest.timeSlot) {
        await tx.timeSlot.update({
          where: { id: bookingRequest.timeSlot.id },
          data: {
            currentBookings: {
              decrement: 1
            },
            isBooked: false
          }
        });
      }

      // Cancel live session if it was created
      if (bookingRequest.liveSession) {
        await tx.liveSession.update({
          where: { id: bookingRequest.liveSession.id },
          data: {
            status: SessionStatus.CANCELLED
          }
        });
      }

      // Update booking request with comprehensive status changes
      const updatedBookingRequest = await tx.bookingRequest.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.REJECTED,
          instructorResponse: reason,
          rejectedAt: new Date(),
          paymentStatus: paymentHandlingResult?.success && !paymentHandlingResult?.noPaymentToProcess 
            ? PaymentStatus.REFUNDED 
            : PaymentStatus.CANCELED
        }
      });

      // Send notification to student about rejection
      // This would typically be handled by a notification service
      this.logger.log(`Sending rejection notification to student ${bookingRequest.studentId} for booking ${bookingId}`);

      return {
        success: true,
        message: 'Booking rejected successfully',
        bookingRequest: updatedBookingRequest,
        paymentHandling: paymentHandlingResult,
        requiresManualIntervention: paymentHandlingResult?.requiresManualIntervention || false
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
          timeSlot: true
        }
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }

      // Handle payment processing based on payment status
      let paymentHandlingResult: any = null;
      
      if (dto.processRefund && bookingRequest.paymentIntentId) {
        try {
          this.logger.log(`Processing refund for cancelled booking ${dto.bookingId}, payment intent: ${bookingRequest.paymentIntentId}`);
          
          const refundResult = await this.paymentService.refundSessionPayment(
            bookingRequest.paymentIntentId,
            'requested_by_customer'
          );

          if (refundResult.success) {
            paymentHandlingResult = {
              success: true,
              refundId: refundResult.refund?.id,
              amount: refundResult.refund?.amount,
              currency: refundResult.refund?.currency,
              message: 'Refund processed successfully'
            };
            
            this.logger.log(`Refund processed successfully: ${refundResult.refund?.id}`);
          } else {
            paymentHandlingResult = {
              success: false,
              error: refundResult.error,
              requiresManualIntervention: true
            };
            
            this.logger.error(`Refund failed for booking ${dto.bookingId}:`, refundResult.error);
            throw new BadRequestException('Failed to process refund');
          }
        } catch (error) {
          this.logger.error(`Exception during refund processing for booking ${dto.bookingId}:`, error);
          throw new BadRequestException('Failed to process refund');
        }
      } else if (bookingRequest.stripeSessionId && !bookingRequest.paymentIntentId) {
        // Payment session exists but no payment intent yet - log for manual intervention
        this.logger.log(`Stripe session exists for cancelled booking ${dto.bookingId}, session: ${bookingRequest.stripeSessionId}`);
        
        paymentHandlingResult = {
          success: false,
          error: 'Stripe session exists but no payment intent - requires manual intervention',
          requiresManualIntervention: true,
          message: 'Payment session requires manual cancellation'
        };
        
        this.logger.warn(`Stripe session ${bookingRequest.stripeSessionId} requires manual cancellation for cancelled booking ${dto.bookingId}`);
      } else {
        // No payment to process
        paymentHandlingResult = {
          success: true,
          noPaymentToProcess: true,
          message: 'No payment to process'
        };
      }

      // Update time slot if session was created
      if (bookingRequest.liveSession) {
        await tx.timeSlot.update({
          where: { id: bookingRequest.timeSlotId! },
          data: {
            currentBookings: {
              decrement: 1
            },
            isBooked: false
          }
        });

        await tx.liveSession.update({
          where: { id: bookingRequest.liveSession.id },
          data: {
            status: SessionStatus.CANCELLED
          }
        });
      }

      // Update booking request status
      const updatedBookingRequest = await tx.bookingRequest.update({
        where: { id: dto.bookingId },
        data: {
          status: BookingStatus.CANCELLED,
          cancelledAt: new Date(),
          paymentStatus: paymentHandlingResult?.success && !paymentHandlingResult?.noPaymentToProcess 
            ? PaymentStatus.REFUNDED 
            : PaymentStatus.CANCELED
        }
      });

      return {
        success: true,
        message: 'Booking cancelled successfully',
        bookingRequest: updatedBookingRequest,
        paymentHandling: paymentHandlingResult,
        refundProcessed: dto.processRefund,
        requiresManualIntervention: paymentHandlingResult?.requiresManualIntervention || false
      };
    });
  }

  async rescheduleSession(dto: RescheduleSessionDto) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id: dto.bookingId },
      include: {
        liveSession: true,
        timeSlot: true
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    // Validate new time slot
    const newTimeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: dto.newTimeSlotId }
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
          increment: 1
        }
      }
    });

    // Update live session if exists
    if (bookingRequest.liveSession) {
      await this.prisma.liveSession.update({
        where: { id: bookingRequest.liveSession.id },
        data: {
          scheduledStart: newTimeSlot.startTime,
          scheduledEnd: newTimeSlot.endTime,
          timeSlotId: dto.newTimeSlotId
        }
      });
    }

    // Update time slots
    await this.prisma.timeSlot.update({
      where: { id: bookingRequest.timeSlotId! },
      data: {
        currentBookings: {
          decrement: 1
        },
        isBooked: false
      }
    });

    await this.prisma.timeSlot.update({
      where: { id: dto.newTimeSlotId },
      data: {
        currentBookings: {
          increment: 1
        },
        isBooked: true
      }
    });

    return {
      success: true,
      message: 'Session rescheduled successfully'
    };
  }

  async getSessionBookings(filter: SessionBookingFilterDto = {}) {
    const {
      instructorId,
      studentId,
      status,
      offeringId,
      startDate,
      endDate
    } = filter;

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
                profileImage: true
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true
          }
        },
        timeSlot: {
          include: {
            availability: true
          }
        },
        liveSession: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true,
            meetingLink: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
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
                email: true
              }
            }
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true
          }
        },
        timeSlot: {
          include: {
            availability: true
          }
        },
        liveSession: {
          include: {
            participants: true,
            reservations: true
          }
        }
      }
    });

    if (!booking) {
      throw new NotFoundException('Booking request not found');
    }

    return booking;
  }

  // REMOVED: Duplicate startSession method
  // Use LiveSessionService.startLiveSession instead
  // This method was removed to consolidate session lifecycle operations

  private generateJitsiMeetingId(sessionId: string): string {
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
        platformFee: (bookingRequest.finalPrice || 0) * 0.20, // 20% platform fee
        instructorPayout: (bookingRequest.finalPrice || 0) * 0.80, // 80% to instructor
        currency: bookingRequest.currency,
        status: SessionStatus.SCHEDULED,
        timeSlotId: bookingRequest.timeSlotId || undefined,
        materials: bookingRequest.offering.materials,
        recordingEnabled: bookingRequest.offering.recordingEnabled
      }
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
        paymentDate: new Date()
      }
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
        confirmedAt: new Date()
      }
    });

    // Update time slot booking count
    await this.prisma.timeSlot.update({
      where: { id: bookingRequest.timeSlotId! },
      data: {
        currentBookings: {
          increment: 1
        },
        isBooked: true
      }
    });

    // Generate Jitsi meeting room
    const meetingRoomId = this.generateJitsiMeetingId(liveSession.id);
    
    const updatedLiveSession = await this.prisma.liveSession.update({
      where: { id: liveSession.id },
      data: {
        meetingRoomId,
        meetingLink: `https://meet.jit.si/${meetingRoomId}`
      }
    });

    return {
      ...updatedLiveSession,
      meetingRoomId,
      meetingLink: `https://meet.jit.si/${meetingRoomId}`
    };
  }
}
