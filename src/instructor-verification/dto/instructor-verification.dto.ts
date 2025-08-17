import { InputType, Field, Int } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import {
  ApplicationStatus,
  VerificationStatus,
  DocumentType,
  AIRecommendation,
  ReviewDecision,
  InterviewFormat
} from '@prisma/client';

// =============================================================================
// INPUT TYPES
// =============================================================================

@InputType()
export class CreateInstructorVerificationInput {
  @Field()
  userId: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

@InputType()
export class UpdateInstructorVerificationInput {
  @Field()
  id: string;

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

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

@InputType()
export class SubmitInstructorVerificationInput {
  @Field()
  id: string;

  @Field(() => GraphQLJSON)
  consents: {
    backgroundCheck: boolean;
    dataProcessing: boolean;
    termOfService: boolean;
    privacyPolicy: boolean;
    contentGuidelines: boolean;
    codeOfConduct: boolean;
  };

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

@InputType()
export class SaveVerificationDraftInput {
  @Field()
  id: string;

  @Field(() => GraphQLJSON)
  draftData: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

@InputType()
export class AddDocumentUrlInput {
  @Field()
  verificationId: string;

  @Field(() => String)
  documentType: DocumentType;

  @Field()
  fileUrl: string;

  @Field()
  fileName: string;

  @Field()
  originalName: string;

  @Field(() => Int)
  fileSize: number;

  @Field()
  mimeType: string;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;
}

@InputType()
export class DeleteVerificationDocumentInput {
  @Field()
  verificationId: string;

  @Field()
  documentId: string;
}

@InputType()
export class UpdatePersonalInfoInput {
  @Field()
  verificationId: string;

  @Field(() => GraphQLJSON)
  personalInfo: any;
}

@InputType()
export class UpdateProfessionalBackgroundInput {
  @Field()
  verificationId: string;

  @Field(() => GraphQLJSON)
  professionalBackground: any;
}

@InputType()
export class UpdateTeachingInformationInput {
  @Field()
  verificationId: string;

  @Field(() => GraphQLJSON)
  teachingInformation: any;
}

@InputType()
export class CreateAIVerificationInput {
  @Field()
  applicationId: string;

  @Field(() => String, { nullable: true })
  verificationProvider?: string;
}

@InputType()
export class CreateManualReviewInput {
  @Field()
  applicationId: string;

  @Field()
  reviewerId: string;

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

  @Field(() => [String], { nullable: true })
  conditionalRequirements?: string[];

  @Field({ nullable: true })
  requiresInterview?: boolean;

  @Field({ nullable: true })
  requiresAdditionalDocs?: boolean;

  @Field(() => [String], { nullable: true })
  requiredDocuments?: string[];
}

@InputType()
export class CreateInterviewInput {
  @Field()
  applicationId: string;

  @Field()
  interviewerId: string;

  @Field()
  scheduledAt: Date;

  @Field(() => String)
  format: InterviewFormat;

  @Field({ nullable: true })
  meetingLink?: string;

  @Field({ nullable: true })
  interviewNotes?: string;
}

@InputType()
export class EmergencyContactInput {
  @Field()
  name: string;

  @Field()
  relationship: string;

  @Field()
  phoneNumber: string;

  @Field({ nullable: true })
  email?: string;
}

@InputType()
export class UpdateInterviewInput {
  @Field()
  id: string;

  @Field({ nullable: true })
  actualStartTime?: Date;

  @Field({ nullable: true })
  actualEndTime?: Date;

  @Field(() => Int, { nullable: true })
  communicationScore?: number;

  @Field(() => Int, { nullable: true })
  technicalKnowledge?: number;

  @Field(() => Int, { nullable: true })
  teachingDemonstration?: number;

  @Field(() => Int, { nullable: true })
  culturalFit?: number;

  @Field({ nullable: true })
  passed?: boolean;

  @Field({ nullable: true })
  feedback?: string;

  @Field({ nullable: true })
  nextSteps?: string;

  @Field({ nullable: true })
  recordingUrl?: string;

  @Field({ nullable: true })
  recordingConsent?: boolean;
}

@InputType()
export class ApplicationFiltersInput {
  @Field(() => String, { nullable: true })
  status?: string;

  @Field({ nullable: true })
  search?: string;

  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;
}

// =============================================================================
// PERSONAL INFO TYPES
// =============================================================================

@InputType()
export class PersonalInfoInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  phoneNumber: string;

  @Field()
  dateOfBirth: string;

  @Field()
  nationality: string;

  @Field()
  streetAddress: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  postalCode: string;

  @Field()
  country: string;

  @Field()
  timezone: string;

  @Field()
  primaryLanguage: string;

  @Field(() => [LanguageProficiencyInput])
  languagesSpoken: LanguageProficiencyInput[];

  @Field(() => EmergencyContactInput)
  emergencyContact: EmergencyContactInput;
}

@InputType()
export class LanguageProficiencyInput {
  @Field()
  language: string;

  @Field()
  proficiency: 'basic' | 'intermediate' | 'advanced' | 'native';

