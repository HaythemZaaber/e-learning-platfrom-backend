import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, ApplicationStatus } from '@prisma/client';
import { InstructorVerificationService } from './instructor-verification.service';
import { GetUser } from '../auth/get-user.decorator';

// Import all the entities and DTOs
import {
  InstructorVerification,
  ApplicationDocument,
  InstructorAIVerification,
  InstructorManualReview,
  InstructorInterview,
  VerificationResponse,
  DocumentUploadResponse,
  VerificationStatusResponse,
  AdminStats,
} from './entities/instructor-verification.entity';



import {
  CreateInstructorVerificationInput,
  UpdateInstructorVerificationInput,
  SubmitInstructorVerificationInput,
  SaveVerificationDraftInput,
  AddDocumentUrlInput,
  DeleteVerificationDocumentInput,
  UpdatePersonalInfoInput,
  UpdateProfessionalBackgroundInput,
  UpdateTeachingInformationInput,
  CreateAIVerificationInput,
  CreateManualReviewInput,
  CreateInterviewInput,
  UpdateInterviewInput,
  ApplicationFiltersInput,
  StartReviewInput,
  ReviewDocumentInput,
  ApproveApplicationInput,
  RejectApplicationInput,
  RequestMoreInfoInput,
} from './dto/instructor-verification.dto';

@Resolver(() => InstructorVerification)
@UseGuards(AuthGuard, RolesGuard)
export class InstructorVerificationResolver {
  constructor(
    private instructorVerificationService: InstructorVerificationService,
  ) {}

  // =============================================================================
  // QUERIES
  // =============================================================================

