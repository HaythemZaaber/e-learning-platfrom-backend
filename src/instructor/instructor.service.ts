import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InstructorService {
  private readonly logger = new Logger(InstructorService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

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

      return profile;
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
        this.logger.warn(`Instructor profile already exists for user: ${userId}`);
        // Update existing profile instead of creating new one
        return await this.updateInstructorProfile(userId, application);
      }

      // Extract data from application for instructor profile
      const personalInfo = application.personalInfo || {};
      const professionalBackground = application.professionalBackground || {};
      const teachingInformation = application.teachingInformation || {};
      const documents = application.documents || {};

      // Extract subjects to teach from teaching information
      const subjectsToTeach = teachingInformation.subjectsToTeach?.map((subject: any) => 
        typeof subject === 'string' ? subject : subject.subject
      ) || application.subjectsToTeach || [];

      // Extract teaching categories from subjects
      const teachingCategories = teachingInformation.subjectsToTeach?.map((subject: any) => 
        typeof subject === 'string' ? 'General' : subject.category
      ) || [];

      // Extract languages spoken from personal info
      const languagesSpoken = personalInfo.languagesSpoken?.map((lang: any) => ({
        language: typeof lang === 'string' ? lang : lang.language,
        proficiency: typeof lang === 'string' ? 'intermediate' : lang.proficiency,
        canTeachIn: typeof lang === 'string' ? true : lang.canTeachIn
      })) || [];

      // Extract social links and contact info
      const socialLinks = {
        email: personalInfo.email,
        phone: personalInfo.phoneNumber,
        website: personalInfo.personalWebsite,
        linkedin: personalInfo.linkedinProfile,
        ...personalInfo.socialLinks
      };

      // Extract qualifications from education and certifications
      const qualifications = [
        ...(professionalBackground.education?.map((edu: any) => 
          `${edu.degree} in ${edu.field} from ${edu.institution}`
        ) || []),
        ...(documents.professionalCertifications?.map((cert: any) => 
          cert.name || 'Professional Certification'
        ) || [])
      ];

      // Create comprehensive instructor profile
      const profile = await this.prisma.instructorProfile.create({
        data: {
          userId,
          
          // Professional Information
          title: professionalBackground.currentJobTitle || personalInfo.title || 'Instructor',
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
          preferredSchedule: teachingInformation.weeklyAvailability || {},
          availableTimeSlots: teachingInformation.weeklyAvailability ? 
            this.extractTimeSlots(teachingInformation.weeklyAvailability) : [],

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
            minimumPayout: 50
          },
          taxInformation: {
            taxId: personalInfo.taxId,
            country: personalInfo.country,
            taxStatus: 'individual'
          },
          paymentPreferences: {
            autoPayout: false,
            payoutFrequency: 'monthly'
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

      this.logger.log(`Created comprehensive instructor profile for user: ${userId}`);
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
    const subjectsToTeach = teachingInformation.subjectsToTeach?.map((subject: any) => 
      typeof subject === 'string' ? subject : subject.subject
    ) || application.subjectsToTeach || [];

    // Extract teaching categories from subjects
    const teachingCategories = teachingInformation.subjectsToTeach?.map((subject: any) => 
      typeof subject === 'string' ? 'General' : subject.category
    ) || [];

    // Extract languages spoken from personal info
    const languagesSpoken = personalInfo.languagesSpoken?.map((lang: any) => ({
      language: typeof lang === 'string' ? lang : lang.language,
      proficiency: typeof lang === 'string' ? 'intermediate' : lang.proficiency,
      canTeachIn: typeof lang === 'string' ? true : lang.canTeachIn
    })) || [];

    // Extract social links and contact info
    const socialLinks = {
      email: personalInfo.email,
      phone: personalInfo.phoneNumber,
      website: personalInfo.personalWebsite,
      linkedin: personalInfo.linkedinProfile,
      ...personalInfo.socialLinks
    };

    // Extract qualifications from education and certifications
    const qualifications = [
      ...(professionalBackground.education?.map((edu: any) => 
        `${edu.degree} in ${edu.field} from ${edu.institution}`
      ) || []),
      ...(documents.professionalCertifications?.map((cert: any) => 
        cert.name || 'Professional Certification'
      ) || [])
    ];

    const profile = await this.prisma.instructorProfile.update({
      where: { userId },
      data: {
        // Professional Information
        title: professionalBackground.currentJobTitle || personalInfo.title || 'Instructor',
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
        preferredSchedule: teachingInformation.weeklyAvailability || {},
        availableTimeSlots: teachingInformation.weeklyAvailability ? 
          this.extractTimeSlots(teachingInformation.weeklyAvailability) : [],

        // Verification & Compliance
        isVerified: true,
        verificationLevel: 'VERIFIED',
        lastVerificationDate: new Date(),
        complianceStatus: 'COMPLIANT',

        // Financial Information
        taxInformation: {
          taxId: personalInfo.taxId,
          country: personalInfo.country,
          taxStatus: 'individual'
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

      this.logger.log(`Updated instructor profile for user: ${userId}`);
      return updatedProfile;
    } catch (error) {
      this.logger.error('Error updating instructor profile:', error);
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
      return { success: true, message: 'Instructor profile deleted successfully' };
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
      const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length;
      const totalEnrollments = courses.reduce((sum, c) => sum + c.currentEnrollments, 0);
      const totalRevenue = courses.reduce((sum, c) => sum + (c.price * c.currentEnrollments), 0);
      const averageRating = courses.length > 0 
        ? courses.reduce((sum, c) => sum + (c.avgRating || 0), 0) / courses.length 
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
          hasSome: Array.isArray(filters.expertise) ? filters.expertise : [filters.expertise],
        };
      }

      if (filters?.teachingCategories) {
        where.teachingCategories = {
          hasSome: Array.isArray(filters.teachingCategories) ? filters.teachingCategories : [filters.teachingCategories],
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
          array_contains: Array.isArray(filters.languages) ? filters.languages : [filters.languages],
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

  private extractTimeSlots(weeklyAvailability: any): any[] {
    const timeSlots: any[] = [];
    
    Object.entries(weeklyAvailability).forEach(([day, dayData]: [string, any]) => {
      if (dayData.available && dayData.timeSlots && dayData.timeSlots.length > 0) {
        dayData.timeSlots.forEach((slot: any) => {
          timeSlots.push({
            day,
            start: slot.start,
            end: slot.end
          });
        });
      }
    });
    
    return timeSlots;
  }
}
