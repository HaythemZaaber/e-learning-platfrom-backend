import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInstructorProfileDto,
  UpdateInstructorProfileDto,
} from './dto/instructor-profile.dto';
import { SessionStatsDto } from './dto/session-stats.dto';
import { SessionType, SessionFormat, CancellationPolicy } from '@prisma/client';

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
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    return profile;
  }

  async createInstructorProfile(createDto: CreateInstructorProfileDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createDto.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if profile already exists
    const existingProfile = await this.prisma.instructorProfile.findUnique({
      where: { userId: createDto.userId },
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
        defaultSessionType:
          (createDto.defaultSessionType as SessionType) ||
          SessionType.INDIVIDUAL,
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
        defaultCancellationPolicy:
          (createDto.defaultCancellationPolicy as CancellationPolicy) ||
          CancellationPolicy.MODERATE,
        defaultSessionFormat:
          (createDto.defaultSessionFormat as SessionFormat) ||
          SessionFormat.ONLINE,
        isAcceptingStudents: createDto.isAcceptingStudents !== false,
        maxStudentsPerCourse: createDto.maxStudentsPerCourse,
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
          },
        },
      },
    });

    return profile;
  }

  async updateInstructorProfile(
    userId: string,
    updateDto: UpdateInstructorProfileDto,
  ) {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    // Prepare update data with proper type handling
    const updateData: any = { ...updateDto };

    // Handle enum fields properly
    if (updateDto.defaultSessionType) {
      updateData.defaultSessionType =
        updateDto.defaultSessionType as SessionType;
    }
    if (updateDto.defaultCancellationPolicy) {
      updateData.defaultCancellationPolicy =
        updateDto.defaultCancellationPolicy as CancellationPolicy;
    }
    if (updateDto.defaultSessionFormat) {
      updateData.defaultSessionFormat =
        updateDto.defaultSessionFormat as SessionFormat;
    }

    // Handle array fields properly
    if (updateDto.expertise !== undefined) {
      updateData.expertise = updateDto.expertise;
    }
    if (updateDto.qualifications !== undefined) {
      updateData.qualifications = updateDto.qualifications;
    }
    if (updateDto.subjectsTeaching !== undefined) {
      updateData.subjectsTeaching = updateDto.subjectsTeaching;
    }
    if (updateDto.teachingCategories !== undefined) {
      updateData.teachingCategories = updateDto.teachingCategories;
    }
    if (updateDto.languagesSpoken !== undefined) {
      updateData.languagesSpoken = updateDto.languagesSpoken;
    }

    const updatedProfile = await this.prisma.instructorProfile.update({
      where: { userId },
      data: updateData,
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
          },
        },
      },
    });

    return updatedProfile;
  }

  async enableLiveSessions(userId: string) {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId },
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
          },
        },
      },
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
              where: { status: 'COMPLETED' },
            },
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    // Calculate course statistics
    const courseStats = await this.prisma.course.findMany({
      where: { instructorId: userId },
      select: {
        id: true,
        status: true,
        currentEnrollments: true,
        price: true,
        avgRating: true,
        totalRatings: true,
        enrollments: {
          select: {
            id: true,
            status: true,
            userId: true,
          },
        },
      },
    });

    // Calculate live session stats
    const totalSessions = await this.prisma.liveSession.count({
      where: {
        instructorId: userId,
        status: 'COMPLETED',
      },
    });

    const totalRevenue = await this.prisma.liveSession.aggregate({
      where: {
        instructorId: userId,
        status: 'COMPLETED',
      },
      _sum: {
        instructorPayout: true,
      },
    });

    // Calculate instructor rating stats
    const instructorRatings = await this.prisma.instructorRating.findMany({
      where: {
        instructorId: userId,
        isPublic: true,
      },
      select: {
        rating: true,
      },
    });

    const totalInstructorRatings = instructorRatings.length;
    const averageInstructorRating =
      instructorRatings.length > 0
        ? instructorRatings.reduce((sum, r) => sum + r.rating, 0) /
          instructorRatings.length
        : 0;

    // Use instructor rating as the primary average rating
    const avgRating = { _avg: { overallRating: averageInstructorRating } };

    // Calculate course-based statistics
    const totalCourses = courseStats.length;
    const publishedCourses = courseStats.filter(
      (c) => c.status === 'PUBLISHED',
    ).length;

    // Calculate total unique students across all courses
    const allEnrollments = courseStats.flatMap((c) => c.enrollments);
    const uniqueStudents = new Set(allEnrollments.map((e) => e.userId)).size;

    // Calculate total enrollments (including duplicates)
    const totalEnrollments = allEnrollments.length;

    // Calculate course revenue using actual enrollments instead of cached field
    const courseRevenue = courseStats.reduce((sum, course) => {
      const actualEnrollments = course.enrollments.length;
      return sum + course.price * actualEnrollments;
    }, 0);

    // Calculate average course rating
    const coursesWithRatings = courseStats.filter((c) => c.totalRatings > 0);
    const averageCourseRating =
      coursesWithRatings.length > 0
        ? coursesWithRatings.reduce((sum, c) => sum + (c.avgRating || 0), 0) /
          coursesWithRatings.length
        : 0;

    const stats = {
      // Live session stats
      totalSessions,
      totalRevenue: totalRevenue._sum.instructorPayout || 0,
      averageRating: avgRating._avg.overallRating || 0,

      // Course stats
      totalCourses,
      publishedCourses,
      totalStudents: uniqueStudents, // Unique students across all courses
      totalEnrollments, // Total enrollments (may include same student in multiple courses)
      courseRevenue,
      averageCourseRating,

      // Instructor rating stats
      totalInstructorRatings,
      averageInstructorRating: Math.round(averageInstructorRating * 100) / 100,

      // Combined stats
      totalRevenueCombined:
        (totalRevenue._sum.instructorPayout || 0) + courseRevenue,
    };

    return {
      ...profile,
      ...stats,
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
        totalRevenue: stats.totalRevenueCombined, // Use combined revenue
        averageSessionRating: stats.averageRating,
        totalCourses: stats.totalCourses,
        totalStudents: stats.totalStudents,
        averageCourseRating: stats.averageCourseRating,
      },
    });

    // Also update user table
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        teachingRating: stats.averageRating,
        totalStudents: stats.totalStudents,
        totalCourses: stats.totalCourses,
      },
    });

    // Update course enrollment counts to keep them in sync
    await this.updateCourseEnrollmentCounts(userId);
  }

  async updateCourseEnrollmentCounts(instructorId: string) {
    // Get all courses for this instructor
    const courses = await this.prisma.course.findMany({
      where: { instructorId },
      select: {
        id: true,
        enrollments: {
          select: {
            id: true,
          },
        },
      },
    });

    // Update currentEnrollments for each course
    for (const course of courses) {
      const actualEnrollments = course.enrollments.length;

      await this.prisma.course.update({
        where: { id: course.id },
        data: { currentEnrollments: actualEnrollments },
      });
    }
  }

  async getSessionStats(instructorId: string): Promise<SessionStatsDto> {
    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
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
      },
    });

    // Get booking requests
    const bookingRequests = await this.prisma.bookingRequest.findMany({
      where: {
        offering: {
          instructorId,
        },
      },
    });

    // Get payouts
    const payouts = await this.prisma.instructorPayout.findMany({
      where: { instructorId },
    });

    // Calculate statistics
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(
      (s) => s.status === 'COMPLETED',
    ).length;
    const cancelledSessions = sessions.filter(
      (s) => s.status === 'CANCELLED',
    ).length;
    const upcomingSessions = sessions.filter(
      (s) => s.status === 'SCHEDULED' && s.scheduledStart > new Date(),
    ).length;

    const pendingRequests = bookingRequests.filter(
      (b) => b.status === 'PENDING',
    ).length;

    // Calculate total earnings
    const totalEarnings = sessions
      .filter((s) => s.status === 'COMPLETED')
      .reduce((sum, s) => sum + (s.totalRevenue || 0), 0);

    // Calculate completion rate
    const completionRate =
      totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;

    // Calculate average bid (from booking requests)
    const averageBid =
      bookingRequests.length > 0
        ? bookingRequests.reduce((sum, b) => sum + (b.offeredPrice || 0), 0) /
          bookingRequests.length
        : 0;

    // Calculate average rating
    const allRatings = sessions
      .flatMap((s) => s.reviews)
      .map((r) => r.overallRating)
      .filter((r) => r > 0);

    const averageRating =
      allRatings.length > 0
        ? allRatings.reduce((sum, r) => sum + r, 0) / allRatings.length
        : 0;

    // Get unique learners/students
    const uniqueLearners = new Set(
      sessions.flatMap((s) => s.participants.map((p) => p.userId)),
    );
    const totalLearners = uniqueLearners.size;

    // Get total students (from reservations)
    const totalStudents = sessions.flatMap((s) => s.reservations).length;

    // Calculate payouts
    const totalPayouts = payouts.filter((p) => p.status === 'PAID').length;
    const pendingPayouts = payouts.filter((p) => p.status === 'PENDING').length;

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

    sessions.forEach((session) => {
      const hour = new Date(session.scheduledStart).getHours();
      const timeSlot = `${hour}:00`;
      timeSlots[timeSlot] = (timeSlots[timeSlot] || 0) + 1;
    });

    // Return top 3 most popular time slots
    return Object.entries(timeSlots)
      .sort(([, a], [, b]) => b - a)
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
      limit = 10,
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
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
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
          specificDate: { gte: new Date() },
        },
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
            },
          },
        },
        orderBy: [
          { averageSessionRating: 'desc' },
          { totalLiveSessions: 'desc' },
        ],
      }),
      this.prisma.instructorProfile.count({ where }),
    ]);

    return {
      profiles,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInstructorDetails(instructorId: string) {
    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Get comprehensive instructor details
    const [profile, stats, courses, reviews, availability] = await Promise.all([
      this.getInstructorProfile(instructorId),
      this.getInstructorStats(instructorId),
      this.getInstructorCourses(instructorId, { page: 1, limit: 5 }),
      this.getInstructorReviews(instructorId, { page: 1, limit: 5 }),
      this.getInstructorAvailability(instructorId, {}),
    ]);

    return {
      instructor: {
        id: instructor.id,
        firstName: instructor.firstName,
        lastName: instructor.lastName,
        email: instructor.email,
        profileImage: instructor.profileImage,
        teachingRating: instructor.teachingRating,
        totalStudents: stats.totalStudents || 0, // Use calculated stats
        totalCourses: stats.totalCourses || 0, // Use calculated stats
        expertise: instructor.expertise,
        qualifications: instructor.qualifications,
        experience: instructor.experience,
        bio: instructor.instructorBio,
      },
      profile,
      stats,
      recentCourses: courses.courses,
      recentReviews: reviews.reviews,
      availability,
      summary: {
        totalCourses: stats.totalCourses || 0,
        publishedCourses: stats.publishedCourses || 0,
        totalReviews: reviews.total,
        averageRating: reviews.stats.averageOverallRating || 0,
        totalStudents: stats.totalStudents || 0,
        totalEnrollments: stats.totalEnrollments || 0,
        totalSessions: stats.totalSessions || 0,
        totalRevenue: stats.totalRevenueCombined || 0,
        courseRevenue: stats.courseRevenue || 0,
        sessionRevenue: stats.totalRevenue || 0,
      },
    };
  }

  async getInstructorCourses(
    instructorId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
    },
  ) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const where: any = {
      instructorId,
      // Remove isPublic filter to show all courses for the instructor
      // isPublic: true, // Commented out to show all courses
    };

    if (status) {
      where.status = status;
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          shortDescription: true,
          category: true,
          subcategory: true,
          level: true,
          status: true,
          isPublic: true,
          price: true,
          currency: true,
          thumbnail: true,
          avgRating: true,
          totalRatings: true,
          views: true,
          currentEnrollments: true,
          createdAt: true,
          updatedAt: true,
          publishedAt: true,
          sections: {
            include: {
              lectures: {
                select: {
                  id: true,
                  title: true,
                  duration: true,
                  isPreview: true,
                },
              },
            },
          },
          enrollments: {
            select: {
              id: true,
              status: true,
            },
          },
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.course.count({ where }),
    ]);

    // Calculate additional stats for each course
    const coursesWithStats = courses.map((course) => {
      const totalLectures = course.sections.reduce(
        (total, section) => total + section.lectures.length,
        0,
      );
      const totalDuration = course.sections.reduce(
        (total, section) =>
          total +
          section.lectures.reduce(
            (lectureTotal, lecture) => lectureTotal + (lecture.duration || 0),
            0,
          ),
        0,
      );
      const totalEnrollments = course.enrollments.length;
      const averageRating =
        course.reviews.length > 0
          ? course.reviews.reduce((sum, review) => sum + review.rating, 0) /
            course.reviews.length
          : 0;

      return {
        ...course,
        totalLectures,
        totalDuration,
        totalEnrollments,
        averageRating,
        totalReviews: course.reviews.length,
      };
    });

    return {
      courses: coursesWithStats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInstructorReviews(
    instructorId: string,
    options: {
      page?: number;
      limit?: number;
      rating?: number;
    },
  ) {
    const { page = 1, limit = 10, rating } = options;
    const skip = (page - 1) * limit;

    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const where: any = {
      instructorId,
      isPublic: true,
    };

    if (rating) {
      where.rating = { gte: rating, lt: rating + 1 };
    }

    const [reviews, total] = await Promise.all([
      this.prisma.instructorRating.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.instructorRating.count({ where }),
    ]);

    // Calculate review statistics
    const allReviews = await this.prisma.instructorRating.findMany({
      where: {
        instructorId,
        isPublic: true,
      },
      select: {
        rating: true,
      },
    });

    const stats = {
      totalReviews: allReviews.length,
      averageOverallRating:
        allReviews.length > 0
          ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
          : 0,
      ratingDistribution: {
        1: allReviews.filter((r) => Math.floor(r.rating) === 1).length,
        2: allReviews.filter((r) => Math.floor(r.rating) === 2).length,
        3: allReviews.filter((r) => Math.floor(r.rating) === 3).length,
        4: allReviews.filter((r) => Math.floor(r.rating) === 4).length,
        5: allReviews.filter((r) => Math.floor(r.rating) === 5).length,
      },
    };

    return {
      reviews,
      stats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getInstructorAvailability(
    instructorId: string,
    options: {
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const { startDate, endDate } = options;

    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Set default start date to today if not provided
    const defaultStartDate = new Date();
    defaultStartDate.setHours(0, 0, 0, 0); // Start of today

    const where: any = {
      instructorId,
      isActive: true, // Only active availabilities
      specificDate: {
        gte: startDate || defaultStartDate, // From provided start date or today
      },
    };

    if (endDate) {
      where.specificDate.lte = endDate;
    }

    const availabilities = await this.prisma.instructorAvailability.findMany({
      where,
      include: {
        generatedSlots: {
          where: {
            // Filter out past time slots
            OR: [
              {
                date: {
                  gt: new Date(), // Future dates
                },
              },
              {
                AND: [
                  {
                    date: {
                      gte: new Date(new Date().setHours(0, 0, 0, 0)), // Start of today
                    },
                  },
                  {
                    startTime: {
                      gt: new Date(), // Current time
                    },
                  },
                ],
              },
            ],
            isAvailable: true, // Only available slots
            isBooked: false, // Not booked
            isBlocked: false, // Not blocked
          },
          orderBy: { startTime: 'asc' },
        },
      },
      orderBy: [{ specificDate: 'asc' }, { startTime: 'asc' }],
    });

    // Get instructor profile for default settings
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId: instructorId },
      select: {
        defaultSessionDuration: true,
        defaultSessionType: true,
        individualSessionRate: true,
        groupSessionRate: true,
        currency: true,
        bufferBetweenSessions: true,
        maxSessionsPerDay: true,
      },
    });

    // Filter availabilities to only include those with available slots
    const filteredAvailabilities = availabilities.filter(
      (availability) => availability.generatedSlots.length > 0,
    );

    // Calculate summary statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const summary = {
      totalAvailabilities: filteredAvailabilities.length,
      activeAvailabilities: filteredAvailabilities.filter((a) => a.isActive)
        .length,
      upcomingAvailabilities: filteredAvailabilities.filter(
        (a) =>
          a.specificDate > now ||
          (a.specificDate >= today &&
            a.startTime > now.toTimeString().slice(0, 5)),
      ).length,
      totalAvailableSlots: filteredAvailabilities.reduce(
        (total, a) => total + a.generatedSlots.length,
        0,
      ),
      nextAvailableSlot: this.getNextAvailableSlot(filteredAvailabilities, now),
    };

    return {
      availabilities: filteredAvailabilities,
      defaultSettings: profile,
      summary,
      filters: {
        startDate: startDate || defaultStartDate,
        endDate: endDate || null,
        currentTime: now.toISOString(),
      },
    };
  }

  async updateAutoApprovalSettings(
    userId: string,
    autoAcceptBookings: boolean,
  ) {
    const profile = await this.prisma.instructorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Instructor profile not found');
    }

    const updatedProfile = await this.prisma.instructorProfile.update({
      where: { userId },
      data: {
        autoAcceptBookings,
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
          },
        },
      },
    });

    return {
      success: true,
      message: `Auto-approval ${autoAcceptBookings ? 'enabled' : 'disabled'} successfully`,
      profile: updatedProfile,
    };
  }

  private getNextAvailableSlot(availabilities: any[], now: Date): any | null {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find the next available slot
    for (const availability of availabilities) {
      for (const slot of availability.generatedSlots) {
        const slotDate = slot.date || availability.specificDate;
        const slotDateOnly = new Date(
          slotDate.getFullYear(),
          slotDate.getMonth(),
          slotDate.getDate(),
        );

        if (
          slotDateOnly > today ||
          (slotDateOnly.getTime() === today.getTime() && slot.startTime > now)
        ) {
          return {
            date: slotDateOnly.toISOString().split('T')[0],
            startTime: slot.startTime,
            endTime: slot.endTime,
            isBooked: slot.isBooked || false,
            availabilityId: availability.id,
            slotId: slot.id,
          };
        }
      }
    }

    return null;
  }
}