  @Field()
  canTeachIn: boolean;
}



// =============================================================================
// PROFESSIONAL BACKGROUND TYPES
// =============================================================================

@InputType()
export class ProfessionalBackgroundInput {
  @Field({ nullable: true })
  currentJobTitle?: string;

  @Field({ nullable: true })
  currentEmployer?: string;

  @Field()
  employmentType: 'full_time' | 'part_time' | 'freelance' | 'self_employed' | 'unemployed' | 'student';

  @Field()
  workLocation: string;

  @Field(() => Int)
  yearsOfExperience: number;

  @Field(() => [EducationInput])
  education: EducationInput[];

  @Field(() => [ExperienceInput])
  experience: ExperienceInput[];

  @Field(() => [ReferenceInput])
  references: ReferenceInput[];
}


@InputType()
export class DayAvailabilityInput {
  @Field()
  available: boolean;

  @Field(() => [TimeSlotInput])
  timeSlots: TimeSlotInput[];
}

@InputType()
export class TimeSlotInput {
  @Field()
  start: string;

  @Field()
  end: string;
}

@InputType()
export class EducationInput {
  @Field()
  institution: string;

  @Field()
  degree: string;

  @Field()
  field: string;

  @Field()
  startYear: string;

  @Field()
  endYear: string;

  @Field({ nullable: true })
  gpa?: string;

  @Field({ nullable: true })
  honors?: string;

  @Field()
  description: string;
}

@InputType()
export class ExperienceInput {
  @Field()
  company: string;

  @Field()
  position: string;

  @Field()
  startDate: string;

  @Field()
  endDate: string;

  @Field()
  current: boolean;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  employmentType?: string;

  @Field()
  description: string;

  @Field(() => [String], { nullable: true })
  achievements?: string[];
}

@InputType()
export class ReferenceInput {
  @Field()
  name: string;

  @Field()
  position: string;

  @Field()
  company: string;

  @Field()
  email: string;

  @Field()
  phone: string;

  @Field()
  relationship: string;

  @Field({ nullable: true })
  yearsKnown?: string;

  @Field({ nullable: true })
  notes?: string;

  @Field()
  contactPermission: boolean;
}

// =============================================================================
// TEACHING INFORMATION TYPES
// =============================================================================

@InputType()
export class WeeklyAvailabilityInput {
  @Field(() => DayAvailabilityInput)
  monday: DayAvailabilityInput;

  @Field(() => DayAvailabilityInput)
  tuesday: DayAvailabilityInput;

  @Field(() => DayAvailabilityInput)
  wednesday: DayAvailabilityInput;

  @Field(() => DayAvailabilityInput)
  thursday: DayAvailabilityInput;

  @Field(() => DayAvailabilityInput)
  friday: DayAvailabilityInput;

  @Field(() => DayAvailabilityInput)
  saturday: DayAvailabilityInput;

  @Field(() => DayAvailabilityInput)
  sunday: DayAvailabilityInput;
}


@InputType()
export class TeachingInformationInput {
  @Field(() => [SubjectToTeachInput])
  subjectsToTeach: SubjectToTeachInput[];

  @Field()
  hasTeachingExperience: boolean;

  @Field(() => [TeachingExperienceInput])
  teachingExperience: TeachingExperienceInput[];

  @Field()
  teachingMotivation: string;

  @Field()
  teachingPhilosophy: string;

  @Field(() => [String])
  targetAudience: string[];

  @Field()
  teachingStyle: string;

  @Field()
  teachingMethodology: string;

  @Field(() => [String])
  preferredFormats: string[];

  @Field()
  preferredClassSize: string;

  @Field(() => WeeklyAvailabilityInput)
  weeklyAvailability: WeeklyAvailabilityInput;
}

@InputType()
export class SubjectToTeachInput {
  @Field()
  subject: string;

  @Field()
  category: string;

  @Field()
  level: 'beginner' | 'intermediate' | 'advanced' | 'all_levels';

  @Field(() => Int)
  experienceYears: number;

  @Field(() => Int)
  confidence: 1 | 2 | 3 | 4 | 5;
}

@InputType()
export class TeachingExperienceInput {
  @Field()
  role: string;

  @Field()
  institution: string;

  @Field()
  subject: string;

  @Field()
  level: string;

  @Field()
  startDate: string;

  @Field({ nullable: true })
  endDate?: string;

  @Field()
  isCurrent: boolean;

  @Field()
  description: string;

  @Field(() => Int, { nullable: true })
  studentsCount?: number;

  @Field(() => [String], { nullable: true })
  achievements?: string[];
}



// =============================================================================
// CONSENT TYPES
// =============================================================================

@InputType()
export class ConsentInput {
  @Field()
  backgroundCheck: boolean;

  @Field()
  dataProcessing: boolean;

  @Field()
  termOfService: boolean;

  @Field()
  privacyPolicy: boolean;

  @Field()
  contentGuidelines: boolean;

  @Field()
  codeOfConduct: boolean;
}
