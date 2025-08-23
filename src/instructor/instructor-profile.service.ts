import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateInstructorProfileDto, 
  UpdateInstructorProfileDto 
} from './dto/instructor-profile.dto';
import { SessionStatsDto } from './dto/session-stats.dto';

@Injectable()
export class InstructorProfileService {
  constructor(private prisma: PrismaService) {}

  async getInstructorProfile(userId: string) {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            teachingRating: true,
            totalStudents: true,
            totalCourses: true,
          }
        }
      }
    });

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    return profile;
  }

  async createInstructorProfile(createDto: CreateInstructorProfileDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createDto.userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.instructorProfile.findUnique({
      where: { userId: createDto.userId }
    });

    if (existingProfile) {
      throw new BadRequestException('Instructor profile already exists');
    }

    const profile = await this.prisma.instructorProfile.create({
      data: {
        userId: createDto.userId,
        title: createDto.title,
        bio: createDto.bio,
        shortBio: createDto.shortBio,
        expertise: createDto.expertise || [],
        qualifications: createDto.qualifications || [],
        experience: createDto.experience || 0,
        socialLinks: createDto.socialLinks || {},
        personalWebsite: createDto.personalWebsite,
        linkedinProfile: createDto.linkedinProfile,
        subjectsTeaching: createDto.subjectsTeaching || [],
        teachingCategories: createDto.teachingCategories || [],
        languagesSpoken: createDto.languagesSpoken || [],
        teachingStyle: createDto.teachingStyle,
        targetAudience: createDto.targetAudience,
        teachingMethodology: createDto.teachingMethodology,
        liveSessionsEnabled: createDto.liveSessionsEnabled || false,
        defaultSessionDuration: createDto.defaultSessionDuration || 60,
        defaultSessionType: createDto.defaultSessionType || 'INDIVIDUAL',
        preferredGroupSize: createDto.preferredGroupSize || 5,
        bufferBetweenSessions: createDto.bufferBetweenSessions || 15,
        maxSessionsPerDay: createDto.maxSessionsPerDay || 8,
        minAdvanceBooking: createDto.minAdvanceBooking || 12,
        autoAcceptBookings: createDto.autoAcceptBookings || false,
        instantMeetingEnabled: createDto.instantMeetingEnabled || false,
        individualSessionRate: createDto.individualSessionRate,
        groupSessionRate: createDto.groupSessionRate,
        currency: createDto.currency || 'USD',
        platformFeeRate: createDto.platformFeeRate || 20,
        defaultCancellationPolicy: createDto.defaultCancellationPolicy || 'MODERATE',
        defaultSessionFormat: createDto.defaultSessionFormat || 'ONLINE',
        isAcceptingStudents: createDto.isAcceptingStudents !== false,
        maxStudentsPerCourse: createDto.maxStudentsPerCourse,
        preferredSchedule: createDto.preferredSchedule || {},
        availableTimeSlots: createDto.availableTimeSlots || [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            teachingRating: true,
            totalStudents: true,
            totalCourses: true,
          }
        }
      }
    });

    return profile;
  }

  async updateInstructorProfile(userId: string, updateDto: UpdateInstructorProfileDto) {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    const updatedProfile = await this.prisma.instructorProfile.update({
      where: { userId },
      data: {
        ...updateDto,
        // Handle array fields properly
        expertise: updateDto.expertise !== undefined ? updateDto.expertise : undefined,
        qualifications: updateDto.qualifications !== undefined ? updateDto.qualifications : undefined,
        subjectsTeaching: updateDto.subjectsTeaching !== undefined ? updateDto.subjectsTeaching : undefined,
        teachingCategories: updateDto.teachingCategories !== undefined ? updateDto.teachingCategories : undefined,
        languagesSpoken: updateDto.languagesSpoken !== undefined ? updateDto.languagesSpoken : undefined,
        availableTimeSlots: updateDto.availableTimeSlots !== undefined ? updateDto.availableTimeSlots : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            teachingRating: true,
            totalStudents: true,
            totalCourses: true,
          }
        }
      }
    });

    return updatedProfile;
  }

  async enableLiveSessions(userId: string) {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    const updatedProfile = await this.prisma.instructorProfile.update({
      where: { userId },
      data: {
        liveSessionsEnabled: true,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            teachingRating: true,
            totalStudents: true,
            totalCourses: true,
          }
        }
      }
    });

    return updatedProfile;
  }

  async getInstructorStats(userId: string) {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            instructedSessions: {
              where: { status: 'COMPLETED' }
            }
          }
        }
      }
    });

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    // Calculate stats
    const totalSessions = await this.prisma.liveSession.count({
      where: { 
        instructorId: userId,
        status: 'COMPLETED'
      }
    });

    const totalRevenue = await this.prisma.liveSession.aggregate({
      where: { 
        instructorId: userId,
        status: 'COMPLETED'
      },
      _sum: {
        instructorPayout: true
      }
    });

    const avgRating = await this.prisma.sessionReview.aggregate({
      where: {
        session: {
          instructorId: userId
        }
      },
      _avg: {
        overallRating: true
      }
    });

    const stats = {
      totalSessions,
      totalRevenue: totalRevenue._sum.instructorPayout || 0,
      averageRating: avgRating._avg.overallRating || 0
    };

    return {
      ...profile,
      ...stats
    };
  }

  async updateProfileStats(userId: string) {
    // Get current stats
    const stats = await this.getInstructorStats(userId);
    
    // Update the profile with calculated stats
    await this.prisma.instructorProfile.update({
      where: { userId },
      data: {
        totalLiveSessions: stats.totalSessions,
        totalRevenue: stats.totalRevenue,
        averageSessionRating: stats.averageRating,
      }
    });

    // Also update user table
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        teachingRating: stats.averageRating,
      }
    });
  }

  async getSessionStats(instructorId: string): Promise<SessionStatsDto> {
    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId }
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Get all sessions for this instructor
    const sessions = await this.prisma.liveSession.findMany({
      where: { instructorId },
      include: {
        participants: true,
        reviews: true,
        payments: true,
        reservations: true,
      }
    });

    // Get booking requests
    const bookingRequests = await this.prisma.bookingRequest.findMany({
      where: {
        offering: {
          instructorId
        }
      }
    });

    // Get payouts
    const payouts = await this.prisma.instructorPayout.findMany({
      where: { instructorId }
    });

    // Calculate statistics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED').length;
    const cancelledSessions = sessions.filter(s => s.status === 'CANCELLED').length;
    const upcomingSessions = sessions.filter(s => 
      s.status === 'SCHEDULED' && s.scheduledStart > new Date()
    ).length;

    const pendingRequests = bookingRequests.filter(b => b.status === 'PENDING').length;

    // Calculate total earnings
    const totalEarnings = sessions
      .filter(s => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + (s.totalRevenue || 0), 0);

    // Calculate completion rate
    const completionRate = totalSessions > 0 
      ? (completedSessions / totalSessions) * 100 
      : 0;

    // Calculate average bid (from booking requests)
    const averageBid = bookingRequests.length > 0
      ? bookingRequests.reduce((sum, b) => sum + (b.offeredPrice || 0), 0) / bookingRequests.length
      : 0;

    // Calculate average rating
    const allRatings = sessions
      .flatMap(s => s.reviews)
      .map(r => r.overallRating)
      .filter(r => r > 0);
    
    const averageRating = allRatings.length > 0
      ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
      : 0;

    // Get unique learners/students
    const uniqueLearners = new Set(
      sessions.flatMap(s => s.participants.map(p => p.userId))
    );
    const totalLearners = uniqueLearners.size;

    // Get total students (from reservations)
    const totalStudents = sessions
      .flatMap(s => s.reservations)
      .length;

    // Calculate payouts
    const totalPayouts = payouts.filter(p => p.status === 'PAID').length;
    const pendingPayouts = payouts.filter(p => p.status === 'PENDING').length;

    // Get popular time slots (simplified - you can enhance this)
    const popularTimeSlots = this.getPopularTimeSlots(sessions);

    return {
      pendingRequests,
      totalEarnings,
      upcomingSessions,
      completionRate,
      averageBid,
      popularTimeSlots,
      totalSessions,
      completedSessions,
      cancelledSessions,
      averageRating,
      totalLearners,
      totalStudents,
      totalPayouts,
      pendingPayouts,
    };
  }

  private getPopularTimeSlots(sessions: any[]): string[] {
    // Group sessions by hour and find most popular times
    const timeSlots: { [key: string]: number } = {};
    
    sessions.forEach(session => {
      const hour = new Date(session.scheduledStart).getHours();
      const timeSlot = `${hour}:00`;
      timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
    });

    // Return top 3 most popular time slots
    return Object.entries(timeSlots)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([time]) => time);
  }

  async searchInstructors(query: {
    search?: string;
    subjects?: string[];
    categories?: string[];
    minRating?: number;
    maxPrice?: number;
    availability?: boolean;
    page?: number;
    limit?: number;
  }) {
    const {
      search,
      subjects,
      categories,
      minRating,
      maxPrice,
      availability,
      page = 1,
      limit = 10
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      liveSessionsEnabled: true,
      isAcceptingStudents: true,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
        { subjectsTeaching: { hasSome: [search] } },
        { expertise: { hasSome: [search] } },
        { user: { 
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    if (subjects && subjects.length > 0) {
      where.subjectsTeaching = { hasSome: subjects };
    }

    if (categories && categories.length > 0) {
      where.teachingCategories = { hasSome: categories };
    }

    if (minRating) {
      where.averageSessionRating = { gte: minRating };
    }

    if (maxPrice) {
      where.individualSessionRate = { lte: maxPrice };
    }

    if (availability) {
      where.availabilities = {
        some: {
          isActive: true,
          specificDate: { gte: new Date() }
        }
      };
    }

    const [profiles, total] = await Promise.all([
      this.prisma.instructorProfile.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
              teachingRating: true,
              totalStudents: true,
              totalCourses: true,
            }
          }
        },
        orderBy: [
          { averageSessionRating: 'desc' },
          { totalLiveSessions: 'desc' }
        ]
      }),
      this.prisma.instructorProfile.count({ where })
    ]);

    return {
      profiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }
}
