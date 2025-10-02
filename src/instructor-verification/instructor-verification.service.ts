import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InstructorService } from '../instructor/instructor.service';
import { 
  ApplicationStatus, 
  VerificationStatus, 
  DocumentType,
  AIRecommendation,
  ReviewDecision,
  InterviewFormat,
  NotificationType,
  NotificationPriority
} from '@prisma/client';

@Injectable()
export class InstructorVerificationService {
  private readonly logger = new Logger(InstructorVerificationService.name);

  constructor(
    private prisma: PrismaService,
    private instructorService: InstructorService,
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
          status: ApplicationStatus.DRAFT,
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

  async getInstructorVerification(userId?: string, applicationId?: string) {
    try {
      let whereClause: any = {};
      
      // Determine which unique identifier to use
      if (applicationId) {
        whereClause = { id: applicationId };
      } else if (userId) {
        whereClause = { userId: userId };
      } else {
        throw new BadRequestException('Either userId or applicationId must be provided');
      }

      const application = await this.prisma.instructorApplication.findUnique({
        where: whereClause,
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
          status: ApplicationStatus.DRAFT, // Only show drafts
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
          manualReview: true,
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

      // clean the manual review if the currect decision is reject
      if (application.manualReview && application.manualReview.decision === 'REJECT') {
        await this.prisma.instructorManualReview.delete({
          where: { applicationId: id },
        });
      }
    
      
      // Update application status to submitted (this makes it visible to admin)
      const updatedApplication = await this.prisma.instructorApplication.update({
        where: { id },
        data: {
          status: ApplicationStatus.SUBMITTED, // This status makes it visible to admin
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
        status: ApplicationStatus.DRAFT, // Keep as DRAFT for drafts
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
        // (not drafts/DRAFT status)
        where.status = {
          in: [
            ApplicationStatus.SUBMITTED,
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

      // Add date range filters
      if (filters?.dateFrom) {
        where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
      }
      if (filters?.dateTo) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
      }

      // Add completion score filter
      if (filters?.minCompletionScore) {
        where.completionScore = { ...where.completionScore, gte: filters.minCompletionScore };
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

  async getSubmittedApplications(filters?: any) {
    try {
      const where: any = {};

      // Handle status filtering based on frontend tabs
      if (filters?.status) {
        if (Array.isArray(filters.status)) {
          // Handle array of statuses (e.g., ['APPROVED', 'REJECTED'] for completed tab)
          where.status = {
            in: filters.status
          };
        } else {
          // Handle single status
          where.status = filters.status;
        }
      } else {
        // Default: show applications that are ready for admin review
        where.status = {
          in: [
            ApplicationStatus.SUBMITTED,
            ApplicationStatus.UNDER_REVIEW,
            ApplicationStatus.APPROVED,
            ApplicationStatus.REJECTED,
            ApplicationStatus.REQUIRES_MORE_INFO,
          ],
        };
      }

      if (filters?.search) {
        where.OR = [
          { fullName: { contains: filters.search, mode: 'insensitive' } },
          { phoneNumber: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      // Add date range filters
      if (filters?.dateFrom) {
        where.createdAt = { ...where.createdAt, gte: new Date(filters.dateFrom) };
      }
      if (filters?.dateTo) {
        where.createdAt = { ...where.createdAt, lte: new Date(filters.dateTo) };
      }

      // Add completion score filter
      if (filters?.minCompletionScore) {
        where.completionScore = { ...where.completionScore, gte: filters.minCompletionScore };
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
        orderBy: [
          { status: 'asc' },
          { submittedAt: 'asc' }
        ],
      });

      // Transform the data to include computed fields
      const transformedApplications = applications.map((app: any) => ({
        ...app,
        aiVerification: app.aiVerification ? {
          ...app.aiVerification,
          verificationResults: {
            identityVerified: app.aiVerification.identityVerified,
            educationVerified: app.aiVerification.educationVerified,
            experienceVerified: app.aiVerification.experienceVerified,
            overallScore: app.aiVerification.overallScore,
            recommendation: app.aiVerification.recommendation,
          },
          reviewedAt: app.aiVerification.processedAt
        } : null,
        interview: app.interview ? {
          ...app.interview,
          notes: app.interview.interviewNotes,
          status: app.interview.passed !== null ? (app.interview.passed ? 'COMPLETED' : 'FAILED') : 'SCHEDULED'
        } : null
      }));

      return transformedApplications;
    } catch (error) {
      this.logger.error('Error getting submitted applications:', error);
      throw error;
    }
  }

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus, reason?: string, reviewerId?: string) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      // Validate reviewerId if provided
      if (reviewerId) {
        const reviewer = await this.prisma.user.findUnique({
          where: { id: reviewerId },
        });
        
        if (!reviewer) {
          throw new BadRequestException(`Reviewer with ID ${reviewerId} not found`);
        }
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

      // Create review record only if reviewerId is provided
      if (reviewerId) {
        await this.prisma.instructorManualReview.upsert({
          where: { applicationId },
          create: {
            applicationId,
            reviewerId,
            decision: 'APPROVE',
            decisionReason: reason,
            reviewedAt: new Date(),
          },
          update: {
            decision: 'APPROVE',
            decisionReason: reason,
            reviewedAt: new Date(),
          },
        });
      }

      // If approved, update user role to instructor and create instructor profile
      if (status === ApplicationStatus.APPROVED) {
        await this.approveInstructor(application.userId, application);
      }

      // Send notification to user
      await this.sendApplicationStatusNotification(application.userId, status, reason);

      this.logger.log(`Updated application status: ${applicationId} -> ${status}`);
      return updatedApplication;
    } catch (error) {
      this.logger.error('Error updating application status:', error);
      throw error;
    }
  }

  async startApplicationReview(applicationId: string, reviewerId: string) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== ApplicationStatus.SUBMITTED) {
        throw new BadRequestException('Application is not submitted for review');
      }

      // Update application status to indicate review is in progress
      const updatedApplication = await this.prisma.instructorApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.UNDER_REVIEW, // Change to under review when admin starts reviewing
          lastSavedAt: new Date(),
        },
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
        },
      });

      this.logger.log(`Started review for application: ${applicationId} by reviewer: ${reviewerId}`);
      return updatedApplication;
    } catch (error) {
      this.logger.error('Error starting application review:', error);
      throw error;
    }
  }

  async reviewDocument(documentId: string, verificationStatus: VerificationStatus, reviewerId: string, notes?: string) {
    try {
      const document = await this.prisma.applicationDocument.findUnique({
        where: { id: documentId },
      });

      if (!document) {
        throw new NotFoundException('Document not found');
      }

      const updatedDocument = await this.prisma.applicationDocument.update({
        where: { id: documentId },
        data: {
          verificationStatus,
          metadata: {
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            notes,
          },
        },
      });

      this.logger.log(`Document ${documentId} reviewed: ${verificationStatus}`);
      return updatedDocument;
    } catch (error) {
      this.logger.error('Error reviewing document:', error);
      throw error;
    }
  }

  async approveInstructor(userId: string, application: any) {
    try {
      // Update application status to approved
      // Update user role and status
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          role: 'INSTRUCTOR',
          instructorStatus: 'APPROVED',
        },
      });

      // Create instructor profile using the dedicated instructor service
      await this.instructorService.createInstructorProfile(userId, application);

      // Send welcome notification
      await this.sendWelcomeNotification(userId);

      this.logger.log(`Instructor approved: ${userId} with comprehensive profile`);
    } catch (error) {
      this.logger.error('Error approving instructor:', error);
      throw error;
    }
  }

