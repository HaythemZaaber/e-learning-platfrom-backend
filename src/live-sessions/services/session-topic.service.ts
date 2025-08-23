import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateSessionTopicDto, 
  UpdateSessionTopicDto,
  GetSessionTopicsFilterDto
} from '../dto/session-topic.dto';

@Injectable()
export class SessionTopicService {
  constructor(private prisma: PrismaService) {}

  async getSessionTopics(filter: GetSessionTopicsFilterDto) {
    const { instructorId, category, difficulty, isActive, isApproved } = filter;

    const where: any = { instructorId };

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isApproved !== undefined) {
      where.isApproved = isApproved;
    }

    const topics = await this.prisma.sessionTopic.findMany({
      where,
      include: {
        sessions: {
          select: {
            id: true,
            status: true,
            scheduledStart: true
          }
        },
        offerings: {
          select: {
            id: true,
            title: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { totalSessions: 'desc' },
        { averageRating: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return topics;
  }

  async getSessionTopic(id: string) {
    const topic = await this.prisma.sessionTopic.findUnique({
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
        sessions: {
          select: {
            id: true,
            title: true,
            status: true,
            scheduledStart: true,
            scheduledEnd: true
          },
          orderBy: { scheduledStart: 'desc' }
        },
        offerings: {
          select: {
            id: true,
            title: true,
            isActive: true,
            basePrice: true
          }
        }
      }
    });

    if (!topic) {
      throw new NotFoundException('Session topic not found');
    }

    return topic;
  }

  async createSessionTopic(createDto: CreateSessionTopicDto) {
    // Validate instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: createDto.instructorId }
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Check for duplicate topic name for this instructor
    const existingTopic = await this.prisma.sessionTopic.findFirst({
      where: {
        instructorId: createDto.instructorId,
        name: { equals: createDto.name, mode: 'insensitive' }
      }
    });

    if (existingTopic) {
      throw new BadRequestException('Topic with this name already exists');
    }

    const topic = await this.prisma.sessionTopic.create({
      data: {
        instructorId: createDto.instructorId,
        name: createDto.name,
        description: createDto.description,
        category: createDto.category,
        difficulty: createDto.difficulty || 'BEGINNER',
        isCustom: createDto.isCustom || false,
        isActive: createDto.isActive !== false,
        isApproved: createDto.isApproved !== false,
        suggestedDuration: createDto.suggestedDuration,
        suggestedFormat: createDto.suggestedFormat,
        prerequisites: createDto.prerequisites || [],
        materials: createDto.materials || [],
        totalSessions: 0,
        averageRating: 0
      },
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
    });

    return topic;
  }

  async updateSessionTopic(id: string, updateDto: UpdateSessionTopicDto) {
    const topic = await this.prisma.sessionTopic.findUnique({
      where: { id }
    });

    if (!topic) {
      throw new NotFoundException('Session topic not found');
    }

    // Check for duplicate name if name is being updated
    if (updateDto.name && updateDto.name !== topic.name) {
      const existingTopic = await this.prisma.sessionTopic.findFirst({
        where: {
          id: { not: id },
          instructorId: topic.instructorId,
          name: { equals: updateDto.name, mode: 'insensitive' }
        }
      });

      if (existingTopic) {
        throw new BadRequestException('Topic with this name already exists');
      }
    }

    const updatedTopic = await this.prisma.sessionTopic.update({
      where: { id },
      data: {
        ...updateDto,
        prerequisites: updateDto.prerequisites !== undefined ? updateDto.prerequisites : undefined,
        materials: updateDto.materials !== undefined ? updateDto.materials : undefined,
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
        sessions: {
          select: {
            id: true,
            status: true,
            scheduledStart: true
          }
        },
        offerings: {
          select: {
            id: true,
            title: true,
            isActive: true
          }
        }
      }
    });

    return updatedTopic;
  }

  async deleteSessionTopic(id: string) {
    const topic = await this.prisma.sessionTopic.findUnique({
      where: { id },
      include: {
        sessions: {
          where: {
            status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] }
          }
        },
        offerings: {
          where: { isActive: true }
        }
      }
    });

    if (!topic) {
      throw new NotFoundException('Session topic not found');
    }

    // Check if topic is being used in active sessions or offerings
    if (topic.sessions.length > 0) {
      throw new BadRequestException('Cannot delete topic with active sessions');
    }

    if (topic.offerings.length > 0) {
      throw new BadRequestException('Cannot delete topic with active offerings');
    }

    await this.prisma.sessionTopic.delete({
      where: { id }
    });

    return { success: true };
  }

  async toggleTopicActive(id: string) {
    const topic = await this.prisma.sessionTopic.findUnique({
      where: { id }
    });

    if (!topic) {
      throw new NotFoundException('Session topic not found');
    }

    const updatedTopic = await this.prisma.sessionTopic.update({
      where: { id },
      data: { isActive: !topic.isActive },
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
    });

    return updatedTopic;
  }

  async approveTopic(id: string, approvedBy: string) {
    const topic = await this.prisma.sessionTopic.findUnique({
      where: { id }
    });

    if (!topic) {
      throw new NotFoundException('Session topic not found');
    }

    const updatedTopic = await this.prisma.sessionTopic.update({
      where: { id },
      data: { 
        isApproved: true,
        // You might want to add an approvedBy field to track who approved it
      },
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
    });

    return updatedTopic;
  }

  async getTopicStatistics(id: string) {
    const topic = await this.prisma.sessionTopic.findUnique({
      where: { id },
      include: {
        sessions: {
          include: {
            reviews: true
          }
        }
      }
    });

    if (!topic) {
      throw new NotFoundException('Session topic not found');
    }

    const completedSessions = topic.sessions.filter(s => s.status === 'COMPLETED');
    const totalRevenue = completedSessions.reduce((sum, session) => sum + session.instructorPayout, 0);
    
    const allReviews = topic.sessions.flatMap(s => s.reviews);
    const averageRating = allReviews.length > 0 
      ? allReviews.reduce((sum, review) => sum + review.overallRating, 0) / allReviews.length 
      : 0;

    const stats = {
      totalSessions: topic.sessions.length,
      completedSessions: completedSessions.length,
      totalRevenue,
      averageRating: Math.round(averageRating * 100) / 100,
      totalReviews: allReviews.length,
      upcomingSessions: topic.sessions.filter(s => 
        s.status === 'SCHEDULED' && new Date(s.scheduledStart) > new Date()
      ).length
    };

    // Update the topic with calculated stats
    await this.prisma.sessionTopic.update({
      where: { id },
      data: {
        totalSessions: stats.totalSessions,
        averageRating: stats.averageRating
      }
    });

    return { ...topic, stats };
  }

  async searchTopics(query: {
    search?: string;
    instructorId?: string;
    category?: string;
    difficulty?: string;
    isActive?: boolean;
    minRating?: number;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      instructorId,
      category,
      difficulty,
      isActive,
      minRating,
      page = 1,
      limit = 10
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      isApproved: true
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (category) {
      where.category = { contains: category, mode: 'insensitive' };
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (minRating) {
      where.averageRating = { gte: minRating };
    }

    const [topics, total] = await Promise.all([
      this.prisma.sessionTopic.findMany({
        where,
        skip,
        take: limit,
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true
            }
          }
        },
        orderBy: [
          { isActive: 'desc' },
          { averageRating: 'desc' },
          { totalSessions: 'desc' }
        ]
      }),
      this.prisma.sessionTopic.count({ where })
    ]);

    return {
      topics,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getPopularTopics(instructorId?: string, limit: number = 10) {
    const where: any = {
      isActive: true,
      isApproved: true
    };

    if (instructorId) {
      where.instructorId = instructorId;
    }

    return this.prisma.sessionTopic.findMany({
      where,
      take: limit,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      },
      orderBy: [
        { totalSessions: 'desc' },
        { averageRating: 'desc' }
      ]
    });
  }

  async getTopicsByCategory(instructorId?: string) {
    const where: any = {
      isActive: true,
      isApproved: true
    };

    if (instructorId) {
      where.instructorId = instructorId;
    }

    const topics = await this.prisma.sessionTopic.findMany({
      where,
      select: {
        category: true,
        totalSessions: true,
        averageRating: true
      }
    });

    // Group by category
    const categorized = topics.reduce((acc, topic) => {
      const category = topic.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalSessions: 0,
          averageRating: 0
        };
      }
      acc[category].count++;
      acc[category].totalSessions += topic.totalSessions;
      acc[category].averageRating += topic.averageRating;
      return acc;
    }, {});

    // Calculate averages
    Object.keys(categorized).forEach(category => {
      categorized[category].averageRating = 
        categorized[category].averageRating / categorized[category].count;
      categorized[category].averageRating = 
        Math.round(categorized[category].averageRating * 100) / 100;
    });

    return categorized;
  }
}