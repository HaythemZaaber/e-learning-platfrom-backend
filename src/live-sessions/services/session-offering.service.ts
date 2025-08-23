import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateSessionOfferingDto, 
  UpdateSessionOfferingDto,
  SessionOfferingFilterDto
} from '../dto/session-offering.dto';
import { SessionType } from '../dto/common.dto';

@Injectable()
export class SessionOfferingService {
  constructor(private prisma: PrismaService) {}

  async getSessionOfferings(filter: SessionOfferingFilterDto = {}) {
    const {
      instructorId,
      isActive,
      sessionType,
      topicType,
      category,
      search,
      domain,
      isPublic,
      minPrice,
      maxPrice
    } = filter;

    const where: any = {};

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (sessionType) {
      where.sessionType = sessionType;
    }

    if (topicType) {
      where.topicType = topicType;
    }

    if (domain) {
      where.domain = { contains: domain, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fixedTopic: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    const offerings = await this.prisma.sessionOffering.findMany({
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
        topic: {
          select: {
            id: true,
            name: true,
            difficulty: true,
            category: true
          }
        },
        liveSessions: {
          where: { status: 'COMPLETED' },
          select: {
            id: true,
            reviews: {
              select: {
                overallRating: true
              }
            }
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { averageRating: 'desc' },
        { totalBookings: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return offerings;
  }

  async getSessionOffering(id: string) {
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            teachingRating: true,
            totalStudents: true,
            experience: true,
            expertise: true
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
        bookingRequests: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED'] }
          },
          select: {
            id: true,
            status: true,
            studentId: true,
            preferredDate: true
          }
        },
        liveSessions: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true,
            currentParticipants: true,
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
            }
          },
          orderBy: { scheduledStart: 'desc' }
        }
      }
    });

    if (!offering) {
      throw new NotFoundException('Session offering not found');
    }

