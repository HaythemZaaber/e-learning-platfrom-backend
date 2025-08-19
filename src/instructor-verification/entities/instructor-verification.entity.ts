import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { 
  ApplicationStatus, 
  VerificationStatus, 
  DocumentType,
  AIRecommendation,
  ReviewDecision,
  InterviewFormat
} from '@prisma/client';
import { User } from 'src/instructor/entities/instructor.entity';

// =============================================================================
// ENUMS
// =============================================================================

@ObjectType()
export class VerificationStatusEnum {
  @Field()
  DRAFT: string = 'DRAFT';
  
  @Field()
  SUBMITTED: string = 'SUBMITTED';
  
  @Field()
  UNDER_REVIEW: string = 'UNDER_REVIEW';
  
  @Field()
  APPROVED: string = 'APPROVED';
  
  @Field()
  REJECTED: string = 'REJECTED';
  
  @Field()
  WITHDRAWN: string = 'WITHDRAWN';
}

@ObjectType()
export class DocumentTypeEnum {
  @Field()
  IDENTITY_DOCUMENT: string = 'IDENTITY_DOCUMENT';
  
  @Field()
  EDUCATION_CERTIFICATE: string = 'EDUCATION_CERTIFICATE';
  
  @Field()
  PROFESSIONAL_CERTIFICATE: string = 'PROFESSIONAL_CERTIFICATE';
  
  @Field()
  EMPLOYMENT_VERIFICATION: string = 'EMPLOYMENT_VERIFICATION';
  
  @Field()
  PROFILE_PHOTO: string = 'PROFILE_PHOTO';
  
  @Field()
  VIDEO_INTRODUCTION: string = 'VIDEO_INTRODUCTION';
  
  @Field()
  TEACHING_DEMO: string = 'TEACHING_DEMO';
  
  @Field()
  RESUME: string = 'RESUME';
  
  @Field()
  PORTFOLIO: string = 'PORTFOLIO';
  
  @Field()
  OTHER: string = 'OTHER';
}

// =============================================================================
// CORE TYPES
// =============================================================================

// @ObjectType()
// export class User {
//   @Field(() => ID)
//   id: string;

//   @Field()
//   email: string;

//   @Field({ nullable: true })
//   firstName?: string;

//   @Field({ nullable: true })
//   lastName?: string;

//   @Field({ nullable: true })
//   profileImage?: string;
// }





@ObjectType()
export class ApplicationDocument {
  @Field(() => ID)
  id: string;

  @Field()
  applicationId: string;

  @Field(() => String)
  documentType: DocumentType;

  @Field()
  fileName: string;

  @Field()
  originalName: string;

  @Field(() => Int)
  fileSize: number;

  @Field()
  mimeType: string;

  @Field()
  fileUrl: string;

  @Field({ nullable: true })
  thumbnailUrl?: string;

  @Field(() => String)
  verificationStatus: VerificationStatus;

  @Field()
  uploadedAt: Date;

  @Field(() => GraphQLJSON, { nullable: true })
  aiAnalysis?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class InstructorAIVerification {
  @Field(() => ID)
  id: string;

  @Field()
  applicationId: string;

  // Document Verification
  @Field()
  identityVerified: boolean;

  @Field(() => Float, { nullable: true })
  identityConfidence?: number;

  @Field(() => [String])
  identityFlags: string[];

  @Field()
  educationVerified: boolean;

  @Field(() => Float, { nullable: true })
  educationConfidence?: number;

  @Field(() => [String])
  educationFlags: string[];

  @Field()
  experienceVerified: boolean;

  @Field(() => Float, { nullable: true })
  experienceConfidence?: number;

  @Field(() => [String])
  experienceFlags: string[];

  // Content Analysis
  @Field(() => Float, { nullable: true })
  contentQualityScore?: number;

  @Field(() => Float, { nullable: true })
  languageProficiency?: number;

  @Field(() => Float, { nullable: true })
  professionalismScore?: number;

  // Risk Assessment
  @Field(() => Float, { nullable: true })
  riskScore?: number;

  @Field(() => [String])
  riskFactors: string[];

  @Field(() => [String])
  fraudIndicators: string[];

  // AI Recommendations
  @Field(() => Float, { nullable: true })
  overallScore?: number;

  @Field(() => String)
  recommendation: AIRecommendation;

  @Field({ nullable: true })
  recommendationReason?: string;

  // Processing Details
  @Field({ nullable: true })
  verificationProvider?: string;

  @Field(() => Int, { nullable: true })
  processingTime?: number;

  @Field(() => Float, { nullable: true })
  processingCost?: number;

  @Field()
  processedAt: Date;

  // Additional fields for the query
  @Field(() => GraphQLJSON, { nullable: true })
  verificationResults?: any;

  @Field(() => Date, { nullable: true })
  reviewedAt?: Date;
}



@ObjectType()
export class InstructorManualReview {
  @Field(() => ID)
  id: string;

