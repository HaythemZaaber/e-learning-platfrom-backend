import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateBookingRequestDto, 
  UpdateBookingRequestDto,
  AcceptBookingRequestDto,
  RejectBookingRequestDto,
  CancelBookingRequestDto,
  BookingRequestFilterDto
} from '../dto/booking-request.dto';

@Injectable()
export class BookingRequestService {
  constructor(private prisma: PrismaService) {}

  async getBookingRequests(filter: BookingRequestFilterDto = {}) {
    const {
      instructorId,
      studentId,
      status,
      offeringId,
      bookingMode,
      paymentStatus,
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

    if (bookingMode) {
      where.bookingMode = bookingMode;
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const bookingRequests = await this.prisma.bookingRequest.findMany({
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
            scheduledEnd: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return bookingRequests;
  }

  async getBookingRequest(id: string) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
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
                teachingRating: true
              }
            },
            topic: {
              select: {
                id: true,
                name: true,
                difficulty: true,
                category: true
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
            email: true,
            timezone: true
          }
        },
        timeSlot: {
          include: {
            availability: {
              select: {
                timezone: true,
                instructorId: true
              }
            }
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
        },
        notifications: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    return bookingRequest;
  }

  async createBookingRequest(createDto: CreateBookingRequestDto) {
    // Validate offering exists and is active
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

    if (!offering.isActive || !offering.isPublic) {
      throw new BadRequestException('Session offering is not available for booking');
    }

    // Validate student exists
    const student = await this.prisma.user.findUnique({
      where: { id: createDto.studentId }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
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

      if (!timeSlot.isAvailable || timeSlot.isBooked || timeSlot.isBlocked) {
        throw new BadRequestException('Time slot is not available');
      }

      if (timeSlot.availability.instructorId !== offering.instructorId) {
        throw new BadRequestException('Time slot does not belong to this instructor');
      }

      // Check if slot duration is sufficient
      if (timeSlot.slotDuration < offering.duration) {
        throw new BadRequestException('Time slot duration is insufficient for this offering');
      }
    }

    // Check for duplicate pending requests
    const existingRequest = await this.prisma.bookingRequest.findFirst({
      where: {
        offeringId: createDto.offeringId,
        studentId: createDto.studentId,
        status: { in: ['PENDING', 'ACCEPTED'] }
      }
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending or accepted booking for this offering');
    }

    // Validate pricing
    if (createDto.offeredPrice < offering.basePrice * 0.5) {
      throw new BadRequestException('Offered price is too low');
    }

    // Calculate expiration time (default 24 hours)
    const expiresAt = createDto.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000);

    const bookingRequest = await this.prisma.bookingRequest.create({
      data: {
        offeringId: createDto.offeringId,
        studentId: createDto.studentId,
        bookingMode: createDto.bookingMode,
        preferredDate: createDto.preferredDate,
        preferredTime: createDto.preferredTime,
        alternativeDates: createDto.alternativeDates || [],
        timeSlotId: createDto.timeSlotId,
        customTopic: createDto.customTopic,
        topicDescription: createDto.topicDescription,
        customRequirements: createDto.customRequirements,
        studentMessage: createDto.studentMessage,
        status: offering.instructor.instructorProfile?.autoAcceptBookings ? 'ACCEPTED' : 'PENDING',
        priority: createDto.priority || 1,
        rescheduleCount: 0,
        offeredPrice: createDto.offeredPrice,
        finalPrice: offering.instructor.instructorProfile?.autoAcceptBookings ? createDto.offeredPrice : undefined,
        currency: createDto.currency,
        paymentStatus: 'PENDING',
        expiresAt
      },
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
        }
      }
    });

    // If auto-accepted, create the live session immediately
    if (offering.instructor.instructorProfile?.autoAcceptBookings) {
      await this.createLiveSessionFromBooking(bookingRequest.id);
    }

    // Send notification to instructor
    await this.createNotification({
      userId: offering.instructorId,
      type: 'BOOKING_RECEIVED',
      title: 'New Booking Request',
      message: `${student.firstName} ${student.lastName} has requested to book "${offering.title}"`,
      bookingRequestId: bookingRequest.id
    });

    return bookingRequest;
  }

  async updateBookingRequest(id: string, updateDto: UpdateBookingRequestDto) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        offering: true,
        student: true
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    // Validate status transitions
    if (updateDto.status && !this.isValidStatusTransition(bookingRequest.status, updateDto.status)) {
      throw new BadRequestException(`Cannot change status from ${bookingRequest.status} to ${updateDto.status}`);
    }

    // Validate time slot if being updated
    if (updateDto.timeSlotId) {
      const timeSlot = await this.prisma.timeSlot.findUnique({
        where: { id: updateDto.timeSlotId },
        include: {
          availability: true
        }
      });

      if (!timeSlot || !timeSlot.isAvailable || timeSlot.isBooked) {
        throw new BadRequestException('Time slot is not available');
      }

      if (timeSlot.availability.instructorId !== bookingRequest.offering.instructorId) {
        throw new BadRequestException('Time slot does not belong to this instructor');
      }
    }

    const updatedBookingRequest = await this.prisma.bookingRequest.update({
      where: { id },
      data: {
        ...updateDto,
        alternativeDates: updateDto.alternativeDates !== undefined ? updateDto.alternativeDates : undefined,
        respondedAt: updateDto.status && ['ACCEPTED', 'REJECTED'].includes(updateDto.status) 
          ? new Date() : undefined,
        acceptedAt: updateDto.status === 'ACCEPTED' ? new Date() : undefined,
        rejectedAt: updateDto.status === 'REJECTED' ? new Date() : undefined,
        cancelledAt: updateDto.status === 'CANCELLED' ? new Date() : undefined,
      },
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
        }
      }
    });

    return updatedBookingRequest;
  }

  async acceptBookingRequest(id: string, acceptDto: AcceptBookingRequestDto = {}) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        offering: {
          include: {
            instructor: true
          }
        },
        student: true
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    if (bookingRequest.status !== 'PENDING') {
      throw new BadRequestException('Only pending booking requests can be accepted');
    }

    if (new Date() > bookingRequest.expiresAt) {
      throw new BadRequestException('Booking request has expired');
    }

    // Update booking request
    const updatedBookingRequest = await this.prisma.bookingRequest.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        instructorResponse: acceptDto.response,
        finalPrice: acceptDto.finalPrice || bookingRequest.offeredPrice,
        timeSlotId: acceptDto.timeSlotId || bookingRequest.timeSlotId,
        respondedAt: new Date(),
        acceptedAt: new Date()
      },
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
        }
      }
    });

    // Create live session
    await this.createLiveSessionFromBooking(id, acceptDto.scheduledStart, acceptDto.scheduledEnd);

    // Send notification to student
    await this.createNotification({
      userId: bookingRequest.studentId,
      type: 'BOOKING_ACCEPTED',
      title: 'Booking Request Accepted',
      message: `Your booking request for "${bookingRequest.offering.title}" has been accepted`,
      bookingRequestId: id
    });

    return updatedBookingRequest;
  }

  async rejectBookingRequest(id: string, rejectDto: RejectBookingRequestDto = {}) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        offering: true,
        student: true
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    if (bookingRequest.status !== 'PENDING') {
      throw new BadRequestException('Only pending booking requests can be rejected');
    }

    const updatedBookingRequest = await this.prisma.bookingRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        instructorResponse: rejectDto.response || rejectDto.reason,
        respondedAt: new Date(),
        rejectedAt: new Date()
      },
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
        }
      }
    });

    // Send notification to student
    await this.createNotification({
      userId: bookingRequest.studentId,
      type: 'BOOKING_REJECTED',
      title: 'Booking Request Rejected',
      message: `Your booking request for "${bookingRequest.offering.title}" has been rejected`,
      bookingRequestId: id
    });

    return updatedBookingRequest;
  }

  async cancelBookingRequest(id: string, cancelDto: CancelBookingRequestDto = {}) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        offering: true,
        student: true,
        liveSession: true
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    if (!['PENDING', 'ACCEPTED'].includes(bookingRequest.status)) {
      throw new BadRequestException('Only pending or accepted booking requests can be cancelled');
    }

    // If there's an associated live session, handle cancellation
    if (bookingRequest.liveSession) {
      const session = bookingRequest.liveSession;
      if (['IN_PROGRESS', 'COMPLETED'].includes(session.status)) {
        throw new BadRequestException('Cannot cancel booking for session that is in progress or completed');
      }

      // Cancel the live session
      await this.prisma.liveSession.update({
        where: { id: session.id },
        data: { status: 'CANCELLED' }
      });
    }

    const updatedBookingRequest = await this.prisma.bookingRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED'
      },
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
        }
      }
    });

    return updatedBookingRequest;
  }

  private async createLiveSessionFromBooking(
    bookingRequestId: string, 
    scheduledStart?: Date, 
    scheduledEnd?: Date
  ) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id: bookingRequestId },
      include: {
        offering: true,
        timeSlot: true
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    let sessionStart: Date;
    let sessionEnd: Date;

    if (scheduledStart && scheduledEnd) {
      sessionStart = scheduledStart;
      sessionEnd = scheduledEnd;
    } else if (bookingRequest.timeSlot) {
      sessionStart = bookingRequest.timeSlot.startTime;
      sessionEnd = bookingRequest.timeSlot.endTime;
    } else if (bookingRequest.preferredDate && bookingRequest.preferredTime) {
      sessionStart = new Date(`${bookingRequest.preferredDate.toISOString().split('T')[0]}T${bookingRequest.preferredTime}:00.000Z`);
      sessionEnd = new Date(sessionStart.getTime() + bookingRequest.offering.duration * 60000);
    } else {
      throw new BadRequestException('No valid schedule found for creating live session');
    }

    const liveSession = await this.prisma.liveSession.create({
      data: {
        bookingRequestId,
        offeringId: bookingRequest.offeringId,
        instructorId: bookingRequest.offering.instructorId,
        sessionType: 'CUSTOM',
        topicId: bookingRequest.offering.topicId,
        customTopic: bookingRequest.customTopic || bookingRequest.offering.fixedTopic,
        title: bookingRequest.offering.title,
        description: bookingRequest.offering.description,
        finalTopic: bookingRequest.customTopic || bookingRequest.offering.fixedTopic,
        sessionFormat: bookingRequest.offering.sessionFormat,
        sessionMode: 'LIVE',
        maxParticipants: bookingRequest.offering.capacity,
        minParticipants: bookingRequest.offering.minParticipants || 1,
        currentParticipants: 0,
        scheduledStart: sessionStart,
        scheduledEnd: sessionEnd,
        duration: bookingRequest.offering.duration,
        status: 'SCHEDULED',
        timeSlotId: bookingRequest.timeSlotId,
        recordingEnabled: bookingRequest.offering.recordingEnabled,
        materials: bookingRequest.offering.materials,
        pricePerPerson: bookingRequest.finalPrice || bookingRequest.offeredPrice,
        totalPrice: bookingRequest.finalPrice || bookingRequest.offeredPrice,
        currency: bookingRequest.currency,
        payoutStatus: 'PENDING'
      }
    });

    // Mark time slot as booked if applicable
    if (bookingRequest.timeSlotId) {
      await this.prisma.timeSlot.update({
        where: { id: bookingRequest.timeSlotId },
        data: {
          isBooked: true,
          currentBookings: { increment: 1 }
        }
      });
    }

    return liveSession;
  }

  private isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
    const validTransitions: Record<string, string[]> = {
      'PENDING': ['ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
      'ACCEPTED': ['CANCELLED', 'COMPLETED'],
      'REJECTED': [],
      'CANCELLED': [],
      'EXPIRED': [],
      'COMPLETED': []
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    bookingRequestId?: string;
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
        bookingRequestId: data.bookingRequestId,
        scheduledFor: new Date()
      }
    });
  }

  async getBookingRequestsByStudent(studentId: string, status?: string) {
    const where: any = { studentId };
    if (status) where.status = status;

    return this.prisma.bookingRequest.findMany({
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
                teachingRating: true
              }
            }
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
  }

  async getBookingRequestsByInstructor(instructorId: string, status?: string) {
    const where: any = {
      offering: { instructorId }
    };
    if (status) where.status = status;

    return this.prisma.bookingRequest.findMany({
      where,
      include: {
        offering: {
          select: {
            id: true,
            title: true,
            sessionType: true,
            duration: true,
            basePrice: true
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
        liveSession: {
          select: {
            id: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async expireBookingRequests() {
    const expiredRequests = await this.prisma.bookingRequest.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: new Date() }
      }
    });

    if (expiredRequests.length > 0) {
      await this.prisma.bookingRequest.updateMany({
        where: {
          id: { in: expiredRequests.map(r => r.id) }
        },
        data: {
          status: 'EXPIRED'
        }
      });

      // Send notifications to students about expired requests
      for (const request of expiredRequests) {
        await this.createNotification({
          userId: request.studentId,
          type: 'BOOKING_EXPIRED',
          title: 'Booking Request Expired',
          message: 'Your booking request has expired due to no response from the instructor',
          bookingRequestId: request.id
        });
      }
    }

    return expiredRequests.length;
  }

  async getBookingRequestStats(instructorId?: string, studentId?: string) {
    const where: any = {};

    if (instructorId) {
      where.offering = { instructorId };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    const [
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      cancelledRequests,
      expiredRequests,
      completedRequests
    ] = await Promise.all([
      this.prisma.bookingRequest.count({ where }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'ACCEPTED' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'EXPIRED' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'COMPLETED' } })
    ]);

    const acceptanceRate = totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0;
    const completionRate = acceptedRequests > 0 ? (completedRequests / acceptedRequests) * 100 : 0;

    return {
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      cancelledRequests,
      expiredRequests,
      completedRequests,
      acceptanceRate: Math.round(acceptanceRate * 100) / 100,
      completionRate: Math.round(completionRate * 100) / 100
    };
  }

  async rescheduleBookingRequest(id: string, newDate: Date, newTime: string, reason?: string) {
    const bookingRequest = await this.prisma.bookingRequest.findUnique({
      where: { id },
      include: {
        liveSession: true,
        offering: true
      }
    });

    if (!bookingRequest) {
      throw new NotFoundException('Booking request not found');
    }

    if (bookingRequest.status !== 'ACCEPTED') {
      throw new BadRequestException('Only accepted booking requests can be rescheduled');
    }

    if (bookingRequest.rescheduleCount >= 3) {
      throw new BadRequestException('Maximum reschedule limit reached');
    }

    // Update booking request
    const updatedBookingRequest = await this.prisma.bookingRequest.update({
      where: { id },
      data: {
        preferredDate: newDate,
        preferredTime: newTime,
        rescheduleCount: { increment: 1 },
        instructorResponse: reason
      }
    });

    // Update associated live session if it exists
    if (bookingRequest.liveSession) {
      const newStartTime = new Date(`${newDate.toISOString().split('T')[0]}T${newTime}:00.000Z`);
      const newEndTime = new Date(newStartTime.getTime() + bookingRequest.offering.duration * 60000);

      await this.prisma.liveSession.update({
        where: { id: bookingRequest.liveSession.id },
        data: {
          scheduledStart: newStartTime,
          scheduledEnd: newEndTime,
          status: 'RESCHEDULED'
        }
      });
    }

    return updatedBookingRequest;
  }
}