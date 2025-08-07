import { InputType, Field, ObjectType, Float, Int } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsEnum,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  CourseLevel,
  EnrollmentType,
  ContentType,
  LectureType,
} from '../../../generated/prisma';
import GraphQLJSON from 'graphql-type-json';
import { Course } from '../entities/course.entity';

// ==============================================
// CONTENT CREATION DTOs
// ==============================================

@InputType()
export class ContentItemInput {
  @Field()
  @IsString()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => ContentType)
  @IsEnum(ContentType)
  type: ContentType;

  @Field({ nullable: true })
  @IsOptional()
  // @IsUrl()
  @IsString()
  fileUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  fileName?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  mimeType?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  contentData?: any;

  @Field(() => Int, { defaultValue: 0 })
  @IsNumber()
  order: number;
}

@InputType()
export class LectureInput {
  @Field()
  @IsString()
  id: string;

  @Field()
  @IsString()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  status?: string;

  @Field(() => LectureType)
  @IsEnum(LectureType)
  type: LectureType;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  content?: string;

  @Field(() => ContentItemInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContentItemInput)
  contentItem?: ContentItemInput;

  @Field(() => GraphQLJSON, { nullable: true })
  @IsOptional()
  settings?: any;
}

@InputType()
export class SectionInput {
  @Field()
  @IsString()
  id: string;

  @Field()
  @IsString()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field(() => [LectureInput], { defaultValue: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LectureInput)
  lectures: LectureInput[];
}

// ==============================================
// COURSE SETTINGS DTOs
// ==============================================

@InputType()
export class AccessibilitySettingsInput {
  @Field({ defaultValue: false })
  @IsBoolean()
  captions: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  transcripts: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  audioDescription: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  signLanguage?: boolean;
}

@InputType()
export class PricingSettingsInput {
  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  amount: number;

  @Field({ defaultValue: 'USD' })
  @IsString()
  currency: string;

  @Field(() => Int, { defaultValue: 0 })
  @IsNumber()
  discountPercentage: number;

  @Field({ defaultValue: false })
  @IsBoolean()
  earlyBirdDiscount: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  installmentPlans: boolean;
}

@InputType()
export class EnrollmentSettingsInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  maxStudents?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  enrollmentDeadline?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  prerequisitesCourse?: string;

  @Field({ defaultValue: 'none' })
  @IsString()
  ageRestriction: string;
}

@InputType()
export class CommunicationSettingsInput {
  @Field({ defaultValue: true })
  @IsBoolean()
  discussionForum: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  directMessaging: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  liveChat: boolean;

  @Field({ defaultValue: true })
  @IsBoolean()
  announcementEmails: boolean;
}

@InputType()
export class CompletionSettingsInput {
  @Field(() => Int, { defaultValue: 70 })
  @IsNumber()
  passingGrade: number;

  @Field({ defaultValue: true })
  @IsBoolean()
  allowRetakes: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @Field({ defaultValue: 'default' })
  @IsString()
  certificateTemplate: string;
}

@InputType()
export class ContentAccessSettingsInput {
  @Field({ defaultValue: true })
  @IsBoolean()
  downloadableResources: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  offlineAccess: boolean;

  @Field({ defaultValue: true })
  @IsBoolean()
  mobileOptimized: boolean;

  @Field({ defaultValue: false })
  @IsBoolean()
  printableMaterials: boolean;
}

@InputType()
export class MarketingSettingsInput {
  @Field({ defaultValue: false })
  @IsBoolean()
  featuredCourse: boolean;

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsString({ each: true })
  courseTags: string[];

  @Field({ defaultValue: 'beginner' })
  @IsString()
  difficultyRating: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  estimatedDuration?: string;
}

@InputType()
export class CourseSettingsInput {
  @Field({ defaultValue: true })
  @IsBoolean()
  isPublic: boolean;

  @Field(() => EnrollmentType, { defaultValue: EnrollmentType.FREE })
  @IsEnum(EnrollmentType)
  enrollmentType: EnrollmentType;

  @Field({ defaultValue: 'en' })
  @IsString()
  language: string;

  @Field({ defaultValue: false })
  @IsBoolean()
  certificate: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsString({ each: true })
  seoTags: string[];

  @Field(() => AccessibilitySettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccessibilitySettingsInput)
  accessibility?: AccessibilitySettingsInput;

  @Field(() => PricingSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingSettingsInput)
  pricing?: PricingSettingsInput;

  @Field(() => EnrollmentSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => EnrollmentSettingsInput)
  enrollment?: EnrollmentSettingsInput;

  @Field(() => CommunicationSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommunicationSettingsInput)
  communication?: CommunicationSettingsInput;

  @Field(() => CompletionSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompletionSettingsInput)
  completion?: CompletionSettingsInput;

  @Field(() => ContentAccessSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContentAccessSettingsInput)
  content?: ContentAccessSettingsInput;

  @Field(() => MarketingSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketingSettingsInput)
  marketing?: MarketingSettingsInput;
}

// ==============================================
// MAIN COURSE CREATION DTO
// ==============================================

@InputType()
export class CreateCourseInput {
  @Field()
  @IsString()
  title: string;

