import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentService as MainPaymentService } from '../../payment/payment.service';
import { StreamService } from '../../stream/services/stream.service.simple';
import { 
  CreateLiveSessionDto, 
  UpdateLiveSessionDto,
  StartLiveSessionDto,
  EndLiveSessionDto,
  CancelLiveSessionDto,
  RescheduleLiveSessionDto,
  LiveSessionFilterDto
} from '../dto/live-session.dto';

@Injectable()
export class LiveSessionService {
  private readonly logger = new Logger(LiveSessionService.name);

  constructor(
    private prisma: PrismaService,
    private paymentService: MainPaymentService,
    private streamService: StreamService,
    private configService: ConfigService
  ) {}

  async getLiveSessions(filter: LiveSessionFilterDto = {}) {
    const {
      instructorId,
      studentId,
      status,
      sessionType,
      format,
      startDate,
      endDate,
      courseId,
      topicId,
      payoutStatus
    } = filter;

    const where: any = {};

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (studentId) {
      where.participants = {
        some: { userId: studentId }
      };
    }

    if (status) {
      where.status = status;
    }

    if (sessionType) {
      where.sessionType = sessionType;
    }

    if (format) {
      where.format = format;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    if (topicId) {
      where.topicId = topicId;
    }

    if (payoutStatus) {
      where.payoutStatus = payoutStatus;
    }

    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = startDate;
      if (endDate) where.scheduledStart.lte = endDate;
    }

    const sessions = await this.prisma.liveSession.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            teachingRating: true
          }
        },
        offering: {
          select: {
            id: true,
            title: true,
            sessionType: true,
            cancellationPolicy: true
          }
        },
        topic: {
          select: {
            id: true,
            name: true,
            difficulty: true,
            category: true
          }
        },
        bookingRequest: {
          select: {
            id: true,
            studentId: true,
            customTopic: true,
            customRequirements: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        },
        reviews: {
          select: {
            id: true,
            overallRating: true,
            comment: true,
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        },
        attendance: {
          select: {
            userId: true,
            status: true,
            duration: true,
            engagementScore: true
          }
        }
      },
      orderBy: { scheduledStart: 'desc' }
    });

    return sessions;
  }

  async getLiveSession(id: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            teachingRating: true,
            email: true
          }
        },
        offering: {
          select: {
            id: true,
            title: true,
            description: true,
            sessionType: true,
            sessionFormat: true,
            duration: true,
            materials: true,
            prerequisites: true,
            equipment: true,
            cancellationPolicy: true,
            recordingEnabled: true,
            whiteboardEnabled: true,
            screenShareEnabled: true,
            chatEnabled: true
          }
        },
        topic: {
          select: {
            id: true,
            name: true,
            description: true,
            difficulty: true,
            category: true,
            prerequisites: true,
            materials: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true
          }
        },
        bookingRequest: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                email: true,
                timezone: true
              }
            }
          }
        },
        timeSlot: {
          include: {
            availability: {
              select: {
                timezone: true
              }
            }
          }
        },
        participants: {
          include: {
            user: {
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
        attendance: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
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
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    return session;
  }

  async createLiveSession(createDto: CreateLiveSessionDto) {
    // Validate required fields
    if (!createDto.offeringId) {
      throw new BadRequestException('offeringId is required');
    }
    
    if (!createDto.instructorId) {
      throw new BadRequestException('instructorId is required');
    }
    
    if (!createDto.scheduledStart) {
      throw new BadRequestException('scheduledStart is required');
    }

    // Validate offering exists
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id: createDto.offeringId },
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

    // Validate instructor
    if (createDto.instructorId !== offering.instructorId) {
      throw new BadRequestException('Instructor does not match offering instructor');
    }

    // Validate booking request if provided
    if (createDto.bookingRequestId) {
      const bookingRequest = await this.prisma.bookingRequest.findUnique({
        where: { id: createDto.bookingRequestId }
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }

      if (bookingRequest.offeringId !== createDto.offeringId) {
        throw new BadRequestException('Booking request does not match offering');
      }

      if (bookingRequest.status !== 'ACCEPTED') {
        throw new BadRequestException('Booking request must be accepted');
      }
    }

    // Validate time slot if provided
    if (createDto.timeSlotId) {
      const timeSlot = await this.prisma.timeSlot.findUnique({
        where: { id: createDto.timeSlotId },
        include: {
          availability: true
        }
      });

      if (!timeSlot) {
        throw new NotFoundException('Time slot not found');
      }

      if (timeSlot.availability.instructorId !== createDto.instructorId) {
        throw new BadRequestException('Time slot does not belong to this instructor');
      }

      if (!timeSlot.isAvailable || timeSlot.isBooked) {
        throw new BadRequestException('Time slot is not available');
      }
    }

    // Validate topic if provided
    if (createDto.topicId && createDto.topicId.trim() !== '') {
      const topic = await this.prisma.sessionTopic.findUnique({
        where: { id: createDto.topicId }
      });

      if (!topic) {
        throw new NotFoundException('Session topic not found');
      }

      if (topic.instructorId !== createDto.instructorId) {
        throw new BadRequestException('Topic does not belong to this instructor');
      }
    }

    // Check for scheduling conflicts
    const conflictingSessions = await this.prisma.liveSession.findMany({
      where: {
        instructorId: createDto.instructorId,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        AND: [
          { scheduledStart: { lt: createDto.scheduledEnd } },
          { scheduledEnd: { gt: createDto.scheduledStart } }
        ]
      }
    });

    if (conflictingSessions.length > 0) {
      throw new BadRequestException('Session conflicts with existing scheduled sessions');
    }

    // Calculate duration and end time
    const sessionDuration = createDto.duration || offering.duration;
    const sessionStart = new Date(createDto.scheduledStart);
    const sessionEnd = new Date(sessionStart.getTime() + (sessionDuration * 60 * 1000)); // Convert minutes to milliseconds

    // Calculate financial details using offering price as fallback
    const sessionPrice = createDto.pricePerPerson || offering.basePrice;
    const platformFee = sessionPrice * (offering.instructor.instructorProfile?.platformFeeRate || 20) / 100;
    const instructorPayout = sessionPrice - platformFee;

    // Prepare session data with smart defaults
    const sessionData = {
      // Required links
      bookingRequestId: createDto.bookingRequestId,
      offeringId: createDto.offeringId,
      instructorId: createDto.instructorId,
      
      // Inherit from offering, allow override
      title: createDto.title || offering.title,
      description: createDto.description || offering.description,
      duration: sessionDuration,
      maxParticipants: createDto.maxParticipants || offering.capacity,
      minParticipants: createDto.minParticipants || offering.minParticipants || 1,
      pricePerPerson: sessionPrice,
      currency: createDto.currency || offering.currency,
      
      // Session-specific data
      scheduledStart: sessionStart,
      scheduledEnd: sessionEnd,
      currentParticipants: 0,
      status: 'SCHEDULED' as any,
      
      // Optional overrides (use offering defaults if not provided)
      sessionType: createDto.sessionType || (offering.sessionType as any),
      sessionFormat: createDto.sessionFormat || offering.sessionFormat,
      sessionMode: createDto.sessionMode || 'LIVE' as any, // Default to LIVE mode
      
      // Optional fields
      courseId: createDto.courseId,
      lectureId: createDto.lectureId,
      topicId: createDto.topicId && createDto.topicId.trim() !== '' ? createDto.topicId : null,
      customTopic: createDto.customTopic,
      finalTopic: createDto.finalTopic,
      timeSlotId: createDto.timeSlotId,
      meetingRoomId: createDto.meetingRoomId,
      meetingLink: createDto.meetingLink,
      meetingPassword: createDto.meetingPassword,
      recordingEnabled: createDto.recordingEnabled !== undefined ? createDto.recordingEnabled : offering.recordingEnabled,
      materials: createDto.materials || offering.materials || [],
      
      // Financial calculations
      totalPrice: createDto.totalPrice || (sessionPrice * (createDto.maxParticipants || offering.capacity)),
      totalRevenue: 0,
      platformFee,
      instructorPayout,
      payoutStatus: 'PENDING' as any
    };

    const session = await this.prisma.liveSession.create({
      data: sessionData,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            teachingRating: true
          }
        },
        offering: {
          select: {
            id: true,
            title: true,
            sessionType: true
          }
        }
      }
    });

    // Mark time slot as booked if applicable
    if (createDto.timeSlotId) {
      await this.prisma.timeSlot.update({
        where: { id: createDto.timeSlotId },
        data: {
          isBooked: true,
          currentBookings: { increment: 1 }
        }
      });
    }

    return session;
  }

  async updateLiveSession(id: string, updateDto: UpdateLiveSessionDto) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    // Validate status transitions
    if (updateDto.status && !this.isValidStatusTransition(session.status, updateDto.status)) {
      throw new BadRequestException(`Cannot change status from ${session.status} to ${updateDto.status}`);
    }

    // Check for scheduling conflicts if dates are being updated
    if (updateDto.scheduledStart || updateDto.scheduledEnd) {
      const newStart = updateDto.scheduledStart || session.scheduledStart;
      const newEnd = updateDto.scheduledEnd || session.scheduledEnd;

      const conflictingSessions = await this.prisma.liveSession.findMany({
        where: {
          id: { not: id },
          instructorId: session.instructorId,
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          AND: [
            { scheduledStart: { lt: newEnd } },
            { scheduledEnd: { gt: newStart } }
          ]
        }
      });

      if (conflictingSessions.length > 0) {
        throw new BadRequestException('Updated schedule conflicts with existing sessions');
      }
    }

    // Recalculate financial details if price changes
    let updateData = { ...updateDto };
    if (updateDto.pricePerPerson && updateDto.pricePerPerson !== session.pricePerPerson) {
      const offering = await this.prisma.sessionOffering.findUnique({
        where: { id: session.offeringId },
        include: {
          instructor: {
            include: {
              instructorProfile: true
            }
          }
        }
      });

      if (offering) {
        const platformFee = updateDto.pricePerPerson * (offering.instructor.instructorProfile?.platformFeeRate || 20) / 100;
        const instructorPayout = updateDto.pricePerPerson - platformFee;
        
        updateData.platformFee = platformFee;
        updateData.instructorPayout = instructorPayout;
      }
    }

    // Remove format field to avoid type conflicts
    const { format, ...cleanUpdateData } = updateData;

    const updatedSession = await this.prisma.liveSession.update({
      where: { id },
      data: {
        ...cleanUpdateData,
        materials: updateDto.materials !== undefined ? updateDto.materials : undefined,
        sessionArtifacts: updateDto.sessionArtifacts !== undefined ? updateDto.sessionArtifacts : undefined,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            teachingRating: true
          }
        },
        offering: {
          select: {
            id: true,
            title: true,
            sessionType: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        }
      }
    });

    return updatedSession;
  }

  async startLiveSession(id: string, startDto: StartLiveSessionDto = {}, userId?: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    // Validate instructor permissions if userId is provided
    if (userId && session.instructorId !== userId) {
      throw new ForbiddenException('Only the instructor can start this session');
    }

    if (session.status !== 'SCHEDULED' && session.status !== 'CONFIRMED') {
      throw new BadRequestException('Only scheduled or confirmed sessions can be started');
    }

    // Time validation logic can be uncommented if needed
    // const currentTime = new Date();
    // const scheduledStart = new Date(session.scheduledStart);
    // 
    // // Allow starting up to 15 minutes before scheduled time
    // if (currentTime < new Date(scheduledStart.getTime() - 15 * 60 * 1000)) {
    //   throw new BadRequestException('Session cannot be started more than 15 minutes before scheduled time');
    // }
    // 
    // // Check if session is too late (more than 2 hours after scheduled start)
    // const timeDiff = scheduledStart.getTime() - currentTime.getTime();
    // const minutesDiff = timeDiff / (1000 * 60);
    // if (minutesDiff < -120) {
    //   throw new BadRequestException('Session cannot be started. It\'s more than 2 hours after the scheduled start time.');
    // }

   // Create or get Stream call
  let callData;
  try {
    if (!session.meetingRoomId) {
      // Create new Stream call
      callData = await this.streamService.createCall(id, session.instructorId);
    } else {
      try {
        // Try to get existing call
        callData = await this.streamService.getCall(session.meetingRoomId);
      } catch (getCallError) {
        // If existing call not found, create a new one
        this.logger.warn(`Existing call ${session.meetingRoomId} not found, creating new call:`, getCallError.message);
        callData = await this.streamService.createCall(id, session.instructorId);
      }
    }
  } catch (error) {
    this.logger.error('Error creating/getting Stream call:', error);
    throw new BadRequestException(`Failed to initialize video call: ${error.message}`);
  }

  const currentTime = new Date();
  const updatedSession = await this.prisma.liveSession.update({
    where: { id },
    data: {
      status: 'IN_PROGRESS',
      actualStart: currentTime,
      meetingRoomId: callData.callId,
      meetingLink: `https://getstream.io/video/demos/?call_id=${callData.callId}`,
      meetingPassword: startDto.meetingPassword || session.meetingPassword,
      instructorNotes: startDto.instructorNotes || session.instructorNotes
    },
    include: {
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true
        }
      },
      participants: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }
    }
  });

  // Update participant statuses
  await this.prisma.sessionParticipant.updateMany({
    where: { sessionId: id },
    data: { status: 'ATTENDED' }
  });

  // Update reservation statuses
  await this.prisma.sessionReservation.updateMany({
    where: { sessionId: id },
    data: { status: 'COMPLETED' }
  });

  // Send notifications to participants
  for (const participant of updatedSession.participants) {
    await this.createNotification({
      userId: participant.userId,
      type: 'SESSION_STARTING',
      title: 'Session Starting',
      message: `Your session "${session.title}" is starting now`,
      sessionId: id
    });
  }

  return {
    success: true,
    message: 'Session started successfully',
    session: updatedSession,
    callData: {
      callId: callData.callId,
      callType: callData.callType,
      meetingLink: updatedSession.meetingLink,
      apiKey: this.configService.get('STREAM_API_KEY') // Client needs this
    }
  };
}

  async endLiveSession(id: string, endDto: EndLiveSessionDto = {}) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        bookingRequest: true,
        offering: {
          include: {
            instructor: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    // Allow ending from SCHEDULED or IN_PROGRESS status
    if (session.status !== 'SCHEDULED' && session.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Only scheduled or in-progress sessions can be ended');
    }

    const now = new Date();
    const actualDuration = session.actualStart 
      ? Math.round((now.getTime() - new Date(session.actualStart).getTime()) / 60000)
      : (endDto.actualDuration || session.duration);

    // Handle payment capture for booked sessions
    let paymentCaptured = false;
    if (session.bookingRequest?.paymentIntentId) {
      try {
        const captureResult = await this.paymentService.captureSessionPayment(
          session.bookingRequest.paymentIntentId
        );

        if (captureResult.success) {
          paymentCaptured = true;
          
          // Update booking request payment status to PAID
          await this.prisma.bookingRequest.update({
            where: { id: session.bookingRequest.id },
            data: {
              paymentStatus: 'PAID'
            }
          });

          // Update session reservation payment status to PAID
          await this.prisma.sessionReservation.updateMany({
            where: { sessionId: session.id },
            data: {
              paymentStatus: 'PAID'
            }
          });

          // Create payout session for instructor
          await this.prisma.payoutSession.create({
            data: {
              payoutId: 'temp', // Will be updated when creating actual payout
              sessionId: session.id,
              sessionAmount: session.totalPrice || 0,
              platformFee: session.platformFee,
              netAmount: session.instructorPayout
            }
          });

          console.log(`Payment captured successfully for session: ${session.id}`);
        } else {
          console.error('Failed to capture payment:', captureResult.error);
          // Don't throw error, just mark as failed
        }
      } catch (error) {
        console.error('Error capturing payment:', error);
        // Don't throw error, just mark as failed
      }
    }

    // End Stream call if it exists
    if (session.meetingRoomId) {
      try {
        await this.streamService.endCall(session.meetingRoomId);
        
        // Get recording URL if available
        const recordingUrl = await this.streamService.getRecording(session.meetingRoomId);
        if (recordingUrl) {
          endDto.recordingUrl = recordingUrl;
        }
      } catch (error) {
        console.error('Error ending Stream call:', error);
        // Don't throw error, just log it
      }
    }

    const updatedSession = await this.prisma.liveSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        actualEnd: now,
        actualDuration,
        sessionNotes: endDto.notes || session.sessionNotes,
        summary: endDto.summary || session.summary,
        instructorNotes: endDto.instructorNotes || session.instructorNotes,
        recordingUrl: endDto.recordingUrl || session.recordingUrl,
        sessionArtifacts: endDto.sessionArtifacts || session.sessionArtifacts || [],
        totalRevenue: session.pricePerPerson * session.currentParticipants,
        payoutStatus: paymentCaptured ? 'PENDING' : 'FAILED'
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        bookingRequest: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Update participant statuses
    await this.prisma.sessionParticipant.updateMany({
      where: {
        sessionId: id,
        status: 'ENROLLED'
      },
      data: {
        status: 'ATTENDED'
      }
    });

    // Send completion notifications
    for (const participant of updatedSession.participants) {
      await this.createNotification({
        userId: participant.userId,
        type: 'SESSION_COMPLETED',
        title: 'Session Completed',
        message: `Your session "${session.title}" has been completed`,
        sessionId: id
      });
    }

    // Update offering statistics
    await this.updateOfferingStats(session.offeringId);

    return {
      success: true,
      session: updatedSession,
      paymentCaptured: paymentCaptured
    };
  }

  async cancelLiveSession(id: string, cancelDto: CancelLiveSessionDto = {}) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        bookingRequest: true
      }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    if (!['SCHEDULED', 'CONFIRMED'].includes(session.status)) {
      throw new BadRequestException('Only scheduled or confirmed sessions can be cancelled');
    }

    const updatedSession = await this.prisma.liveSession.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        sessionNotes: cancelDto.reason || session.sessionNotes
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Release time slot if applicable
    if (session.timeSlotId) {
      await this.prisma.timeSlot.update({
        where: { id: session.timeSlotId },
        data: {
          isBooked: false,
          currentBookings: { decrement: 1 }
        }
      });
    }

    // Update booking request status if applicable
    if (session.bookingRequest) {
      await this.prisma.bookingRequest.update({
        where: { id: session.bookingRequest.id },
        data: { status: 'CANCELLED' }
      });
    }

    // Send cancellation notifications
    for (const participant of updatedSession.participants) {
      await this.createNotification({
        userId: participant.userId,
        type: 'SESSION_CANCELLED',
        title: 'Session Cancelled',
        message: `Your session "${session.title}" has been cancelled. ${cancelDto.reason || ''}`,
        sessionId: id
      });
    }

    return updatedSession;
  }

  async rescheduleLiveSession(id: string, rescheduleDto: RescheduleLiveSessionDto) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    if (!['SCHEDULED', 'CONFIRMED'].includes(session.status)) {
      throw new BadRequestException('Only scheduled or confirmed sessions can be rescheduled');
    }

    // Check for conflicts with the new time
    const conflictingSessions = await this.prisma.liveSession.findMany({
      where: {
        id: { not: id },
        instructorId: session.instructorId,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
        AND: [
          { scheduledStart: { lt: rescheduleDto.newEndTime } },
          { scheduledEnd: { gt: rescheduleDto.newStartTime } }
        ]
      }
    });

    if (conflictingSessions.length > 0) {
      throw new BadRequestException('New schedule conflicts with existing sessions');
    }

    const updatedSession = await this.prisma.liveSession.update({
      where: { id },
      data: {
        scheduledStart: rescheduleDto.newStartTime,
        scheduledEnd: rescheduleDto.newEndTime,
        status: 'RESCHEDULED',
        sessionNotes: rescheduleDto.reason || session.sessionNotes
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    });

    // Send reschedule notifications
    for (const participant of updatedSession.participants) {
      await this.createNotification({
        userId: participant.userId,
        type: 'SESSION_RESCHEDULED',
        title: 'Session Rescheduled',
        message: `Your session "${session.title}" has been rescheduled. ${rescheduleDto.reason || ''}`,
        sessionId: id
      });
    }

    return updatedSession;
  }

  async addParticipant(sessionId: string, userId: string, role: string = 'STUDENT') {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    if (session.currentParticipants >= session.maxParticipants) {
      throw new BadRequestException('Session is at maximum capacity');
    }

    // Check if user is already a participant
    const existingParticipant = await this.prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      }
    });

    if (existingParticipant) {
      throw new BadRequestException('User is already a participant in this session');
    }

    const participant = await this.prisma.sessionParticipant.create({
      data: {
        sessionId,
        userId,
        role: role as any,
        status: 'ENROLLED',
        deviceType: 'DESKTOP',
        paidAmount: session.pricePerPerson,
        currency: session.currency,
        paymentDate: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true
          }
        }
      }
    });

    // Update session participant count
    await this.prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        currentParticipants: { increment: 1 }
      }
    });

    // Create attendance record
    await this.prisma.attendanceRecord.create({
      data: {
        sessionId,
        userId,
        status: 'NOT_ATTENDED',
        duration: 0,
        cameraOnTime: 0,
        micActiveTime: 0,
        chatMessages: 0,
        questionsAsked: 0,
        pollResponses: 0,
        engagementScore: 0
      }
    });

    return participant;
  }

  async removeParticipant(sessionId: string, userId: string) {
    const participant = await this.prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      }
    });

    if (!participant) {
      throw new NotFoundException('Participant not found in this session');
    }

    // Remove participant
    await this.prisma.sessionParticipant.delete({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      }
    });

    // Update session participant count
    await this.prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        currentParticipants: { decrement: 1 }
      }
    });

    return { success: true };
  }

  async updateAttendance(sessionId: string, userId: string, attendanceData: {
    joinedAt?: Date;
    leftAt?: Date;
    status?: string;
    engagementMetrics?: {
      cameraOnTime?: number;
      micActiveTime?: number;
      chatMessages?: number;
      questionsAsked?: number;
      pollResponses?: number;
    };
  }) {
    const attendanceRecord = await this.prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      }
    });

    if (!attendanceRecord) {
      throw new NotFoundException('Attendance record not found');
    }

    const updateData: any = {};

    if (attendanceData.joinedAt) {
      updateData.joinedAt = attendanceData.joinedAt;
    }

    if (attendanceData.leftAt) {
      updateData.leftAt = attendanceData.leftAt;
      
      // Calculate duration
      if (attendanceRecord.joinedAt) {
        const duration = Math.round((attendanceData.leftAt.getTime() - attendanceRecord.joinedAt.getTime()) / 60000);
        updateData.duration = duration;
      }
    }

    if (attendanceData.status) {
      updateData.status = attendanceData.status;
    }

    if (attendanceData.engagementMetrics) {
      Object.assign(updateData, attendanceData.engagementMetrics);
      
      // Calculate engagement score
      const metrics = attendanceData.engagementMetrics;
      const maxScore = 100;
      let score = 0;
      
      if (metrics.cameraOnTime && updateData.duration) {
        score += (metrics.cameraOnTime / updateData.duration) * 30; // 30% weight
      }
      
      if (metrics.chatMessages) {
        score += Math.min(metrics.chatMessages * 5, 20); // 20% weight, max 4 messages
      }
      
      if (metrics.questionsAsked) {
        score += Math.min(metrics.questionsAsked * 10, 30); // 30% weight, max 3 questions
      }
      
      if (metrics.pollResponses) {
        score += Math.min(metrics.pollResponses * 5, 20); // 20% weight, max 4 polls
      }
      
      updateData.engagementScore = Math.min(Math.round(score), maxScore);
    }

    const updatedAttendance = await this.prisma.attendanceRecord.update({
      where: {
        sessionId_userId: {
          sessionId,
          userId
        }
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });

    return updatedAttendance;
  }

  async getSessionAttendance(sessionId: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    return this.prisma.attendanceRecord.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true
          }
        }
      },
      orderBy: { joinedAt: 'asc' }
    });
  }

  async getSessionParticipants(sessionId: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    return this.prisma.sessionParticipant.findMany({
      where: { sessionId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'SCHEDULED': ['CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'IN_PROGRESS'],
      'CONFIRMED': ['IN_PROGRESS', 'CANCELLED', 'RESCHEDULED'],
      'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
      'COMPLETED': [],
      'CANCELLED': ['SCHEDULED'], // Allow rescheduling cancelled sessions
      'NO_SHOW': [],
      'RESCHEDULED': ['SCHEDULED', 'CONFIRMED', 'CANCELLED']
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    sessionId?: string;
  }) {
    return this.prisma.sessionNotification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        data: {},
        isRead: false,
        isEmail: true,
        isPush: true,
        isSMS: false,
        deliveryStatus: 'QUEUED',
        sessionId: data.sessionId,
        scheduledFor: new Date()
      }
    });
  }

  private async updateOfferingStats(offeringId: string) {
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id: offeringId },
      include: {
        liveSessions: {
          include: {
            reviews: true
          }
        }
      }
    });

    if (!offering) return;

    const completedSessions = offering.liveSessions.filter(s => s.status === 'COMPLETED');
    const totalRevenue = completedSessions.reduce((sum, session) => sum + session.instructorPayout, 0);
    
    const allReviews = offering.liveSessions.flatMap(s => s.reviews);
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.overallRating, 0) / allReviews.length 
      : 0;

    await this.prisma.sessionOffering.update({
      where: { id: offeringId },
      data: {
        totalBookings: offering.liveSessions.length,
        totalRevenue,
        averageRating: Math.round(averageRating * 100) / 100
      }
    });
  }

  async getSessionStats(instructorId?: string, studentId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (studentId) {
      where.participants = {
        some: { userId: studentId }
      };
    }

    if (startDate || endDate) {
      where.scheduledStart = {};
      if (startDate) where.scheduledStart.gte = startDate;
      if (endDate) where.scheduledStart.lte = endDate;
    }

    const [
      totalSessions,
      scheduledSessions,
      completedSessions,
      cancelledSessions,
      inProgressSessions,
      totalRevenue,
      averageRating
    ] = await Promise.all([
      this.prisma.liveSession.count({ where }),
      this.prisma.liveSession.count({ where: { ...where, status: 'SCHEDULED' } }),
      this.prisma.liveSession.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.liveSession.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.liveSession.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.liveSession.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { instructorPayout: true }
      }),
      this.prisma.sessionReview.aggregate({
        where: {
          session: where
        },
        _avg: { overallRating: true }
      })
    ]);

    const completionRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
    const cancellationRate = totalSessions > 0 ? (cancelledSessions / totalSessions) * 100 : 0;

    return {
      totalSessions,
      scheduledSessions,
      completedSessions,
      cancelledSessions,
      inProgressSessions,
      totalRevenue: totalRevenue._sum.instructorPayout || 0,
      averageRating: Math.round((averageRating._avg.overallRating || 0) * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100,
      cancellationRate: Math.round(cancellationRate * 100) / 100
    };
  }

  async getUpcomingSessions(instructorId?: string, studentId?: string, days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const where: any = {
      scheduledStart: {
        gte: startDate,
        lte: endDate
      },
      status: { in: ['SCHEDULED', 'CONFIRMED'] }
    };

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (studentId) {
      where.participants = {
        some: { userId: studentId }
      };
    }

    // Add some debugging
    console.log('getUpcomingSessions called with:', { instructorId, studentId, days });
    console.log('Query where clause:', JSON.stringify(where, null, 2));

    const sessions = await this.prisma.liveSession.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        },
        offering: {
          select: {
            id: true,
            title: true,
            sessionType: true
          }
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        }
      },
      orderBy: { scheduledStart: 'asc' }
    });

    console.log(`Found ${sessions.length} upcoming sessions`);
    return sessions;
  }
}