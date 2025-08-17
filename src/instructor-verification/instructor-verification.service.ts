import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  ApplicationStatus, 
  VerificationStatus, 
  DocumentType,
  AIRecommendation,
  ReviewDecision,
  InterviewFormat
} from '@prisma/client';

@Injectable()
export class InstructorVerificationService {
  private readonly logger = new Logger(InstructorVerificationService.name);

  constructor(
    private prisma: PrismaService,
  ) {}

  // =============================================================================
  // CORE VERIFICATION METHODS
  // =============================================================================

  async createInstructorVerification(userId: string, metadata?: any) {
    try {
      // Check if user already has an application
      const existingApplication = await this.prisma.instructorApplication.findUnique({
        where: { userId },
      });

      if (existingApplication) {
        throw new BadRequestException('User already has an instructor application');
      }

      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create new application
      const application = await this.prisma.instructorApplication.create({
        data: {
          userId,
          fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          phoneNumber: user.phone || '',
          yearsOfExperience: 0,
          subjectsToTeach: [],
          teachingMotivation: '',
          applicationData: metadata || {},
          personalInfo: {},
          professionalBackground: {},
          teachingInformation: {},
          documents: {},
          consents: {},
          currentStep: 0,
          completionScore: 0,
          status: ApplicationStatus.PENDING,
          lastAutoSave: new Date(),
        },
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
        },
      });

      this.logger.log(`Created instructor verification for user: ${userId}`);
      return application;
    } catch (error) {
      this.logger.error('Error creating instructor verification:', error);
      throw error;
    }
  }

  async getInstructorVerification(userId: string) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { userId },
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Instructor verification not found');
      }

      return application;
    } catch (error) {
      this.logger.error('Error getting instructor verification:', error);
      throw error;
    }
  }

  async getDraftApplications(userId: string) {
    try {
      const applications = await this.prisma.instructorApplication.findMany({
        where: {
          userId,
          status: ApplicationStatus.PENDING, // Only show drafts
        },
        include: {
          applicationDocuments: true,
        },
        orderBy: { lastSavedAt: 'desc' },
      });

      return applications;
    } catch (error) {
      this.logger.error('Error getting draft applications:', error);
      throw error;
    }
  }

  async getVerificationStatus(userId: string) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { userId },
        select: {
          id: true,
          status: true,
          submittedAt: true,
          lastSavedAt: true,
          currentStep: true,
          completionScore: true,
        },
      });

      if (!application) {
        return {
          success: false,
          message: 'No verification application found',
          data: null,
          errors: ['No application found for this user'],
        };
      }

      return {
        success: true,
        message: 'Verification status retrieved successfully',
        data: application,
        errors: null,
      };
    } catch (error) {
      this.logger.error('Error getting verification status:', error);
      throw error;
    }
  }

  async updateInstructorVerification(id: string, updateData: any) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id },
      });

      if (!application) {
        throw new NotFoundException('Instructor verification not found');
      }

      // Update the application
      const updatedApplication = await this.prisma.instructorApplication.update({
        where: { id },
        data: {
          ...updateData,
          lastSavedAt: new Date(),
        },
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
        },
      });

      this.logger.log(`Updated instructor verification: ${id}`);
      return updatedApplication;
    } catch (error) {
      this.logger.error('Error updating instructor verification:', error);
      throw error;
    }
  }

  async submitInstructorVerification(id: string, consents: any) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id },
        include: {
          applicationDocuments: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Instructor verification not found');
      }

      // Check if application is already submitted
      if (application.status === ApplicationStatus.UNDER_REVIEW || 
          application.status === ApplicationStatus.APPROVED || 
          application.status === ApplicationStatus.REJECTED) {
        throw new BadRequestException('Application has already been submitted');
      }

      // Validate that all required fields are completed
      const validationResult = await this.validateApplication(application);
      if (!validationResult.isValid) {
        throw new BadRequestException(`Application validation failed: ${validationResult.errors.join(', ')}`);
      }

      // Calculate final completion score
      const completionScore = await this.calculateCompletionScore(application);
      
      // Update application status to submitted (this makes it visible to admin)
      const updatedApplication = await this.prisma.instructorApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.UNDER_REVIEW, // This status makes it visible to admin
          consents,
          submittedAt: new Date(),
          lastSavedAt: new Date(),
          completionScore,
          currentStep: 4, // Mark as completed
        },
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
        },
      });

      // Trigger AI verification process
      // await this.triggerAIVerification(id);

      this.logger.log(`Submitted instructor verification: ${id} with ${completionScore}% completion`);
      return updatedApplication;
    } catch (error) {
      this.logger.error('Error submitting instructor verification:', error);
      throw error;
    }
  }

  async saveVerificationDraft(id: string, draftData: any) {
    try {
      console.log("draftData", draftData);
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id },
      });

      if (!application) {
        throw new NotFoundException('Instructor verification not found');
      }

      // Extract and organize draft data into proper fields
      const updateData: any = {
        status: ApplicationStatus.PENDING, // Keep as PENDING for drafts
        lastAutoSave: new Date(),
        lastSavedAt: new Date(),
      };

      // Update personal info if provided
      if (draftData.personalInfo) {
        updateData.personalInfo = draftData.personalInfo;
        // Update extracted fields for quick access
        if (draftData.personalInfo.firstName && draftData.personalInfo.lastName) {
          updateData.fullName = `${draftData.personalInfo.firstName} ${draftData.personalInfo.lastName}`.trim();
        }
        if (draftData.personalInfo.phoneNumber) {
          updateData.phoneNumber = draftData.personalInfo.phoneNumber;
        }
        if (draftData.personalInfo.nationality) {
          updateData.nationality = draftData.personalInfo.nationality;
        }
      }

      // Update professional background if provided
      if (draftData.professionalBackground) {
        updateData.professionalBackground = draftData.professionalBackground;
        // Update extracted fields
        if (draftData.professionalBackground.currentJobTitle) {
          updateData.currentJobTitle = draftData.professionalBackground.currentJobTitle;
        }
        if (draftData.professionalBackground.yearsOfExperience) {
          updateData.yearsOfExperience = draftData.professionalBackground.yearsOfExperience;
        }
      }

      // Update teaching information if provided
      if (draftData.teachingInformation) {
        updateData.teachingInformation = draftData.teachingInformation;
        // Update extracted fields
        if (draftData.teachingInformation.subjectsToTeach) {
          updateData.subjectsToTeach = draftData.teachingInformation.subjectsToTeach.map((subject: any) => subject.subject || subject);
        }
        if (draftData.teachingInformation.teachingMotivation) {
          updateData.teachingMotivation = draftData.teachingInformation.teachingMotivation;
        }
      }

      // Update documents if provided
      if (draftData.documents) {
        updateData.documents = draftData.documents;
      }

      // Update consents if provided
      if (draftData.consents) {
        updateData.consents = draftData.consents;
      }

      // Calculate completion score
      const completionScore = await this.calculateCompletionScore({
        ...application,
        ...updateData,
      });
      updateData.completionScore = completionScore;

      // Update current step based on what's completed
      updateData.currentStep = this.calculateCurrentStep(updateData);

      // Update application with organized draft data
      const updatedApplication = await this.prisma.instructorApplication.update({
        where: { id },
        data: updateData,
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
        },
      });

      this.logger.log(`Saved verification draft: ${id} with ${completionScore}% completion`);
      return updatedApplication;
    } catch (error) {
      this.logger.error('Error saving verification draft:', error);
      throw error;
    }
  }

  async deleteInstructorVerification(id: string) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id },
      });

      if (!application) {
        throw new NotFoundException('Instructor verification not found');
      }

      // Delete the application
      await this.prisma.instructorApplication.delete({
        where: { id },
      });

      this.logger.log(`Deleted instructor verification: ${id}`);
      return { success: true, message: 'Instructor verification deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting instructor verification:', error);
      throw error;
    }
  }

  // =============================================================================
  // DOCUMENT MANAGEMENT (URL-based)
  // =============================================================================

  async addDocumentUrl(applicationId: string, documentData: {
    documentType: DocumentType;
    fileUrl: string;
    fileName: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
    metadata?: any;
  }) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Instructor verification not found');
      }

      // Create document record
      const document = await this.prisma.applicationDocument.create({
        data: {
          applicationId,
          documentType: documentData.documentType,
          fileName: documentData.fileName,
          originalName: documentData.originalName,
          fileSize: documentData.fileSize,
          mimeType: documentData.mimeType,
          fileUrl: documentData.fileUrl,
          verificationStatus: VerificationStatus.DRAFT,
          metadata: documentData.metadata || {},
        },
      });

      this.logger.log(`Added document URL: ${document.id}`);
      return document;
    } catch (error) {
      this.logger.error('Error adding document URL:', error);
      throw error;
    }
  }

  async deleteVerificationDocument(applicationId: string, documentId: string) {
    try {
      const document = await this.prisma.applicationDocument.findFirst({
        where: {
          id: documentId,
          applicationId,
        },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      // Delete document record
      await this.prisma.applicationDocument.delete({
        where: { id: documentId },
      });

      this.logger.log(`Deleted verification document: ${documentId}`);
      return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
      this.logger.error('Error deleting verification document:', error);
      throw error;
    }
  }

  // =============================================================================
  // AI VERIFICATION
  // =============================================================================

  async triggerAIVerification(applicationId: string) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
        include: {
          applicationDocuments: true,
        },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      // Create AI verification record
      const aiVerification = await this.prisma.instructorAIVerification.create({
        data: {
          applicationId,
          verificationProvider: 'internal',
          recommendation: AIRecommendation.MANUAL_REVIEW_REQUIRED,
        },
      });

      // Simulate AI processing (in real implementation, this would call external AI service)
      await this.processAIVerification(aiVerification.id, application);

      this.logger.log(`Triggered AI verification for application: ${applicationId}`);
      return aiVerification;
    } catch (error) {
      this.logger.error('Error triggering AI verification:', error);
      throw error;
    }
  }

  private async processAIVerification(aiVerificationId: string, application: any) {
    try {
      // Simulate AI processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update AI verification with results
      await this.prisma.instructorAIVerification.update({
        where: { id: aiVerificationId },
        data: {
          identityVerified: true,
          identityConfidence: 0.85,
          educationVerified: true,
          educationConfidence: 0.90,
          experienceVerified: true,
          experienceConfidence: 0.88,
          contentQualityScore: 0.82,
          languageProficiency: 0.90,
          professionalismScore: 0.85,
          riskScore: 0.15,
          overallScore: 0.84,
          recommendation: AIRecommendation.APPROVE,
          recommendationReason: 'Application meets all requirements',
          processingTime: 2000,
          processedAt: new Date(),
        },
      });

      this.logger.log(`Completed AI verification: ${aiVerificationId}`);
    } catch (error) {
      this.logger.error('Error processing AI verification:', error);
      throw error;
    }
  }

  // =============================================================================
  // MANUAL REVIEW
  // =============================================================================

  async createManualReview(input: any) {
    try {
      const { applicationId, reviewerId, ...reviewData } = input;

      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const manualReview = await this.prisma.instructorManualReview.create({
        data: {
          applicationId,
          reviewerId,
          ...reviewData,
          reviewedAt: new Date(),
        },
      });

      this.logger.log(`Created manual review for application: ${applicationId}`);
      return manualReview;
    } catch (error) {
      this.logger.error('Error creating manual review:', error);
      throw error;
    }
  }

  // =============================================================================
  // INTERVIEW MANAGEMENT
  // =============================================================================

  async createInterview(input: any) {
    try {
      const { applicationId, interviewerId, scheduledAt, format, meetingLink, interviewNotes } = input;

      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const interview = await this.prisma.instructorInterview.create({
        data: {
          applicationId,
          interviewerId,
          scheduledAt: new Date(scheduledAt),
          format,
          meetingLink,
          interviewNotes,
          recordingConsent: false,
        },
      });

      this.logger.log(`Created interview for application: ${applicationId}`);
      return interview;
    } catch (error) {
      this.logger.error('Error creating interview:', error);
      throw error;
    }
  }

  async updateInterview(id: string, updateData: any) {
    try {
      const interview = await this.prisma.instructorInterview.findUnique({
        where: { id },
      });

      if (!interview) {
        throw new NotFoundException('Interview not found');
      }

      const updatedInterview = await this.prisma.instructorInterview.update({
        where: { id },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Updated interview: ${id}`);
      return updatedInterview;
    } catch (error) {
      this.logger.error('Error updating interview:', error);
      throw error;
    }
  }

  // =============================================================================
  // VALIDATION AND UTILITIES
  // =============================================================================

  private async validateApplication(application: any) {
    const errors: string[] = [];

    // Check personal info
    if (!application.personalInfo || Object.keys(application.personalInfo).length === 0) {
      errors.push('Personal information is required');
    }

    // Check professional background
    if (!application.professionalBackground || Object.keys(application.professionalBackground).length === 0) {
      errors.push('Professional background is required');
    }

    // Check teaching information
    if (!application.teachingInformation || Object.keys(application.teachingInformation).length === 0) {
      errors.push('Teaching information is required');
    }


    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  async calculateCompletionScore(application: any) {
    let score = 0;
    const totalSteps = 4; // personal info, professional background, teaching info, documents

    // Personal info (25%)
    if (application.personalInfo && Object.keys(application.personalInfo).length > 0) {
      score += 25;
    }

    // Professional background (25%)
    if (application.professionalBackground && Object.keys(application.professionalBackground).length > 0) {
      score += 25;
    }

    // Teaching information (25%)
    if (application.teachingInformation && Object.keys(application.teachingInformation).length > 0) {
      score += 25;
    }

    // Documents (25%)
    const documentCount = application.documents?.length || 0;
    const documentScore = Math.min(25, documentCount * 2.78); // 5 points per document, max 25
    score += documentScore;

    return Math.min(100, score);
  }

  private calculateCurrentStep(applicationData: any): number {
    let step = 0;
    
    // Step 1: Personal Info (0-25%)
    if (applicationData.personalInfo && Object.keys(applicationData.personalInfo).length > 0) {
      step = 1;
    }
    
    // Step 2: Professional Background (25-50%)
    if (applicationData.professionalBackground && Object.keys(applicationData.professionalBackground).length > 0) {
      step = 2;
    }
    
    // Step 3: Teaching Information (50-75%)
    if (applicationData.teachingInformation && Object.keys(applicationData.teachingInformation).length > 0) {
      step = 3;
    }
    
    // Step 4: Documents (75-100%)
    if (applicationData.documents && Object.keys(applicationData.documents).length > 0) {
      step = 4;
    }
    
    return step;
  }

  // =============================================================================
  // ADMIN METHODS
  // =============================================================================

  async getAllApplications(filters?: any) {
    try {
      const where: any = {};

      if (filters?.status) {
        where.status = filters.status;
      } else {
        // By default, only show applications that are ready for admin review
        // (not drafts/PENDING status)
        where.status = {
          in: [
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.APPROVED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.REQUIRES_MORE_INFO,
            ApplicationStatus.INTERVIEW_SCHEDULED,
          ],
        };
      }

      if (filters?.search) {
        where.OR = [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { phoneNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const applications = await this.prisma.instructorApplication.findMany({
        where,
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return applications;
    } catch (error) {
      this.logger.error('Error getting all applications:', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus, reason?: string) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      const updatedApplication = await this.prisma.instructorApplication.update({
        where: { id: applicationId },
        data: {
          status,
          lastSavedAt: new Date(),
        },
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
        },
      });

      // If approved, update user role to instructor
      if (status === ApplicationStatus.APPROVED) {
        await this.prisma.user.update({
          where: { id: application.userId },
          data: {
            role: 'INSTRUCTOR',
            instructorStatus: 'APPROVED',
          },
        });
      }

      this.logger.log(`Updated application status: ${applicationId} -> ${status}`);
      return updatedApplication;
    } catch (error) {
      this.logger.error('Error updating application status:', error);
      throw error;
    }
  }
}