  @Field()
  @IsString()
  description: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @Field()
  @IsString()
  category: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @Field(() => CourseLevel, { defaultValue: CourseLevel.BEGINNER })
  @IsEnum(CourseLevel)
  level: CourseLevel;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  // @IsUrl()
  thumbnail?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  trailer?: string;

  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  price: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @Field({ defaultValue: 'USD' })
  @IsString()
  currency: string;

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsString({ each: true })
  objectives: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsString({ each: true })
  prerequisites: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsString({ each: true })
  whatYouLearn: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsString({ each: true })
  seoTags: string[];

  @Field(() => [String], { defaultValue: [] })
  @IsArray()
  @IsString({ each: true })
  marketingTags: string[];

  @Field(() => [SectionInput], { defaultValue: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionInput)
  sections: SectionInput[];

  @Field(() => CourseSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseSettingsInput)
  settings?: CourseSettingsInput;

  @Field(() => [ContentItemInput], { defaultValue: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentItemInput)
  additionalContent: ContentItemInput[];

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  hasLiveSessions?: boolean;

  @Field({ defaultValue: false })
  @IsOptional()
  @IsBoolean()
  hasRecordings?: boolean;
}

// ==============================================
// DRAFT OPERATIONS
// ==============================================

@InputType()
export class SaveCourseDraftInput {
  @Field(() => GraphQLJSON)
  @IsOptional()
  draftData: any;

  @Field(() => Int, { defaultValue: 0 })
  @IsNumber()
  currentStep: number;

  @Field(() => Int, { defaultValue: 0 })
  @IsNumber()
  completionScore: number;
}

@InputType()
export class UpdateCourseInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @Field(() => CourseLevel, { nullable: true })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  // @IsUrl()
  thumbnail?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  trailer?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatYouLearn?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoTags?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marketingTags?: string[];

  @Field(() => [SectionInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionInput)
  sections?: SectionInput[];

  @Field(() => CourseSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CourseSettingsInput)
  settings?: CourseSettingsInput;

  @Field(() => [ContentItemInput], { nullable: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentItemInput)
  additionalContent?: ContentItemInput[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasLiveSessions?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasRecordings?: boolean;
}

@InputType()
export class UpdateCourseBasicInfoInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  subcategory?: string;

  @Field(() => CourseLevel, { nullable: true })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  // @IsUrl()
  thumbnail?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  trailer?: string;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  price?: number;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @IsNumber()
  originalPrice?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  currency?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objectives?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  whatYouLearn?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoTags?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  marketingTags?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasLiveSessions?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasRecordings?: boolean;
}

@InputType()
export class UpdateCourseSettingsInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @Field(() => EnrollmentType, { nullable: true })
  @IsOptional()
  @IsEnum(EnrollmentType)
  enrollmentType?: EnrollmentType;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  certificate?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  seoDescription?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  seoTags?: string[];

  @Field(() => AccessibilitySettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => AccessibilitySettingsInput)
  accessibility?: AccessibilitySettingsInput;

  @Field(() => PricingSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PricingSettingsInput)
  pricing?: PricingSettingsInput;

  @Field(() => EnrollmentSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => EnrollmentSettingsInput)
  enrollment?: EnrollmentSettingsInput;

  @Field(() => CommunicationSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommunicationSettingsInput)
  communication?: CommunicationSettingsInput;

  @Field(() => CompletionSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompletionSettingsInput)
  completion?: CompletionSettingsInput;

  @Field(() => ContentAccessSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => ContentAccessSettingsInput)
  content?: ContentAccessSettingsInput;

  @Field(() => MarketingSettingsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => MarketingSettingsInput)
  marketing?: MarketingSettingsInput;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasLiveSessions?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  hasRecordings?: boolean;
}

// ==============================================
// FILTERS AND RESPONSES
// ==============================================

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  @IsNumber()
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  @IsNumber()
  limit: number;
}

@InputType()
export class PriceRangeInput {
  @Field(() => Float, { defaultValue: 0 })
  @IsNumber()
  min: number;

  @Field(() => Float, { defaultValue: 200 })
  @IsNumber()
  max: number;
}

@InputType()
export class CourseFiltersInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @Field(() => PriceRangeInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => PriceRangeInput)
  priceRange?: PriceRangeInput;

  @Field(() => [CourseLevel], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsEnum(CourseLevel, { each: true })
  levels?: CourseLevel[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  durations?: string[];

  @Field(() => [Float], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  ratings?: number[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  showFeatured?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field(() => CourseLevel, { nullable: true })
  @IsOptional()
  @IsEnum(CourseLevel)
  level?: CourseLevel;

  @Field(() => EnrollmentType, { nullable: true })
  @IsOptional()
  @IsEnum(EnrollmentType)
  enrollmentType?: EnrollmentType;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

@ObjectType()
export class PaginatedCoursesResponse {
  @Field(() => [Course])
  courses: Course[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Boolean)
  hasNextPage: boolean;

  @Field(() => Boolean)
  hasPreviousPage: boolean;
}

@ObjectType()
export class CourseCreationResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => GraphQLJSON, { nullable: true })
  course?: any;

  @Field(() => Int, { nullable: true })
  completionPercentage?: number;

  @Field(() => [String], { nullable: true })
  errors?: string[];

  @Field(() => [String], { nullable: true })
  warnings?: string[];
}

@ObjectType()
export class CourseDraftResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => GraphQLJSON, { nullable: true })
  draftData?: any;

  @Field(() => Int, { nullable: true })
  currentStep?: number;

  @Field(() => Int, { nullable: true })
  completionScore?: number;
}