  @Query(() => VerificationResponse, { name: 'getInstructorVerification' })
  async getInstructorVerification(@Args('userId', { nullable: true }) userId?: string ,@Args('applicationId', { nullable: true }) applicationId?: string) {
    try {
      const verification = await this.instructorVerificationService.getInstructorVerification(userId, applicationId);
      
      return {
        success: true,
      
   message: 'Instructor verification retrieved successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    } }

  @Query(() => [InstructorVerification], { name: 'getDraftApplications' })
  async getDraftApplications(@Args('userId') userId: string) {
    try {
      return await this.instructorVerificationService.getDraftApplications(userId);
    } catch (error) {
      throw new Error(`Failed to get draft applications: ${error.message}`);
    }
  }

  @Query(() => VerificationStatusResponse, { name: 'getVerificationStatus' })
  async getVerificationStatus(@Args('userId') userId: string) {
    try {
      const result = await this.instructorVerificationService.getVerificationStatus(userId);
      return result;
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Query(() => [InstructorVerification], { name: 'getAllInstructorApplications' })
  @Roles(UserRole.ADMIN)
  async getAllInstructorApplications(@Args('filters', { nullable: true }) filters?: ApplicationFiltersInput) {
    try {
      return await this.instructorVerificationService.getAllApplications(filters);
    } catch (error) {
      throw new Error(`Failed to get applications: ${error.message}`);
    }
  }

  @Query(() => [InstructorVerification], { name: 'getSubmittedApplications' })
  @Roles(UserRole.ADMIN)
  async getSubmittedApplications(@Args('filters', { nullable: true }) filters?: ApplicationFiltersInput) {
    try {
      return await this.instructorVerificationService.getSubmittedApplications(filters);
    } catch (error) {
      throw new Error(`Failed to get submitted applications: ${error.message}`);
    }
  }

  @Query(() => AdminStats, { name: 'getAdminStats' })
  @Roles(UserRole.ADMIN)
  async getAdminStats() {
    try {
      return await this.instructorVerificationService.getAdminStats();
    } catch (error) {
      throw new Error(`Failed to get admin stats: ${error.message}`);
    }
  }

  @Query(() => InstructorVerification, { name: 'getInstructorApplicationById' })
  @Roles(UserRole.ADMIN)
  async getInstructorApplicationById(@Args('id') id: string) {
    try {
      const application = await this.instructorVerificationService.getInstructorVerification(undefined, id);
      return application;
    } catch (error) {
      throw new Error(`Failed to get application: ${error.message}`);
    }
  }



  // =============================================================================
  // MUTATIONS
  // =============================================================================

  @Mutation(() => VerificationResponse, { name: 'createInstructorVerification' })
  async createInstructorVerification(
    @Args('input') input: CreateInstructorVerificationInput,
    @GetUser() user?: any,
  ) {
    try {
      console.log("input", input);
      console.log("user hello workd", user);
      const verification = await this.instructorVerificationService.createInstructorVerification(
        input.userId,
        input.metadata,
      );

      return {
        success: true,
        message: 'Instructor verification created successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'updateInstructorVerification' })
  async updateInstructorVerification(
    @Args('input') input: UpdateInstructorVerificationInput,
    @GetUser() user?: any,
  ) {
    try {
      const verification = await this.instructorVerificationService.updateInstructorVerification(
        input.id,
        {
          personalInfo: input.personalInfo,
          professionalBackground: input.professionalBackground,
          teachingInformation: input.teachingInformation,
          documents: input.documents,
          consents: input.consents,
          metadata: input.metadata,
        },
      );

      return {
        success: true,
        message: 'Instructor verification updated successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'submitInstructorVerification' })
  async submitInstructorVerification(
    @Args('input') input: SubmitInstructorVerificationInput,
    @GetUser() user?: any,
  ) {
    try {
      const verification = await this.instructorVerificationService.submitInstructorVerification(
        input.id,
        input.consents,
      );

      return {
        success: true,
        message: 'Instructor verification submitted successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'saveVerificationDraft' })
  async saveVerificationDraft(
    @Args('input') input: SaveVerificationDraftInput,
    @GetUser() user?: any,
  ) {
    try {
      const verification = await this.instructorVerificationService.saveVerificationDraft(
        input.id,
        input.draftData,
      );

      return {
        success: true,
        message: 'Verification draft saved successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => DocumentUploadResponse, { name: 'addDocumentUrl' })
  async addDocumentUrl(
    @Args('input') input: AddDocumentUrlInput,
    @GetUser() user?: any,
  ) {
    try {
      const document = await this.instructorVerificationService.addDocumentUrl(
        input.verificationId,
        {
          documentType: input.documentType,
          fileUrl: input.fileUrl,
          fileName: input.fileName,
          originalName: input.originalName,
          fileSize: input.fileSize,
          mimeType: input.mimeType,
          metadata: input.metadata,
        },
      );

      return {
        success: true,
        message: 'Document URL added successfully',
        document,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        document: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'deleteVerificationDocument' })
  async deleteVerificationDocument(
    @Args('input') input: DeleteVerificationDocumentInput,
    @GetUser() user?: any,
  ) {
    try {
      await this.instructorVerificationService.deleteVerificationDocument(
        input.verificationId,
        input.documentId,
      );

      return {
        success: true,
        message: 'Document deleted successfully',
        data: null,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'deleteInstructorVerification' })
  async deleteInstructorVerification(
    @Args('id') id: string,
    @GetUser() user?: any,
  ) {
    try {
      const result = await this.instructorVerificationService.deleteInstructorVerification(id);

      return {
        success: true,
        message: 'Instructor verification deleted successfully',
        data: null,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'updatePersonalInfo' })
  async updatePersonalInfo(
    @Args('input') input: UpdatePersonalInfoInput,
    @GetUser() user?: any,
  ) {
    try {
      const verification = await this.instructorVerificationService.updateInstructorVerification(
        input.verificationId,
        { personalInfo: input.personalInfo },
      );

      return {
        success: true,
        message: 'Personal information updated successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'updateProfessionalBackground' })
  async updateProfessionalBackground(
    @Args('input') input: UpdateProfessionalBackgroundInput,
    @GetUser() user?: any,
  ) {
    try {
      const verification = await this.instructorVerificationService.updateInstructorVerification(
        input.verificationId,
        { professionalBackground: input.professionalBackground },
      );

      return {
        success: true,
        message: 'Professional background updated successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'updateTeachingInformation' })
  async updateTeachingInformation(
    @Args('input') input: UpdateTeachingInformationInput,
    @GetUser() user?: any,
  ) {
    try {
      const verification = await this.instructorVerificationService.updateInstructorVerification(
        input.verificationId,
        { teachingInformation: input.teachingInformation },
      );

      return {
        success: true,
        message: 'Teaching information updated successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  // =============================================================================
  // AI VERIFICATION MUTATIONS
  // =============================================================================

  @Mutation(() => InstructorAIVerification, { name: 'createAIVerification' })
  @Roles(UserRole.ADMIN)
  async createAIVerification(
    @Args('input') input: CreateAIVerificationInput,
    @GetUser() user?: any,
  ) {
    try {
      return await this.instructorVerificationService.triggerAIVerification(input.applicationId);
    } catch (error) {
      throw new Error(`Failed to create AI verification: ${error.message}`);
    }
  }

  // =============================================================================
  // MANUAL REVIEW MUTATIONS
  // =============================================================================

  @Mutation(() => InstructorManualReview, { name: 'createManualReview' })
  @Roles(UserRole.ADMIN)
  async createManualReview(
    @Args('input') input: CreateManualReviewInput,
    @GetUser() user?: any,
  ) {
    try {
      return await this.instructorVerificationService.createManualReview({
        ...input,
        reviewerId: user.id,
      });
    } catch (error) {
      throw new Error(`Failed to create manual review: ${error.message}`);
    }
  }

  // =============================================================================
  // INTERVIEW MUTATIONS
  // =============================================================================

  @Mutation(() => InstructorInterview, { name: 'createInterview' })
  @Roles(UserRole.ADMIN)
  async createInterview(
    @Args('input') input: CreateInterviewInput,
    @GetUser() user?: any,
  ) {
    try {
      return await this.instructorVerificationService.createInterview({
        ...input,
        interviewerId: user.id,
      });
    } catch (error) {
      throw new Error(`Failed to create interview: ${error.message}`);
    }
  }

  @Mutation(() => InstructorInterview, { name: 'updateInterview' })
  @Roles(UserRole.ADMIN)
  async updateInterview(
    @Args('input') input: UpdateInterviewInput,
    @GetUser() user?: any,
  ) {
    try {
      return await this.instructorVerificationService.updateInterview(input.id, {
        actualStartTime: input.actualStartTime,
        actualEndTime: input.actualEndTime,
        communicationScore: input.communicationScore,
        technicalKnowledge: input.technicalKnowledge,
        teachingDemonstration: input.teachingDemonstration,
        culturalFit: input.culturalFit,
        passed: input.passed,
        feedback: input.feedback,
        nextSteps: input.nextSteps,
        recordingUrl: input.recordingUrl,
        recordingConsent: input.recordingConsent,
      });
    } catch (error) {
      throw new Error(`Failed to update interview: ${error.message}`);
    }
  }

  // =============================================================================
  // ADMIN MUTATIONS
  // =============================================================================

  @Mutation(() => VerificationResponse, { name: 'updateApplicationStatus' })
  @Roles(UserRole.ADMIN)
  async updateApplicationStatus(
    @Args('applicationId') applicationId: string,
    @Args('status') status: ApplicationStatus,
    @GetUser() user?: any,
    @Args('reason', { nullable: true }) reason?: string,
  ) {
    try {
      const verification = await this.instructorVerificationService.updateApplicationStatus(
        applicationId,
        status,
        reason,
        user.id,
      );

      return {
        success: true,
        message: 'Application status updated successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  // =============================================================================
  // ADMIN REVIEW MUTATIONS
  // =============================================================================

  @Mutation(() => VerificationResponse, { name: 'startApplicationReview' })
  @Roles(UserRole.ADMIN)
  async startApplicationReview(
    @Args('input') input: StartReviewInput,
    @GetUser() user?: any,
  ) {
    try {
      const verification = await this.instructorVerificationService.startApplicationReview(
        input.applicationId,
        user.id,
      );

      return {
        success: true,
        message: 'Application review started successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => ApplicationDocument, { name: 'reviewDocument' })
  @Roles(UserRole.ADMIN)
  async reviewDocument(
    @Args('input') input: ReviewDocumentInput,
    @GetUser() user?: any,
  ) {
    try {
      return await this.instructorVerificationService.reviewDocument(
        input.documentId,
        input.verificationStatus,
        user.id,
        input.notes,
      );
    } catch (error) {
      throw new Error(`Failed to review document: ${error.message}`);
    }
  }

  @Mutation(() => VerificationResponse, { name: 'approveApplication' })
  @Roles(UserRole.ADMIN)
  async approveApplication(
    @Args('input') input: ApproveApplicationInput,
    @GetUser() user?: any,
  ) {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated or user ID not found');
      }

      const verification = await this.instructorVerificationService.updateApplicationStatus(
        input.applicationId,
        ApplicationStatus.APPROVED,
        input.notes,
        user.id,
      );

      return {
        success: true,
        message: 'Application approved successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'rejectApplication' })
  @Roles(UserRole.ADMIN)
  async rejectApplication(
    @Args('input') input: RejectApplicationInput,
    @GetUser() user?: any,
  ) {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated or user ID not found');
      }

      const verification = await this.instructorVerificationService.rejectApplication(
        input.applicationId,
        input.reason,
        user.id,
        input.requiresResubmission,
      );

      return {
        success: true,
        message: 'Application rejected successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }

  @Mutation(() => VerificationResponse, { name: 'requestMoreInformation' })
  @Roles(UserRole.ADMIN)
  async requestMoreInformation(
    @Args('input') input: RequestMoreInfoInput,
    @GetUser() user?: any,
  ) {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated or user ID not found');
      }

      const deadline = input.deadline ? new Date(input.deadline) : undefined;
      const verification = await this.instructorVerificationService.requestMoreInformation(
        input.applicationId,
        input.requiredInfo,
        user.id,
        deadline,
      );

      return {
        success: true,
        message: 'More information requested successfully',
        data: verification,
        errors: null,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null,
        errors: [error.message],
      };
    }
  }
}