  @Field()
  applicationId: string;

  @Field()
  reviewerId: string;

  // Review Scores (1-10)
  @Field(() => Int, { nullable: true })
  documentationScore?: number;

  @Field(() => Int, { nullable: true })
  experienceScore?: number;

  @Field(() => Int, { nullable: true })
  communicationScore?: number;

  @Field(() => Int, { nullable: true })
  technicalScore?: number;

  @Field(() => Int, { nullable: true })
  professionalismScore?: number;

  @Field(() => Float, { nullable: true })
  overallScore?: number;

  // Review Details
  @Field({ nullable: true })
  strengths?: string;

  @Field({ nullable: true })
  weaknesses?: string;

  @Field({ nullable: true })
  concerns?: string;

  @Field({ nullable: true })
  recommendations?: string;

  @Field(() => String)
  decision: ReviewDecision;

  @Field({ nullable: true })
  decisionReason?: string;

  @Field(() => [String])
  conditionalRequirements: string[];

  @Field()
  requiresInterview: boolean;

  @Field()
  requiresAdditionalDocs: boolean;

  @Field(() => [String])
  requiredDocuments: string[];

  @Field()
  reviewedAt: Date;
}

@ObjectType()
export class InstructorInterview {
  @Field(() => ID)
  id: string;

  @Field()
  applicationId: string;

  @Field()
  interviewerId: string;

  @Field()
  scheduledAt: Date;

  @Field({ nullable: true })
  actualStartTime?: Date;

  @Field({ nullable: true })
  actualEndTime?: Date;

  @Field(() => String)
  format: InterviewFormat;

  @Field({ nullable: true })
  meetingLink?: string;

  @Field({ nullable: true })
  interviewNotes?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field({ nullable: true })
  status?: string;

  @Field(() => Int, { nullable: true })
  communicationScore?: number;

  @Field(() => Int, { nullable: true })
  technicalKnowledge?: number;

  @Field(() => Int, { nullable: true })
  teachingDemonstration?: number;

  @Field(() => Int, { nullable: true })
  culturalFit?: number;

  @Field(() => Float, { nullable: true })
  overallScore?: number;

  @Field({ nullable: true })
  passed?: boolean;

  @Field({ nullable: true })
  feedback?: string;

  @Field({ nullable: true })
  nextSteps?: string;

  @Field({ nullable: true })
  recordingUrl?: string;

  @Field()
  recordingConsent: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}


@ObjectType()
export class InstructorVerification {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => String)
  status: ApplicationStatus;

  @Field(() => GraphQLJSON, { nullable: true })
  personalInfo?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  professionalBackground?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  teachingInformation?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  documents?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  consents?: any;

  @Field(() => Date, { nullable: true })
  submittedAt?: Date;

  @Field(() => Date, { nullable: true })
  lastSavedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Key extracted fields
  @Field()
  fullName: string;

  @Field()
  phoneNumber: string;

  @Field({ nullable: true })
  nationality?: string;

  @Field({ nullable: true })
  currentJobTitle?: string;

  @Field(() => Int)
  yearsOfExperience: number;

  @Field(() => [String])
  subjectsToTeach: string[];

  @Field()
  teachingMotivation: string;

  // Application metadata
  @Field(() => Int)
  currentStep: number;

  @Field(() => Int)
  completionScore: number;

  // Relations
  @Field(() => [ApplicationDocument], { nullable: true })
  applicationDocuments?: ApplicationDocument[];

  @Field(() => InstructorAIVerification, { nullable: true })
  aiVerification?: InstructorAIVerification;

  @Field(() => InstructorManualReview, { nullable: true })
  manualReview?: InstructorManualReview;

  @Field(() => InstructorInterview, { nullable: true })
  interview?: InstructorInterview;

  // User relation
  @Field(() => User, { nullable: true })
  user?: User;
}

// =============================================================================
// RESPONSE TYPES
// =============================================================================

@ObjectType()
export class VerificationResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => InstructorVerification, { nullable: true })
  data?: InstructorVerification;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class DocumentUploadResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => ApplicationDocument, { nullable: true })
  document?: ApplicationDocument;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class VerificationStatusResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => InstructorVerification, { nullable: true })
  data?: InstructorVerification;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}



@ObjectType()
export class AdminStats {
  @Field(() => Int)
  totalApplications: number;

  @Field(() => Int)
  pendingReview: number;

  @Field(() => Int)
  underReview: number;

  @Field(() => Int)
  approved: number;

  @Field(() => Int)
  rejected: number;

  @Field(() => Int)
  requiresMoreInfo: number;

  @Field(() => Int)
  averageReviewTime: number; // in hours

  @Field(() => Int)
  applicationsThisWeek: number;

  @Field(() => Int)
  applicationsThisMonth: number;
}
