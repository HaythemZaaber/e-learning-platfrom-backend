import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateAvailabilityDto, 
  UpdateAvailabilityDto,
  GenerateTimeSlotsDto,
  CheckAvailabilityDto,
  GetAvailabilityFilterDto,
  GetAvailableTimeSlotsDto
} from '../dto/availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async getInstructorAvailability(filter: GetAvailabilityFilterDto) {
    const { instructorId, startDate, endDate } = filter;

    const where: any = { instructorId };

    if (startDate || endDate) {
      where.specificDate = {};
      if (startDate) where.specificDate.gte = startDate;
      if (endDate) where.specificDate.lte = endDate;
    }

    const availabilities = await this.prisma.instructorAvailability.findMany({
      where,
      include: {
        generatedSlots: {
          orderBy: { startTime: 'asc' }
        }
      },
      orderBy: [
        { specificDate: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return availabilities;
  }

  async createAvailability(createDto: CreateAvailabilityDto) {
    // Validate instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: createDto.instructorId }
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Check for conflicts
    const existingAvailability = await this.prisma.instructorAvailability.findFirst({
      where: {
        instructorId: createDto.instructorId,
        specificDate: createDto.specificDate,
        OR: [
          {
            AND: [
              { startTime: { lte: createDto.startTime } },
              { endTime: { gt: createDto.startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: createDto.endTime } },
              { endTime: { gte: createDto.endTime } }
            ]
          },
          {
            AND: [
              { startTime: { gte: createDto.startTime } },
              { endTime: { lte: createDto.endTime } }
            ]
          }
        ]
      }
    });

    if (existingAvailability) {
      throw new ConflictException('Time slot conflicts with existing availability');
    }

    // Validate time format and logic
    if (createDto.startTime >= createDto.endTime) {
      throw new BadRequestException('Start time must be before end time');
    }

    const availability = await this.prisma.instructorAvailability.create({
      data: {
        instructorId: createDto.instructorId,
        specificDate: createDto.specificDate,
        startTime: createDto.startTime,
        endTime: createDto.endTime,
        isActive: createDto.isActive !== false,
        maxSessionsInSlot: createDto.maxSessionsInSlot || 1,
        defaultSlotDuration: createDto.defaultSlotDuration || 60,
        minAdvanceHours: createDto.minAdvanceHours || 12,
        maxAdvanceHours: createDto.maxAdvanceHours || 720,
        bufferMinutes: createDto.bufferMinutes || 15,
        autoAcceptBookings: createDto.autoAcceptBookings || false,
        priceOverride: createDto.priceOverride,
        currency: createDto.currency || 'USD',
        timezone: createDto.timezone || 'UTC',
        notes: createDto.notes,
        title: createDto.title,
      },
      include: {
        generatedSlots: true
      }
    });

    // Generate time slots automatically
    await this.generateSlotsForAvailability(availability.id);

    return this.prisma.instructorAvailability.findUnique({
      where: { id: availability.id },
      include: {
        generatedSlots: {
          orderBy: { startTime: 'asc' }
        }
      }
    });
  }

  async updateAvailability(id: string, updateDto: UpdateAvailabilityDto) {
    const availability = await this.prisma.instructorAvailability.findUnique({
      where: { id }
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    // Check for conflicts if time is being changed
    if (updateDto.startTime || updateDto.endTime || updateDto.specificDate) {
      const newStartTime = updateDto.startTime || availability.startTime;
      const newEndTime = updateDto.endTime || availability.endTime;
      const newDate = updateDto.specificDate || availability.specificDate;

      if (newStartTime >= newEndTime) {
        throw new BadRequestException('Start time must be before end time');
      }

      const conflictingAvailability = await this.prisma.instructorAvailability.findFirst({
        where: {
          id: { not: id },
          instructorId: availability.instructorId,
          specificDate: newDate,
          OR: [
            {
              AND: [
                { startTime: { lte: newStartTime } },
                { endTime: { gt: newStartTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: newEndTime } },
                { endTime: { gte: newEndTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: newStartTime } },
                { endTime: { lte: newEndTime } }
              ]
            }
          ]
        }
      });

      if (conflictingAvailability) {
        throw new ConflictException('Time slot conflicts with existing availability');
      }
    }

    const updatedAvailability = await this.prisma.instructorAvailability.update({
      where: { id },
      data: updateDto,
      include: {
        generatedSlots: {
          orderBy: { startTime: 'asc' }
        }
      }
    });

    // Regenerate slots if timing changed
    if (updateDto.startTime || updateDto.endTime || updateDto.defaultSlotDuration || updateDto.bufferMinutes) {
      await this.regenerateSlotsForAvailability(id);
    }

    return updatedAvailability;
  }

  async deleteAvailability(id: string) {
    const availability = await this.prisma.instructorAvailability.findUnique({
      where: { id },
      include: {
        generatedSlots: {
          include: {
            sessions: true,
            bookingRequests: true
          }
        }
      }
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    // Check if there are any active bookings or sessions
    const hasActiveBookings = availability.generatedSlots.some(slot => 
      slot.bookingRequests.length > 0 || slot.sessions.length > 0
    );

    if (hasActiveBookings) {
      throw new BadRequestException('Cannot delete availability with active bookings or sessions');
    }

    // Delete availability (slots will be cascade deleted)
    await this.prisma.instructorAvailability.delete({
      where: { id }
    });

    return { success: true };
  }

  async generateTimeSlots(generateDto: GenerateTimeSlotsDto) {
    const { instructorId, startDate, endDate } = generateDto;

    // Get all availabilities in the date range
    const availabilities = await this.prisma.instructorAvailability.findMany({
      where: {
        instructorId,
        specificDate: {
          gte: startDate,
          lte: endDate
        },
        isActive: true
      }
    });

    const generatedSlots: any[] = [];

    for (const availability of availabilities) {
      const slots = await this.generateSlotsForAvailability(availability.id);
      generatedSlots.push(...slots);
    }

    return generatedSlots;
  }

  async getAvailableTimeSlots(filter: GetAvailableTimeSlotsDto) {
    const { instructorId, date, offeringId } = filter;

    // Get the availability to check advance booking hours
    const availability = await this.prisma.instructorAvailability.findFirst({
      where: {
        instructorId,
        specificDate: date,
        isActive: true
      }
    });

    if (!availability) {
      return [];
    }

    // Calculate the minimum advance booking time
    const minAdvanceHours = availability.minAdvanceHours || 12;
    const minAdvanceTime = new Date();
    minAdvanceTime.setHours(minAdvanceTime.getHours() + minAdvanceHours);

    let where: any = {
      availability: {
        instructorId,
        specificDate: date,
        isActive: true
      },
      isAvailable: true,
      isBooked: false,
      isBlocked: false,
      startTime: {
        gte: minAdvanceTime // Respect advance booking hours
      }
    };

    // If offering is specified, check capacity and duration compatibility
    if (offeringId) {
      const offering = await this.prisma.sessionOffering.findUnique({
        where: { id: offeringId }
      });

      if (offering) {
        where.slotDuration = { gte: offering.duration };
      }
    }

    const timeSlots = await this.prisma.timeSlot.findMany({
      where,
      include: {
        availability: true
      },
      orderBy: { startTime: 'asc' }
    });

    return timeSlots;
  }

  async checkAvailability(checkDto: CheckAvailabilityDto) {
    const { instructorId, date, startTime, endTime } = checkDto;

    // Check for conflicts with existing sessions
    const conflictingSessions = await this.prisma.liveSession.findMany({
      where: {
        instructorId,
        scheduledStart: { lt: endTime },
        scheduledEnd: { gt: startTime },
        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    });

    // Check for conflicts with blocked time slots
    const conflictingSlots = await this.prisma.timeSlot.findMany({
      where: {
        availability: { instructorId },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
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

  async blockTimeSlot(slotId: string, reason?: string) {
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: slotId }
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    if (timeSlot.isBooked) {
      throw new BadRequestException('Cannot block a booked time slot');
    }

    return this.prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        isBlocked: true,
        isAvailable: false
      }
    });
  }

  async unblockTimeSlot(slotId: string) {
    const timeSlot = await this.prisma.timeSlot.findUnique({
      where: { id: slotId }
    });

    if (!timeSlot) {
      throw new NotFoundException('Time slot not found');
    }

    return this.prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        isBlocked: false,
        isAvailable: true
      }
    });
  }

  async getUpcomingAvailability(instructorId: string, days: number = 7) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const availabilities = await this.prisma.instructorAvailability.findMany({
      where: {
        instructorId,
        specificDate: {
          gte: new Date(),
          lte: endDate
        },
        isActive: true
      },
      include: {
        generatedSlots: {
          orderBy: { startTime: 'asc' }
        }
      },
      orderBy: { specificDate: 'asc' }
    });

    // Filter slots based on advance booking hours for each availability
    const now = new Date();
    const filteredAvailabilities = availabilities.map(availability => {
      const minAdvanceHours = availability.minAdvanceHours || 12;
      const minAdvanceTime = new Date();
      minAdvanceTime.setHours(minAdvanceTime.getHours() + minAdvanceHours);

      const availableSlots = availability.generatedSlots.filter(slot => 
        slot.isAvailable && 
        !slot.isBooked && 
        !slot.isBlocked &&
        slot.startTime >= minAdvanceTime
      );

      return {
        ...availability,
        generatedSlots: availableSlots
      };
    });

    return filteredAvailabilities;
  }

  async getAvailabilityStats(instructorId: string) {
    // Get all availabilities for the instructor
    const availabilities = await this.prisma.instructorAvailability.findMany({
      where: { instructorId },
      include: {
        generatedSlots: true
      }
    });

    let totalSlots = 0;
    let availableSlots = 0;
    let bookedSlots = 0;
    let blockedSlots = 0;

    const now = new Date();

    availabilities.forEach(availability => {
      const minAdvanceHours = availability.minAdvanceHours || 12;
      const minAdvanceTime = new Date();
      minAdvanceTime.setHours(minAdvanceTime.getHours() + minAdvanceHours);

      availability.generatedSlots.forEach(slot => {
        totalSlots++;

        if (slot.isBooked) {
          bookedSlots++;
        } else if (slot.isBlocked) {
          blockedSlots++;
        } else if (slot.isAvailable && slot.startTime >= minAdvanceTime) {
          availableSlots++;
        }
      });
    });

    return {
      totalSlots,
      availableSlots,
      bookedSlots,
      blockedSlots,
      utilizationRate: totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0
    };
  }

  private async generateSlotsForAvailability(availabilityId: string) {
    const availability = await this.prisma.instructorAvailability.findUnique({
      where: { id: availabilityId }
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    const slots: any[] = [];
    const { startTime, endTime, defaultSlotDuration, bufferMinutes } = availability;

    // Parse start and end times
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(availability.specificDate);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(availability.specificDate);
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
              date: availability.specificDate,
              dayOfWeek: availability.specificDate.getDay(),
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

  private async regenerateSlotsForAvailability(availabilityId: string) {
    // Delete existing slots
    await this.prisma.timeSlot.deleteMany({
      where: { availabilityId }
    });

    // Generate new slots
    return this.generateSlotsForAvailability(availabilityId);
  }
}