  async rejectApplication(applicationId: string, reason: string, reviewerId: string, requiresResubmission: boolean = false) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      // Validate reviewerId
      const reviewer = await this.prisma.user.findUnique({
        where: { id: reviewerId },
      });
      
      if (!reviewer) {
        throw new BadRequestException(`Reviewer with ID ${reviewerId} not found`);
      }

      const status = requiresResubmission ? ApplicationStatus.REQUIRES_MORE_INFO : ApplicationStatus.REJECTED;

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

      // Create rejection record
      await this.prisma.instructorManualReview.upsert({
        where: { applicationId },
        create: {
          applicationId,
          reviewerId,
          decision: 'REJECT',
          decisionReason: reason,
          reviewedAt: new Date(),
        },
        update: {
          decision: 'REJECT',
          decisionReason: reason,
          reviewedAt: new Date(),
        },
        });

      // Send rejection notification
      await this.sendApplicationStatusNotification(application.userId, status, reason);

      this.logger.log(`Application rejected: ${applicationId}`);
      return updatedApplication;
    } catch (error) {
      this.logger.error('Error rejecting application:', error);
      throw error;
    }
  }

  async requestMoreInformation(applicationId: string, requiredInfo: string[], reviewerId: string, deadline?: Date) {
    try {
      const application = await this.prisma.instructorApplication.findUnique({
        where: { id: applicationId },
      });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      // Validate reviewerId
      const reviewer = await this.prisma.user.findUnique({
        where: { id: reviewerId },
      });
      
      if (!reviewer) {
        throw new BadRequestException(`Reviewer with ID ${reviewerId} not found`);
      }

      const updatedApplication = await this.prisma.instructorApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.REQUIRES_MORE_INFO,
          lastSavedAt: new Date(),
        },
        include: {
          applicationDocuments: true,
          aiVerification: true,
          manualReview: true,
          interview: true,
        },
      });

      // Create review record with required info
      await this.prisma.instructorManualReview.upsert({
        where: { applicationId },
        create: {
          applicationId,
          reviewerId,
          decision: 'REQUEST_MORE_INFO',
          decisionReason: `Required information: ${requiredInfo.join(', ')}`,
          conditionalRequirements: requiredInfo,
          reviewedAt: new Date(),
        },
        update: {
          decision: 'REQUEST_MORE_INFO',
          decisionReason: `Required information: ${requiredInfo.join(', ')}`,
          conditionalRequirements: requiredInfo,
          reviewedAt: new Date(),
        },
      });

      // Send notification with required info
      await this.sendMoreInfoRequestNotification(application.userId, requiredInfo, deadline);

      this.logger.log(`More information requested for application: ${applicationId}`);
      return updatedApplication;
    } catch (error) {
      this.logger.error('Error requesting more information:', error);
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



  // =============================================================================
  // NOTIFICATION METHODS
  // =============================================================================

  private async sendApplicationStatusNotification(userId: string, status: ApplicationStatus, reason?: string) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Application Status Update',
          message: this.getStatusMessage(status, reason),
          type: NotificationType.INSTRUCTOR_APPROVED,
          priority: NotificationPriority.HIGH,
          data: { status, reason },
        },
      });

      this.logger.log(`Notification sent to user ${userId} for status: ${status}`);
    } catch (error) {
      this.logger.error('Error sending notification:', error);
    }
  }

  private async sendWelcomeNotification(userId: string) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Welcome to Our Instructor Community!',
          message: 'Congratulations! Your instructor application has been approved. You can now start creating courses and sharing your knowledge.',
          type: NotificationType.INSTRUCTOR_APPROVED,
          priority: NotificationPriority.HIGH,
          data: { type: 'welcome' },
        },
      });

      this.logger.log(`Welcome notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Error sending welcome notification:', error);
    }
  }

  private async sendMoreInfoRequestNotification(userId: string, requiredInfo: string[], deadline?: Date) {
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          title: 'Additional Information Required',
          message: `We need additional information to process your application: ${requiredInfo.join(', ')}${deadline ? ` Please provide this information by ${deadline.toLocaleDateString()}.` : ''}`,
          type: NotificationType.INSTRUCTOR_APPROVED,
          priority: NotificationPriority.HIGH,
          data: { requiredInfo, deadline },
        },
      });

      this.logger.log(`More info request notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error('Error sending more info request notification:', error);
    }
  }

  private getStatusMessage(status: ApplicationStatus, reason?: string): string {
    switch (status) {
      case ApplicationStatus.APPROVED:
        return 'Congratulations! Your instructor application has been approved.';
      case ApplicationStatus.REJECTED:
        return `Your instructor application has been rejected.${reason ? ` Reason: ${reason}` : ''}`;
      case ApplicationStatus.REQUIRES_MORE_INFO:
        return `Your application requires additional information.${reason ? ` Details: ${reason}` : ''}`;
      case ApplicationStatus.UNDER_REVIEW:
        return 'Your application is currently under review.';
      default:
        return 'Your application status has been updated.';
    }
  }



  // =============================================================================
  // ADMIN STATISTICS
  // =============================================================================

  async getAdminStats() {
    try {
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get total applications
      const totalApplications = await this.prisma.instructorApplication.count();

      // Get applications by status
      const pendingReview = await this.prisma.instructorApplication.count({
        where: { status: ApplicationStatus.SUBMITTED }
      });

      const underReview = await this.prisma.instructorApplication.count({
        where: { status: ApplicationStatus.UNDER_REVIEW }
      });

      const approved = await this.prisma.instructorApplication.count({
        where: { status: ApplicationStatus.APPROVED }
      });

      const rejected = await this.prisma.instructorApplication.count({
        where: { status: ApplicationStatus.REJECTED }
      });

      const requiresMoreInfo = await this.prisma.instructorApplication.count({
        where: { status: ApplicationStatus.REQUIRES_MORE_INFO }
      });

      // Get applications this week
      const applicationsThisWeek = await this.prisma.instructorApplication.count({
        where: {
          createdAt: {
            gte: oneWeekAgo
          }
        }
      });

      // Get applications this month
      const applicationsThisMonth = await this.prisma.instructorApplication.count({
        where: {
          createdAt: {
            gte: oneMonthAgo
          }
        }
      });

      // Calculate average review time (time from submission to final decision)
      const completedApplications = await this.prisma.instructorApplication.findMany({
        where: {
          status: {
            in: [ApplicationStatus.APPROVED, ApplicationStatus.REJECTED]
          },
          submittedAt: { not: null }
        },
        select: {
          submittedAt: true,
          updatedAt: true
        }
      });

      let totalReviewTime = 0;
      let validApplications = 0;

      completedApplications.forEach(app => {
        if (app.submittedAt && app.updatedAt) {
          const reviewTime = app.updatedAt.getTime() - app.submittedAt.getTime();
          totalReviewTime += reviewTime;
          validApplications++;
        }
      });

      const averageReviewTime = validApplications > 0 
        ? Math.round(totalReviewTime / validApplications / (1000 * 60 * 60)) // Convert to hours
        : 0;

      return {
        totalApplications,
        pendingReview,
        underReview,
        approved,
        rejected,
        requiresMoreInfo,
        averageReviewTime,
        applicationsThisWeek,
        applicationsThisMonth
      };
    } catch (error) {
      this.logger.error('Error getting admin stats:', error);
      throw error;
    }
  }
}
