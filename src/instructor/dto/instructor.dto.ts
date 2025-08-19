import { InputType, Field, Int, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

// =============================================================================
// CREATE INSTRUCTOR PROFILE INPUT
// =============================================================================

@InputType()
export class CreateInstructorProfileInput {
  @Field()
  userId: string;

  @Field(() => GraphQLJSON)
  applicationData: any;
}

// =============================================================================
// UPDATE INSTRUCTOR PROFILE INPUT
// =============================================================================

@InputType()
export class UpdateInstructorProfileInput {
  // Professional Information
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  shortBio?: string;

  @Field(() => [String], { nullable: true })
  expertise?: string[];

  @Field(() => [String], { nullable: true })
  qualifications?: string[];

  @Field(() => Int, { nullable: true })
  experience?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  socialLinks?: any;

  @Field({ nullable: true })
  personalWebsite?: string;

  @Field({ nullable: true })
  linkedinProfile?: string;

  // Teaching Specialization
  @Field(() => [String], { nullable: true })
  subjectsTeaching?: string[];

  @Field(() => [String], { nullable: true })
  teachingCategories?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  languagesSpoken?: any;

  @Field({ nullable: true })
  teachingStyle?: string;

  @Field({ nullable: true })
  targetAudience?: string;

  @Field({ nullable: true })
  teachingMethodology?: string;

  // Teaching Availability
  @Field({ nullable: true })
  isAcceptingStudents?: boolean;

  @Field(() => Int, { nullable: true })
  maxStudentsPerCourse?: number;

  @Field(() => GraphQLJSON, { nullable: true })
  preferredSchedule?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  availableTimeSlots?: any;

  // Financial Information
  @Field(() => GraphQLJSON, { nullable: true })
  payoutSettings?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  taxInformation?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  paymentPreferences?: any;

  @Field(() => Float, { nullable: true })
  revenueSharing?: number;

  // Marketing & Promotion
  @Field({ nullable: true })
  isPromotionEligible?: boolean;

  @Field({ nullable: true })
  marketingConsent?: boolean;

  @Field({ nullable: true })
  featuredInstructor?: boolean;

  @Field(() => [String], { nullable: true })
  badgesEarned?: string[];
}

// =============================================================================
// INSTRUCTOR SEARCH FILTERS INPUT
// =============================================================================

@InputType()
export class InstructorSearchFiltersInput {
  @Field(() => [String], { nullable: true })
  expertise?: string[];

  @Field(() => [String], { nullable: true })
  teachingCategories?: string[];

  @Field(() => Float, { nullable: true })
  minRating?: number;

  @Field(() => Int, { nullable: true })
  minExperience?: number;

  @Field(() => [String], { nullable: true })
  languages?: string[];

  @Field({ nullable: true })
  isVerified?: boolean;

  @Field({ nullable: true })
  isAcceptingStudents?: boolean;

  @Field({ nullable: true })
  featuredInstructor?: boolean;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;
}

// =============================================================================
// INSTRUCTOR STATISTICS FILTERS INPUT
// =============================================================================

@InputType()
export class InstructorStatsFiltersInput {
  @Field({ nullable: true })
  dateFrom?: string;

  @Field({ nullable: true })
  dateTo?: string;

  @Field({ nullable: true })
  courseStatus?: string;

  @Field({ nullable: true })
  includeArchived?: boolean;
}



// =============================================================================
// UPDATE PROFILE IMAGE INPUT
// =============================================================================

@InputType()
export class UpdateProfileImageInput {
  @Field()
  profileImage: string;
}
