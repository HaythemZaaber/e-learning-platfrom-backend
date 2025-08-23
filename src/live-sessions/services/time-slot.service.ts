import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateTimeSlotDto, 
  UpdateTimeSlotDto,
  GetTimeSlotsFilterDto,
  GenerateTimeSlotsDto
} from '../dto/time-slot.dto';

@Injectable()
export class TimeSlotService {
  constructor(private prisma: PrismaService) {}

  async getTimeSlots(filter: GetTimeSlotsFilterDto = {}) {
    const where: any = {};

    if (filter.availabilityId) {
      where.availabilityId = filter.availabilityId;
    }

    if (filter.instructorId) {
      where.availability = {
        instructorId: filter.instructorId
      };
    }

    if (filter.date) {
      where.date = {
        gte: new Date(filter.date),
        lt: new Date(new Date(filter.date).getTime() + 24 * 60 * 60 * 1000)
      };
    }

    if (filter.isAvailable !== undefined) {
      where.isAvailable = filter.isAvailable;
    }

    if (filter.isBooked !== undefined) {
      where.isBooked = filter.isBooked;
    }

    if (filter.isBlocked !== undefined) {
      where.isBlocked = filter.isBlocked;
    }

    return this.prisma.timeSlot.findMany({
      where,
      include: {
        availability: {
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
        bookingRequests: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        },
        sessions: {
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
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });
  }

  async getTimeSlot(id: string) {
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id },
      include: {
        availability: {
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
        bookingRequests: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true
              }
            }
          }
        },
        sessions: {
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
        }
      }
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    return timeSlot;
  }

  async generateTimeSlots(generateDto: GenerateTimeSlotsDto) {
    const { availabilityId, startDate, endDate } = generateDto;

    // Get the availability record
    const availability = await this.prisma.instructorAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!availability) {
      throw new NotFoundException('Availability record not found');
    }

    const generatedSlots: any[] = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      // Check if this date matches the availability pattern
      const dayOfWeek = currentDate.getDay();
      
      // Generate slots for this date
      const slots = await this.generateSlotsForDate(availability, currentDate);
      generatedSlots.push(...slots);

      // Move to next date
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return generatedSlots;
  }

  private async generateSlotsForDate(availability: any, date: Date) {
    const slots: any[] = [];
    const { startTime, endTime, defaultSlotDuration, bufferMinutes } = availability;

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    let currentSlotStart = new Date(startDateTime);

    while (currentSlotStart < endDateTime) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + defaultSlotDuration * 60 * 1000);

      // Check if this slot fits within the availability window
      if (currentSlotEnd <= endDateTime) {
        // Check for conflicts with existing slots
        const existingSlot = await this.prisma.timeSlot.findFirst({
          where: {
            availabilityId: availability.id,
            startTime: currentSlotStart,
            endTime: currentSlotEnd
          }
        });

        if (!existingSlot) {
          const slot = await this.prisma.timeSlot.create({
            data: {
              availabilityId: availability.id,
              startTime: currentSlotStart,
              endTime: currentSlotEnd,
              date: date,
              dayOfWeek: date.getDay(),
              slotDuration: defaultSlotDuration,
              timezone: availability.timezone,
              maxBookings: availability.maxSessionsInSlot,
              currentBookings: 0,
              isAvailable: true,
              isBooked: false,
              isBlocked: false
            }
          });

          slots.push(slot);
        }
      }

      // Move to next slot (including buffer time)
      currentSlotStart = new Date(currentSlotEnd.getTime() + bufferMinutes * 60 * 1000);
    }

    return slots;
  }

  async updateTimeSlot(id: string, updateDto: UpdateTimeSlotDto) {
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id }
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    // Check if slot is already booked
    if (timeSlot.isBooked && (updateDto.isBooked === false || updateDto.isAvailable === false)) {
      throw new BadRequestException('Cannot modify a booked time slot');
    }

    return this.prisma.timeSlot.update({
      where: { id },
      data: updateDto,
      include: {
        availability: {
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
        }
      }
    });
  }

  async blockTimeSlot(id: string, reason?: string) {
    return this.updateTimeSlot(id, {
      isBlocked: true,
      isAvailable: false
    });
  }

  async unblockTimeSlot(id: string) {
    return this.updateTimeSlot(id, {
      isBlocked: false,
      isAvailable: true
    });
  }

  async deleteTimeSlot(id: string) {
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id }
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    if (timeSlot.isBooked) {
      throw new BadRequestException('Cannot delete a booked time slot');
    }

    await this.prisma.timeSlot.delete({
      where: { id }
    });

    return { message: 'Time slot deleted successfully' };
  }

  async getAvailableTimeSlots(instructorId: string, date: Date, offeringId?: string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const where: any = {
      date: {
        gte: startOfDay,
        lte: endOfDay
      },
      isAvailable: true,
      isBooked: false,
      isBlocked: false,
      availability: {
        instructorId,
        isActive: true
      }
    };

    // If offering is specified, check if slots match the offering duration
    if (offeringId) {
      const offering = await this.prisma.sessionOffering.findUnique({
        where: { id: offeringId },
        select: { duration: true }
      });

      if (offering) {
        where.slotDuration = { gte: offering.duration };
      }
    }

    return this.prisma.timeSlot.findMany({
      where,
      include: {
        availability: {
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
        }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  async checkTimeSlotAvailability(
    instructorId: string,
    date: Date,
    startTime: string,
    endTime: string
  ) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const requestedStart = new Date(date);
    requestedStart.setHours(startHour, startMinute, 0, 0);

    const requestedEnd = new Date(date);
    requestedEnd.setHours(endHour, endMinute, 0, 0);

    // Check for conflicts with existing sessions
    const conflictingSessions = await this.prisma.liveSession.findMany({
      where: {
        instructorId,
        scheduledStart: { lt: requestedEnd },
        scheduledEnd: { gt: requestedStart },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    });

    // Check for conflicts with blocked time slots
    const conflictingSlots = await this.prisma.timeSlot.findMany({
      where: {
        availability: { instructorId },
        startTime: { lt: requestedEnd },
        endTime: { gt: requestedStart },
        OR: [
          { isBooked: true },
          { isBlocked: true },
          { isAvailable: false }
        ]
      }
    });

    const conflicts = [...conflictingSessions, ...conflictingSlots];

    return {
      available: conflicts.length === 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined
    };
  }

  async getTimeSlotStats(instructorId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      availability: { instructorId }
    };

    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      totalSlots,
      availableSlots,
      bookedSlots,
      blockedSlots
    ] = await Promise.all([
      this.prisma.timeSlot.count({ where }),
      this.prisma.timeSlot.count({ 
        where: { ...where, isAvailable: true, isBooked: false, isBlocked: false }
      }),
      this.prisma.timeSlot.count({ 
        where: { ...where, isBooked: true }
      }),
      this.prisma.timeSlot.count({ 
        where: { ...where, isBlocked: true }
      })
    ]);

    return {
      totalSlots,
      availableSlots,
      bookedSlots,
      blockedSlots,
      utilizationRate: totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0
    };
  }
}