    return offering;
  }

  async createSessionOffering(createDto: CreateSessionOfferingDto) {
    // Validate instructor exists and has live sessions enabled
    const instructor = await this.prisma.user.findUnique({
      where: { id: createDto.instructorId },
      include: {
        instructorProfile: true
      }
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    if (!instructor.instructorProfile?.liveSessionsEnabled) {
      throw new BadRequestException('Instructor does not have live sessions enabled');
    }

    // Validate topic exists if topicId is provided
    if (createDto.topicId) {
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

    // Validate required fields based on topic type
    if (createDto.topicType === 'FIXED' && !createDto.fixedTopic && !createDto.topicId) {
      throw new BadRequestException('Fixed topic or topic ID is required for FIXED topic type');
    }

    if (createDto.topicType === 'FLEXIBLE' && !createDto.domain) {
      throw new BadRequestException('Domain is required for FLEXIBLE topic type');
    }

    const offering = await this.prisma.sessionOffering.create({
      data: {
        instructorId: createDto.instructorId,
        title: createDto.title,
        description: createDto.description,
        shortDescription: createDto.shortDescription,
        topicType: createDto.topicType,
        topicId: createDto.topicId,
        fixedTopic: createDto.fixedTopic,
        domain: createDto.domain,
        tags: createDto.tags || [],
        sessionType: createDto.sessionType,
        sessionFormat: createDto.sessionFormat,
        duration: createDto.duration,
        capacity: createDto.capacity,
        minParticipants: createDto.minParticipants,
        basePrice: createDto.basePrice,
        currency: createDto.currency,
        cancellationPolicy: createDto.cancellationPolicy,
        isActive: createDto.isActive,
        isPublic: createDto.isPublic,
        requiresApproval: createDto.requiresApproval,
        materials: createDto.materials || [],
        prerequisites: createDto.prerequisites || [],
        equipment: createDto.equipment || [],
        recordingEnabled: createDto.recordingEnabled,
        whiteboardEnabled: createDto.whiteboardEnabled,
        screenShareEnabled: createDto.screenShareEnabled,
        chatEnabled: createDto.chatEnabled,
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0
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
        topic: {
          select: {
            id: true,
            name: true,
            difficulty: true,
            category: true
          }
        }
      }
    });

    return offering;
  }

  async updateSessionOffering(id: string, updateDto: UpdateSessionOfferingDto) {
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id }
    });

    if (!offering) {
      throw new NotFoundException('Session offering not found');
    }

    // Validate topic exists if topicId is being updated
    if (updateDto.topicId) {
      const topic = await this.prisma.sessionTopic.findUnique({
        where: { id: updateDto.topicId }
      });

      if (!topic) {
        throw new NotFoundException('Session topic not found');
      }

      if (topic.instructorId !== offering.instructorId) {
        throw new BadRequestException('Topic does not belong to this instructor');
      }
    }

    // Validate required fields based on topic type
    const newTopicType = updateDto.topicType || offering.topicType;
    if (newTopicType === 'FIXED') {
      const newFixedTopic = updateDto.fixedTopic || offering.fixedTopic;
      const newTopicId = updateDto.topicId || offering.topicId;
      if (!newFixedTopic && !newTopicId) {
        throw new BadRequestException('Fixed topic or topic ID is required for FIXED topic type');
      }
    }

    if (newTopicType === 'FLEXIBLE') {
      const newDomain = updateDto.domain || offering.domain;
      if (!newDomain) {
        throw new BadRequestException('Domain is required for FLEXIBLE topic type');
      }
    }

    const updatedOffering = await this.prisma.sessionOffering.update({
      where: { id },
      data: {
        ...updateDto,
        tags: updateDto.tags !== undefined ? updateDto.tags : undefined,
        materials: updateDto.materials !== undefined ? updateDto.materials : undefined,
        prerequisites: updateDto.prerequisites !== undefined ? updateDto.prerequisites : undefined,
        equipment: updateDto.equipment !== undefined ? updateDto.equipment : undefined,
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
        topic: {
          select: {
            id: true,
            name: true,
            difficulty: true,
            category: true
          }
        }
      }
    });

    return updatedOffering;
  }

  async deleteSessionOffering(id: string) {
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id },
      include: {
        bookingRequests: {
          where: {
            status: { in: ['PENDING', 'ACCEPTED'] }
          }
        },
        liveSessions: {
          where: {
            status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
          }
        }
      }
    });

    if (!offering) {
      throw new NotFoundException('Session offering not found');
    }

    // Check if there are active bookings or sessions
    if (offering.bookingRequests.length > 0) {
      throw new BadRequestException('Cannot delete offering with active booking requests');
    }

    if (offering.liveSessions.length > 0) {
      throw new BadRequestException('Cannot delete offering with active sessions');
    }

    await this.prisma.sessionOffering.delete({
      where: { id }
    });

    return { success: true };
  }

  async toggleOfferingActive(id: string) {
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id }
    });

    if (!offering) {
      throw new NotFoundException('Session offering not found');
    }

    const updatedOffering = await this.prisma.sessionOffering.update({
      where: { id },
      data: { isActive: !offering.isActive },
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
    });

    return updatedOffering;
  }

  async getOfferingStatistics(id: string) {
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id },
      include: {
        bookingRequests: true,
        liveSessions: {
          include: {
            reviews: true,
            participants: true
          }
        }
      }
    });

    if (!offering) {
      throw new NotFoundException('Session offering not found');
    }

    const completedSessions = offering.liveSessions.filter(s => s.status === 'COMPLETED');
    const totalRevenue = completedSessions.reduce((sum, session) => sum + session.instructorPayout, 0);
    
    const allReviews = offering.liveSessions.flatMap(s => s.reviews);
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.overallRating, 0) / allReviews.length 
      : 0;

    const totalParticipants = offering.liveSessions.reduce((sum, session) => 
      sum + session.participants.length, 0
    );

    const stats = {
      totalBookings: offering.bookingRequests.length,
      totalSessions: offering.liveSessions.length,
      completedSessions: completedSessions.length,
      totalRevenue,
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: allReviews.length,
      totalParticipants,
      conversionRate: offering.bookingRequests.length > 0 
        ? (completedSessions.length / offering.bookingRequests.length) * 100 
        : 0,
      upcomingSessions: offering.liveSessions.filter(s => 
        s.status === 'SCHEDULED' && new Date(s.scheduledStart) > new Date()
      ).length
    };

    // Update the offering with calculated stats
    await this.prisma.sessionOffering.update({
      where: { id },
      data: {
        totalBookings: stats.totalBookings,
        totalRevenue: stats.totalRevenue,
        averageRating: stats.averageRating
      }
    });

    return { ...offering, stats };
  }

  async searchOfferings(query: {
    search?: string;
    instructorId?: string;
    sessionType?: string;
    topicType?: string;
    domain?: string;
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    isPublic?: boolean;
    minRating?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      instructorId,
      sessionType,
      topicType,
      domain,
      minPrice,
      maxPrice,
      isActive,
      isPublic,
      minRating,
      page = 1,
      limit = 10
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { fixedTopic: { contains: search, mode: 'insensitive' } },
        { domain: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } }
      ];
    }

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (sessionType) {
      where.sessionType = sessionType;
    }

    if (topicType) {
      where.topicType = topicType;
    }

    if (domain) {
      where.domain = { contains: domain, mode: 'insensitive' };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.basePrice = {};
      if (minPrice !== undefined) where.basePrice.gte = minPrice;
      if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
    }

    if (minRating) {
      where.averageRating = { gte: minRating };
    }

    const [offerings, total] = await Promise.all([
      this.prisma.sessionOffering.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: [
          { isActive: 'desc' },
          { averageRating: 'desc' },
          { totalBookings: 'desc' }
        ]
      }),
      this.prisma.sessionOffering.count({ where })
    ]);

    return {
      offerings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPopularOfferings(limit: number = 10) {
    return this.prisma.sessionOffering.findMany({
      where: {
        isActive: true,
        isPublic: true
      },
      take: limit,
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
      },
      orderBy: [
        { totalBookings: 'desc' },
        { averageRating: 'desc' }
      ]
    });
  }

  async getOfferingsByInstructor(instructorId: string, includeInactive: boolean = false) {
    const where: any = { instructorId };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.prisma.sessionOffering.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            difficulty: true,
            category: true
          }
        },
        liveSessions: {
          where: { status: 'COMPLETED' },
          select: { id: true }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { totalBookings: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }

  async duplicateOffering(id: string, title?: string) {
    const originalOffering = await this.prisma.sessionOffering.findUnique({
      where: { id }
    });

    if (!originalOffering) {
      throw new NotFoundException('Session offering not found');
    }

    const duplicateData = {
      ...originalOffering,
      id: undefined,
      title: title || `${originalOffering.title} (Copy)`,
      totalBookings: 0,
      totalRevenue: 0,
      averageRating: 0,
      createdAt: undefined,
      updatedAt: undefined,
      isActive: false // Start as inactive for review
    };

    const duplicatedOffering = await this.prisma.sessionOffering.create({
      data: duplicateData,
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
    });

    return duplicatedOffering;
  }

  async getOfferingAvailability(id: string, days: number = 30) {
    const offering = await this.prisma.sessionOffering.findUnique({
      where: { id },
      select: { duration: true }
    });

    if (!offering) {
      throw new NotFoundException('Session offering not found');
    }

    const fullOffering = await this.prisma.sessionOffering.findUnique({
      where: { id },
      include: {
        instructor: {
          include: {
            availabilities: {
              where: {
                isActive: true,
                specificDate: {
                  gte: new Date(),
                  lte: new Date(Date.now() + days * 24 * 60 * 60 * 1000)
                }
              },
              include: {
                generatedSlots: {
                  where: {
                    isAvailable: true,
                    isBooked: false,
                    isBlocked: false,
                    slotDuration: { gte: offering.duration || 60 }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!fullOffering) {
      throw new NotFoundException('Session offering not found');
    }

    const availableSlots = fullOffering.instructor.availabilities
      .flatMap(availability => availability.generatedSlots)
      .filter(slot => new Date(slot.startTime) > new Date());

    return {
      offering: fullOffering,
      availableSlots: availableSlots.length,
      nextAvailableSlot: availableSlots[0] || null,
      availabilityByDate: availableSlots.reduce((acc, slot) => {
        const date = slot.date.toISOString().split('T')[0];
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
        return acc;
      }, {} as Record<string, any[]>)
    };
  }
}