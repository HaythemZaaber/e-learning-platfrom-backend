import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstructorService {
  private readonly logger = new Logger(InstructorService.name);

  constructor(private prisma: PrismaService) {}

  // =============================================================================
  // INSTRUCTOR PROFILE METHODS
  // =============================================================================

  async getInstructorProfile(userId: string) {
    try {
      const profile = await this.prisma.instructorProfile.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              role: true,
              instructorStatus: true,
            },
          },
        },
      });

      if (!profile) {
        throw new NotFoundException('Instructor profile not found');
      }

      // Compute availability fields and real-time statistics
      const [preferredSchedule, availableTimeSlots, instructorStats] =
        await Promise.all([
          this.computePreferredSchedule(userId),
          this.computeAvailableTimeSlots(userId),
          this.computeInstructorStatsForList(userId),
        ]);

      // Add computed fields to the profile
      const profileWithAvailability = {
        ...profile,
        preferredSchedule,
        availableTimeSlots,
        individualSessionRate: profile.individualSessionRate || 50,
        groupSessionRate: profile.groupSessionRate || 30,
        // Override with real-time calculated values
        teachingRating: instructorStats.averageRating,
        totalStudents: instructorStats.totalStudents,
        totalCourses: instructorStats.totalCourses,
        totalRevenue: instructorStats.totalRevenue,
        averageCourseRating: instructorStats.averageCourseRating,
      };

      return profileWithAvailability;
    } catch (error) {
      this.logger.error('Error getting instructor profile:', error);
      throw error;
    }
  }

  async createInstructorProfile(userId: string, application: any) {
    try {
      console.log('Application:', application);
      // Check if instructor profile already exists
      const existingProfile = await this.prisma.instructorProfile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        this.logger.warn(
          `Instructor profile already exists for user: ${userId}`,
        );
        // Update existing profile instead of creating new one
        return await this.updateInstructorProfile(userId, application);
      }

      // Extract data from application for instructor profile
      const personalInfo = application.personalInfo || {};
      const professionalBackground = application.professionalBackground || {};
      const teachingInformation = application.teachingInformation || {};
      const documents = application.documents || {};

      // Extract subjects to teach from teaching information
      const subjectsToTeach =
        teachingInformation.subjectsToTeach?.map((subject: any) =>
          typeof subject === 'string' ? subject : subject.subject,
        ) ||
        application.subjectsToTeach ||
        [];

      // Extract teaching categories from subjects
      const teachingCategories =
        teachingInformation.subjectsToTeach?.map((subject: any) =>
          typeof subject === 'string' ? 'General' : subject.category,
        ) || [];

      // Extract languages spoken from personal info
      const languagesSpoken =
        personalInfo.languagesSpoken?.map((lang: any) => ({
          language: typeof lang === 'string' ? lang : lang.language,
          proficiency:
            typeof lang === 'string' ? 'intermediate' : lang.proficiency,
          canTeachIn: typeof lang === 'string' ? true : lang.canTeachIn,
        })) || [];

      // Extract social links and contact info
      const socialLinks = {
        email: personalInfo.email,
        phone: personalInfo.phoneNumber,
        website: personalInfo.personalWebsite,
        linkedin: personalInfo.linkedinProfile,
        ...personalInfo.socialLinks,
      };

      // Extract qualifications from education and certifications
      const qualifications = [
        ...(professionalBackground.education?.map(
          (edu: any) => `${edu.degree} in ${edu.field} from ${edu.institution}`,
        ) || []),
        ...(documents.professionalCertifications?.map(
          (cert: any) => cert.name || 'Professional Certification',
        ) || []),
      ];

      // Create comprehensive instructor profile
      const profile = await this.prisma.instructorProfile.create({
        data: {
          userId,

          // Professional Information
          title:
            professionalBackground.currentJobTitle ||
            personalInfo.title ||
            'Instructor',
          bio: teachingInformation.teachingMotivation || '',
          shortBio: teachingInformation.teachingPhilosophy || '',
          expertise: subjectsToTeach,
          qualifications: qualifications,
          experience: professionalBackground.yearsOfExperience || 0,
          socialLinks: socialLinks,
          personalWebsite: personalInfo.personalWebsite,
          linkedinProfile: personalInfo.linkedinProfile,

          // Teaching Specialization
          subjectsTeaching: subjectsToTeach,
          teachingCategories: teachingCategories,
          languagesSpoken: languagesSpoken,
          teachingStyle: teachingInformation.teachingStyle,
          targetAudience: Array.isArray(teachingInformation.targetAudience)
            ? teachingInformation.targetAudience.join(', ')
            : teachingInformation.targetAudience,
          teachingMethodology: teachingInformation.teachingMethodology,

          // Platform Statistics (initialize with zeros)
          teachingRating: 0,
          totalStudents: 0,
          totalCourses: 0,
          totalRevenue: 0,
          currency: 'USD',

          // Performance Metrics (initialize with defaults)
          averageCourseRating: 0,
          studentRetentionRate: 0,
          courseCompletionRate: 0,
          responseTime: 24, // Default 24 hours
          studentSatisfaction: 0,

          // Teaching Availability
          isAcceptingStudents: true,
          maxStudentsPerCourse: null, // Will be set based on preferences

          // Verification & Compliance
          isVerified: true,
          verificationLevel: 'VERIFIED',
          lastVerificationDate: new Date(),
          complianceStatus: 'COMPLIANT',

          // Content Creation Stats (initialize with zeros)
          totalLectures: 0,
          totalVideoHours: 0,
          totalQuizzes: 0,
          totalAssignments: 0,
          contentUpdateFreq: 0,

          // Financial Information
          payoutSettings: {
            preferredMethod: 'bank_transfer',
            currency: 'USD',
            minimumPayout: 50,
          },
          taxInformation: {
            taxId: personalInfo.taxId,
            country: personalInfo.country,
            taxStatus: 'individual',
          },
          paymentPreferences: {
            autoPayout: false,
            payoutFrequency: 'monthly',
          },
          revenueSharing: 70, // Default 70% instructor keeps

          // Marketing & Promotion
          isPromotionEligible: true,
          marketingConsent: personalInfo.marketingConsent || false,
          featuredInstructor: false,
          badgesEarned: ['verified_instructor'],

          // Activity Tracking
          lastCourseUpdate: null,
          lastStudentReply: null,
          lastContentCreation: null,
        },
      });

      console.log('Profile:', profile);

      this.logger.log(
        `Created comprehensive instructor profile for user: ${userId}`,
      );
      return profile;
    } catch (error) {
      this.logger.error('Error creating instructor profile:', error);
      throw error;
    }
  }

  async updateInstructorProfile(userId: string, application: any) {
    const personalInfo = application.personalInfo || {};
    const professionalBackground = application.professionalBackground || {};
    const teachingInformation = application.teachingInformation || {};
    const documents = application.documents || {};

    // Extract subjects to teach from teaching information
    const subjectsToTeach =
      teachingInformation.subjectsToTeach?.map((subject: any) =>
        typeof subject === 'string' ? subject : subject.subject,
      ) ||
      application.subjectsToTeach ||
      [];

    // Extract teaching categories from subjects
    const teachingCategories =
      teachingInformation.subjectsToTeach?.map((subject: any) =>
        typeof subject === 'string' ? 'General' : subject.category,
      ) || [];

    // Extract languages spoken from personal info
    const languagesSpoken =
      personalInfo.languagesSpoken?.map((lang: any) => ({
        language: typeof lang === 'string' ? lang : lang.language,
        proficiency:
          typeof lang === 'string' ? 'intermediate' : lang.proficiency,
        canTeachIn: typeof lang === 'string' ? true : lang.canTeachIn,
      })) || [];

    // Extract social links and contact info
    const socialLinks = {
      email: personalInfo.email,
      phone: personalInfo.phoneNumber,
      website: personalInfo.personalWebsite,
      linkedin: personalInfo.linkedinProfile,
      ...personalInfo.socialLinks,
    };

    // Extract qualifications from education and certifications
    const qualifications = [
      ...(professionalBackground.education?.map(
        (edu: any) => `${edu.degree} in ${edu.field} from ${edu.institution}`,
      ) || []),
      ...(documents.professionalCertifications?.map(
        (cert: any) => cert.name || 'Professional Certification',
      ) || []),
    ];

    const profile = await this.prisma.instructorProfile.update({
      where: { userId },
      data: {
        // Professional Information
        title:
          professionalBackground.currentJobTitle ||
          personalInfo.title ||
          'Instructor',
        bio: teachingInformation.teachingMotivation || '',
        shortBio: teachingInformation.teachingPhilosophy || '',
        expertise: subjectsToTeach,
        qualifications: qualifications,
        experience: professionalBackground.yearsOfExperience || 0,
        socialLinks: socialLinks,
        personalWebsite: personalInfo.personalWebsite,
        linkedinProfile: personalInfo.linkedinProfile,

        // Teaching Specialization
        subjectsTeaching: subjectsToTeach,
        teachingCategories: teachingCategories,
        languagesSpoken: languagesSpoken,
        teachingStyle: teachingInformation.teachingStyle,
        targetAudience: Array.isArray(teachingInformation.targetAudience)
          ? teachingInformation.targetAudience.join(', ')
          : teachingInformation.targetAudience,
        teachingMethodology: teachingInformation.teachingMethodology,

        // Teaching Availability
        isAcceptingStudents: true,

        // Verification & Compliance
        isVerified: true,
        verificationLevel: 'VERIFIED',
        lastVerificationDate: new Date(),
        complianceStatus: 'COMPLIANT',

        // Financial Information
        taxInformation: {
          taxId: personalInfo.taxId,
          country: personalInfo.country,
          taxStatus: 'individual',
        },

        // Marketing & Promotion
        marketingConsent: personalInfo.marketingConsent || false,
        badgesEarned: ['verified_instructor'],
      },
    });

    this.logger.log(`Updated existing instructor profile for user: ${userId}`);
    return profile;
  }

  async updateProfile(userId: string, updateData: any) {
    try {
      const profile = await this.prisma.instructorProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new NotFoundException('Instructor profile not found');
      }

      const updatedProfile = await this.prisma.instructorProfile.update({
        where: { userId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      // Compute availability fields and real-time statistics for response
      const [preferredSchedule, availableTimeSlots, instructorStats] =
        await Promise.all([
          this.computePreferredSchedule(userId),
          this.computeAvailableTimeSlots(userId),
          this.computeInstructorStatsForList(userId),
        ]);

      const profileWithAvailability = {
        ...updatedProfile,
        preferredSchedule,
        availableTimeSlots,
        individualSessionRate: updatedProfile.individualSessionRate || 50,
        groupSessionRate: updatedProfile.groupSessionRate || 30,
        // Override with real-time calculated values
        teachingRating: instructorStats.averageRating,
        totalStudents: instructorStats.totalStudents,
        totalCourses: instructorStats.totalCourses,
        totalRevenue: instructorStats.totalRevenue,
        averageCourseRating: instructorStats.averageCourseRating,
      };

      this.logger.log(`Updated instructor profile for user: ${userId}`);
      return profileWithAvailability;
    } catch (error) {
      this.logger.error('Error updating instructor profile:', error);
      throw error;
    }
  }

  async updateProfileImage(userId: string, profileImage: string) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          profileImage,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Updated profile image for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      this.logger.error('Error updating profile image:', error);
      throw error;
    }
  }

  async deleteInstructorProfile(userId: string) {
    try {
      const profile = await this.prisma.instructorProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new NotFoundException('Instructor profile not found');
      }

      await this.prisma.instructorProfile.delete({
        where: { userId },
      });

      this.logger.log(`Deleted instructor profile for user: ${userId}`);
      return {
        success: true,
        message: 'Instructor profile deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting instructor profile:', error);
      throw error;
    }
  }

  // =============================================================================
  // INSTRUCTOR STATISTICS & ANALYTICS
  // =============================================================================

  async getInstructorStats(userId: string) {
    try {
      const profile = await this.prisma.instructorProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        throw new NotFoundException('Instructor profile not found');
      }

      // Get course statistics
      const courses = await this.prisma.course.findMany({
        where: { instructorId: userId },
        select: {
          id: true,
          title: true,
          status: true,
          avgRating: true,
          totalRatings: true,
          views: true,
          currentEnrollments: true,
          price: true,
        },
      });

      // Calculate statistics
      const totalCourses = courses.length;
      const publishedCourses = courses.filter(
        (c) => c.status === 'PUBLISHED',
      ).length;
      const totalEnrollments = courses.reduce(
        (sum, c) => sum + c.currentEnrollments,
        0,
      );
      const totalRevenue = courses.reduce(
        (sum, c) => sum + c.price * c.currentEnrollments,
        0,
      );
      const averageRating =
        courses.length > 0
          ? courses.reduce((sum, c) => sum + (c.avgRating || 0), 0) /
            courses.length
          : 0;

      return {
        profile,
        statistics: {
          totalCourses,
          publishedCourses,
          totalEnrollments,
          totalRevenue,
          averageRating,
          courses,
        },
        // Flattened fields for easier querying
        totalRevenue,
        totalStudents: profile.totalStudents,
        totalCourses,
        averageRating,
        courseCompletionRate: profile.courseCompletionRate,
        studentRetentionRate: profile.studentRetentionRate,
        studentSatisfactionRate: profile.studentSatisfaction,
        averageResponseTime: profile.responseTime,
        totalLectures: profile.totalLectures,
        totalVideoHours: profile.totalVideoHours,
        totalQuizzes: profile.totalQuizzes,
        totalAssignments: profile.totalAssignments,
        contentUpdateFrequency: profile.contentUpdateFreq,
        lastCourseUpdate: profile.lastCourseUpdate,
        lastStudentReply: profile.lastStudentReply,
        lastContentCreation: profile.lastContentCreation,
        verificationStatus: profile.isVerified ? 'VERIFIED' : 'UNVERIFIED',
        complianceStatus: profile.complianceStatus,
      };
    } catch (error) {
      this.logger.error('Error getting instructor stats:', error);
      throw error;
    }
  }

  // =============================================================================
  // INSTRUCTOR SEARCH & DISCOVERY
  // =============================================================================

  async searchInstructors(filters: any) {
    try {
      const where: any = {
        isVerified: true,
        isAcceptingStudents: true,
      };

      if (filters?.expertise) {
        where.expertise = {
          hasSome: Array.isArray(filters.expertise)
            ? filters.expertise
            : [filters.expertise],
        };
      }

      if (filters?.teachingCategories) {
        where.teachingCategories = {
          hasSome: Array.isArray(filters.teachingCategories)
            ? filters.teachingCategories
            : [filters.teachingCategories],
        };
      }

      if (filters?.minRating) {
        where.teachingRating = {
          gte: filters.minRating,
        };
      }

      if (filters?.minExperience) {
        where.experience = {
          gte: filters.minExperience,
        };
      }

      if (filters?.languages) {
        where.languagesSpoken = {
          path: ['$[*].language'],
          array_contains: Array.isArray(filters.languages)
            ? filters.languages
            : [filters.languages],
        };
      }

      const instructors = await this.prisma.instructorProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              email: true,
            },
          },
        },
        orderBy: [
          { featuredInstructor: 'desc' },
          { teachingRating: 'desc' },
          { totalStudents: 'desc' },
        ],
        take: filters?.limit || 20,
        skip: filters?.offset || 0,
      });

      return instructors;
    } catch (error) {
      this.logger.error('Error searching instructors:', error);
      throw error;
    }
  }

  // =============================================================================
  // HELPER METHODS
  // =============================================================================

  /**
   * Compute instructor statistics for list display
   * This method calculates real-time statistics including ratings and course data
   */
  async computeInstructorStatsForList(instructorId: string) {
    try {
      // Get instructor ratings from the InstructorRating table
      const instructorRatings = await this.prisma.instructorRating.findMany({
        where: {
          instructorId,
          isPublic: true,
        },
        select: {
          rating: true,
        },
      });

      // Calculate instructor rating statistics
      const totalInstructorRatings = instructorRatings.length;
      const averageRating =
        totalInstructorRatings > 0
          ? instructorRatings.reduce((sum, r) => sum + r.rating, 0) /
            totalInstructorRatings
          : 0;

      // Get course statistics
      const courses = await this.prisma.course.findMany({
        where: { instructorId },
        select: {
          id: true,
          status: true,
          currentEnrollments: true,
          price: true,
          avgRating: true,
          totalRatings: true,
        },
      });

      // Calculate course-based statistics
      const totalCourses = courses.length;
      const publishedCourses = courses.filter(
        (c) => c.status === 'PUBLISHED',
      ).length;
      const totalEnrollments = courses.reduce(
        (sum, c) => sum + c.currentEnrollments,
        0,
      );
      const totalRevenue = courses.reduce(
        (sum, c) => sum + c.price * c.currentEnrollments,
        0,
      );
      const averageCourseRating =
        courses.length > 0
          ? courses.reduce((sum, c) => sum + (c.avgRating || 0), 0) /
            courses.length
          : 0;

      // Get total students from enrollments
      const totalStudents = await this.prisma.enrollment.count({
        where: {
          course: { instructorId },
        },
      });

      return {
        averageRating: Math.round(averageRating * 100) / 100,
        totalInstructorRatings,
        totalCourses,
        publishedCourses,
        totalEnrollments,
        totalStudents,
        totalRevenue,
        averageCourseRating: Math.round(averageCourseRating * 100) / 100,
      };
    } catch (error) {
      this.logger.error('Error computing instructor stats for list:', error);
      // Return default values if there's an error
      return {
        averageRating: 0,
        totalInstructorRatings: 0,
        totalCourses: 0,
        publishedCourses: 0,
        totalEnrollments: 0,
        totalStudents: 0,
        totalRevenue: 0,
        averageCourseRating: 0,
      };
    }
  }

  // =============================================================================
  // AVAILABILITY COMPUTATION METHODS (For Profile Display Only)
  // =============================================================================

  async computePreferredSchedule(instructorId: string): Promise<any> {
    try {
      // Get all availabilities to build a comprehensive weekly schedule
      // Don't filter by date to ensure we get all availabilities including today's
      const availabilities =
        await this.getInstructorAvailabilities(instructorId);

      this.logger.log(
        `Found ${availabilities.length} availabilities for instructor ${instructorId}`,
      );

      const weeklySchedule: any = {
        monday: { available: false, timeSlots: [] },
        tuesday: { available: false, timeSlots: [] },
        wednesday: { available: false, timeSlots: [] },
        thursday: { available: false, timeSlots: [] },
        friday: { available: false, timeSlots: [] },
        saturday: { available: false, timeSlots: [] },
        sunday: { available: false, timeSlots: [] },
      };

      const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
      ];

      // Group availabilities by day of week
      const availabilitiesByDay: { [key: string]: any[] } = {};
      dayNames.forEach((day) => {
        availabilitiesByDay[day] = [];
      });

      availabilities.forEach((availability) => {
        this.logger.log(
          `Processing availability: ${availability.id}, date: ${availability.specificDate}, active: ${availability.isActive}, slots: ${availability.generatedSlots.length}`,
        );

        if (availability.isActive && availability.generatedSlots.length > 0) {
          const dayOfWeek = availability.specificDate.getDay();
          const dayName = dayNames[dayOfWeek];
          availabilitiesByDay[dayName].push(availability);
        }
      });

      // Build weekly schedule from grouped availabilities
      dayNames.forEach((dayName) => {
        const dayAvailabilities = availabilitiesByDay[dayName];
        if (dayAvailabilities.length > 0) {
          weeklySchedule[dayName].available = true;

          // Get all unique time slots for this day
          const allSlots: any[] = [];
          dayAvailabilities.forEach((availability) => {
            const slots = availability.generatedSlots
              .filter(
                (slot) =>
                  slot.isAvailable &&
                  !slot.isBooked &&
                  !slot.isBlocked &&
                  slot.startTime > new Date(), // Only show future slots
              )
              .map((slot) => ({
                start: slot.startTime.toTimeString().slice(0, 5), // HH:MM format
                end: slot.endTime.toTimeString().slice(0, 5), // HH:MM format
                duration: slot.slotDuration,
                slotId: slot.id,
                isAvailable: slot.isAvailable,
                isBooked: slot.isBooked,
                isBlocked: slot.isBlocked,
                currentBookings: slot.currentBookings,
                maxBookings: slot.maxBookings,
              }));
            allSlots.push(...slots);
          });

          // Remove duplicates based on start time
          const uniqueSlots = allSlots.filter(
            (slot, index, self) =>
              index === self.findIndex((s) => s.start === slot.start),
          );

          weeklySchedule[dayName].timeSlots = uniqueSlots;
          this.logger.log(`${dayName}: ${uniqueSlots.length} unique slots`);
        }
      });

      return weeklySchedule;
    } catch (error) {
      this.logger.error('Error computing preferred schedule:', error);
      return {
        monday: { available: false, timeSlots: [] },
        tuesday: { available: false, timeSlots: [] },
        wednesday: { available: false, timeSlots: [] },
        thursday: { available: false, timeSlots: [] },
        friday: { available: false, timeSlots: [] },
        saturday: { available: false, timeSlots: [] },
        sunday: { available: false, timeSlots: [] },
      };
    }
  }

  async computeAvailableTimeSlots(instructorId: string): Promise<any[]> {
    try {
      // Get available slots for today and next 7 days
      const today = new Date();
      const availableSlots: any[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        const slots = await this.getAvailableTimeSlots(instructorId, date);
        availableSlots.push(
          ...slots.map((slot) => ({
            date: slot.startTime,
            start: slot.startTime.toTimeString().slice(0, 5),
            end: slot.endTime.toTimeString().slice(0, 5),
            duration: slot.duration,
            availabilityId: slot.availabilityId,
            priceOverride: slot.priceOverride,
            currency: slot.currency,
          })),
        );
      }

      return availableSlots;
    } catch (error) {
      this.logger.error('Error computing available time slots:', error);
      return [];
    }
  }

  // =============================================================================
  // AVAILABILITY READ-ONLY METHODS (For Profile Display)
  // =============================================================================

  async getInstructorAvailabilities(
    instructorId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    try {
      const where: any = { instructorId };

      if (startDate && endDate) {
        where.specificDate = {
          gte: startDate,
          lte: endDate,
        };
      }

      const availabilities = await this.prisma.instructorAvailability.findMany({
        where,
        include: {
          generatedSlots: {
            orderBy: { startTime: 'asc' },
          },
        },
        orderBy: { specificDate: 'asc' },
      });

      return availabilities;
    } catch (error) {
      this.logger.error('Error getting instructor availabilities:', error);
      throw error;
    }
  }

  async getAvailableTimeSlots(instructorId: string, date: Date) {
    try {
      const availabilities = await this.prisma.instructorAvailability.findMany({
        where: {
          instructorId,
          specificDate: date,
          isActive: true,
        },
        include: {
          generatedSlots: {
            where: {
              isAvailable: true,
              isBooked: false,
              isBlocked: false,
              currentBookings: {
                lt: this.prisma.timeSlot.fields.maxBookings,
              },
            },
            orderBy: { startTime: 'asc' },
          },
        },
      });

      const availableSlots = availabilities.flatMap((availability) =>
        availability.generatedSlots.map((slot) => ({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          duration: slot.slotDuration,
          availabilityId: availability.id,
          priceOverride: availability.priceOverride,
          currency: availability.currency,
        })),
      );

      return availableSlots;
    } catch (error) {
      this.logger.error('Error getting available time slots:', error);
      throw error;
    }
  }

  async checkInstructorAvailabilityToday(
    instructorId: string,
  ): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const availability = await this.prisma.instructorAvailability.findFirst({
        where: {
          instructorId,
          specificDate: today,
          isActive: true,
        },
        include: {
          generatedSlots: {
            where: {
              isAvailable: true,
              isBooked: false,
              isBlocked: false,
              currentBookings: {
                lt: this.prisma.timeSlot.fields.maxBookings,
              },
            },
          },
        },
      });

      return !!(availability && availability.generatedSlots.length > 0);
    } catch (error) {
      this.logger.error('Error checking instructor availability today:', error);
      return false;
    }
  }

  // =============================================================================
  // LANDING PAGE METHODS
  // =============================================================================

  async getFeaturedInstructors(limit: number = 6) {
    try {
      const featuredInstructors = await this.prisma.instructorProfile.findMany({
        where: {
          isVerified: true,
          isAcceptingStudents: true,
          featuredInstructor: true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              email: true,
              role: true,
              instructorStatus: true,
            },
          },
        },
        orderBy: [
          { featuredInstructor: 'desc' },
          { teachingRating: 'desc' },
          { totalStudents: 'desc' },
        ],
        take: limit,
      });

      // Add computed availability fields and statistics to each instructor
      const featuredInstructorsWithAvailability = await Promise.all(
        featuredInstructors.map(async (instructor) => {
          const [preferredSchedule, availableTimeSlots, instructorStats] =
            await Promise.all([
              this.computePreferredSchedule(instructor.userId),
              this.computeAvailableTimeSlots(instructor.userId),
              this.computeInstructorStatsForList(instructor.userId),
            ]);

          return {
            ...instructor,
            preferredSchedule,
            availableTimeSlots,
            individualSessionRate: instructor.individualSessionRate || 50,
            groupSessionRate: instructor.groupSessionRate || 30,
            // Override with real-time calculated values
            teachingRating: instructorStats.averageRating,
            totalStudents: instructorStats.totalStudents,
            totalCourses: instructorStats.totalCourses,
            totalRevenue: instructorStats.totalRevenue,
            averageCourseRating: instructorStats.averageCourseRating,
            // Add additional computed fields
            totalInstructorRatings: instructorStats.totalInstructorRatings,
            publishedCourses: instructorStats.publishedCourses,
            totalEnrollments: instructorStats.totalEnrollments,
          };
        }),
      );

      return {
        featuredInstructors: featuredInstructorsWithAvailability,
        total: featuredInstructorsWithAvailability.length,
        hasMore: featuredInstructorsWithAvailability.length === limit,
      };
    } catch (error) {
      this.logger.error('Error getting featured instructors:', error);
      throw error;
    }
  }

  async getInstructorHeroStats() {
    try {
      const [
        totalInstructors,
        averageRating,
        totalStudents,
        liveSessionsEnabled,
        verifiedInstructors,
      ] = await Promise.all([
        this.prisma.instructorProfile.count({
          where: { isVerified: true, isAcceptingStudents: true },
        }),
        this.prisma.instructorProfile.aggregate({
          where: { isVerified: true },
          _avg: { teachingRating: true },
        }),
        this.prisma.instructorProfile.aggregate({
          where: { isVerified: true },
          _sum: { totalStudents: true },
        }),
        this.prisma.instructorProfile.count({
          where: { liveSessionsEnabled: true, isVerified: true },
        }),
        this.prisma.instructorProfile.count({
          where: { isVerified: true },
        }),
      ]);

      // Count instructors available today
      const availableTodayInstructors =
        await this.prisma.instructorProfile.findMany({
          where: {
            isVerified: true,
            isAcceptingStudents: true,
          },
          select: { userId: true },
        });

      let availableToday = 0;
      for (const instructor of availableTodayInstructors) {
        const isAvailableToday = await this.checkInstructorAvailabilityToday(
          instructor.userId,
        );
        if (isAvailableToday) {
          availableToday++;
        }
      }

      return {
        totalInstructors,
        availableToday,
        averageRating: averageRating._avg.teachingRating || 0,
        totalStudents: totalStudents._sum.totalStudents || 0,
        liveSessionsEnabled,
        verifiedInstructors,
      };
    } catch (error) {
      this.logger.error('Error getting instructor hero stats:', error);
      throw error;
    }
  }

  // =============================================================================
  // INSTRUCTORS PAGE METHODS
  // =============================================================================

  async getInstructorsList(
    filters: any,
    page: number = 1,
    limit: number = 6,
    sortBy: string = 'featured',
    currentUserId?: string,
  ) {
    try {
      const where: any = {
        isVerified: true,
        isAcceptingStudents: true,
      };

      // Exclude the current user from the results (if they are an instructor)
      if (currentUserId) {
        where.userId = { not: currentUserId };
        console.log('Filtering out instructor with user ID:', currentUserId);
      } else {
        console.log('No current user ID provided for instructor list');
      }

      // Apply filters
      if (filters?.searchQuery) {
        where.OR = [
          {
            user: {
              firstName: { contains: filters.searchQuery, mode: 'insensitive' },
            },
          },
          {
            user: {
              lastName: { contains: filters.searchQuery, mode: 'insensitive' },
            },
          },
          { title: { contains: filters.searchQuery, mode: 'insensitive' } },
          { bio: { contains: filters.searchQuery, mode: 'insensitive' } },
          { expertise: { hasSome: [filters.searchQuery] } },
        ];
      }

      if (filters?.categories?.length > 0) {
        where.teachingCategories = {
          hasSome: filters.categories,
        };
      }

      if (filters?.expertise?.length > 0) {
        where.expertise = {
          hasSome: filters.expertise,
        };
      }

      if (filters?.minRating) {
        where.teachingRating = {
          gte: filters.minRating,
        };
      }

      if (filters?.minExperience) {
        where.experience = {
          gte: filters.minExperience,
        };
      }

      if (filters?.languages?.length > 0) {
        where.languagesSpoken = {
          path: ['$[*].language'],
          array_contains: filters.languages,
        };
      }

      if (filters?.offersLiveSessions) {
        where.liveSessionsEnabled = true;
      }

      if (filters?.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
      }

      if (filters?.featuredInstructor) {
        where.featuredInstructor = true;
      }

      // Determine sort order
      let orderBy: any[] = [];
      switch (sortBy) {
        case 'rating':
          orderBy = [{ teachingRating: 'desc' }];
          break;
        case 'students':
          orderBy = [{ totalStudents: 'desc' }];
          break;
        case 'newest':
          orderBy = [{ createdAt: 'desc' }];
          break;
        case 'name':
          orderBy = [{ user: { firstName: 'asc' } }];
          break;
        case 'available-today':
          orderBy = [
            { liveSessionsEnabled: 'desc' },
            { teachingRating: 'desc' },
          ];
          break;
        case 'most-booked':
          orderBy = [{ totalStudents: 'desc' }, { teachingRating: 'desc' }];
          break;
        default: // featured
          orderBy = [
            { featuredInstructor: 'desc' },
            { teachingRating: 'desc' },
            { totalStudents: 'desc' },
          ];
      }

      const skip = (page - 1) * limit;

      const [instructors, total] = await Promise.all([
        this.prisma.instructorProfile.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                email: true,
                role: true,
                instructorStatus: true,
              },
            },
          },
          orderBy,
          take: limit,
          skip,
        }),
        this.prisma.instructorProfile.count({ where }),
      ]);

      // Add computed availability fields, ratings, and course statistics to each instructor
      const instructorsWithComputedData = await Promise.all(
        instructors.map(async (instructor) => {
          const [preferredSchedule, availableTimeSlots, instructorStats] =
            await Promise.all([
              this.computePreferredSchedule(instructor.userId),
              this.computeAvailableTimeSlots(instructor.userId),
              this.computeInstructorStatsForList(instructor.userId),
            ]);

          return {
            ...instructor,
            preferredSchedule,
            availableTimeSlots,
            individualSessionRate: instructor.individualSessionRate || 50,
            groupSessionRate: instructor.groupSessionRate || 30,
            // Override with real-time calculated values
            teachingRating: instructorStats.averageRating,
            totalStudents: instructorStats.totalStudents,
            totalCourses: instructorStats.totalCourses,
            totalRevenue: instructorStats.totalRevenue,
            averageCourseRating: instructorStats.averageCourseRating,
            // Add additional computed fields
            totalInstructorRatings: instructorStats.totalInstructorRatings,
            publishedCourses: instructorStats.publishedCourses,
            totalEnrollments: instructorStats.totalEnrollments,
          };
        }),
      );

      const totalPages = Math.ceil(total / limit);

      return {
        instructors: instructorsWithComputedData,
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
        filters: filters || {},
      };
    } catch (error) {
      this.logger.error('Error getting instructors list:', error);
      throw error;
    }
  }

  async getAvailableTodayInstructors(
    limit: number = 10,
    currentUserId?: string,
  ) {
    try {
      const where: any = {
        isVerified: true,
        isAcceptingStudents: true,
        liveSessionsEnabled: true,
      };

      // Exclude the current user from the results (if they are an instructor)
      if (currentUserId) {
        where.userId = { not: currentUserId };
        console.log(
          'Filtering out instructor with user ID from available today:',
          currentUserId,
        );
      } else {
        console.log(
          'No current user ID provided for available today instructors',
        );
      }

      const availableInstructors = await this.prisma.instructorProfile.findMany(
        {
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                email: true,
                role: true,
                instructorStatus: true,
              },
            },
          },
          orderBy: [{ teachingRating: 'desc' }, { totalStudents: 'desc' }],
          take: limit,
        },
      );

      // Filter instructors who are actually available today
      const availableToday: typeof availableInstructors = [];
      for (const instructor of availableInstructors) {
        const isAvailableToday = await this.checkInstructorAvailabilityToday(
          instructor.userId,
        );
        if (isAvailableToday) {
          availableToday.push(instructor);
        }
      }

      // Add computed availability fields and statistics to each instructor
      const availableTodayWithAvailability = await Promise.all(
        availableToday.map(async (instructor) => {
          const [preferredSchedule, availableTimeSlots, instructorStats] =
            await Promise.all([
              this.computePreferredSchedule(instructor.userId),
              this.computeAvailableTimeSlots(instructor.userId),
              this.computeInstructorStatsForList(instructor.userId),
            ]);

          return {
            ...instructor,
            preferredSchedule,
            availableTimeSlots,
            individualSessionRate: instructor.individualSessionRate || 50,
            groupSessionRate: instructor.groupSessionRate || 30,
            // Override with real-time calculated values
            teachingRating: instructorStats.averageRating,
            totalStudents: instructorStats.totalStudents,
            totalCourses: instructorStats.totalCourses,
            totalRevenue: instructorStats.totalRevenue,
            averageCourseRating: instructorStats.averageCourseRating,
            // Add additional computed fields
            totalInstructorRatings: instructorStats.totalInstructorRatings,
            publishedCourses: instructorStats.publishedCourses,
            totalEnrollments: instructorStats.totalEnrollments,
          };
        }),
      );

      return availableTodayWithAvailability;
    } catch (error) {
      this.logger.error('Error getting available today instructors:', error);
      throw error;
    }
  }
}
