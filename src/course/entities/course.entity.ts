import {
  ObjectType,
  Field,
  Int,
  Float,
  ID,
  registerEnumType,
} from '@nestjs/graphql';
import { UserObject } from '../../user/user.entity'; // Adjust import path as needed
import {
  CourseLevel,
  EnrollmentType,
  ContentType,
  LessonType,
} from '../../../generated/prisma';

// Register all enums at the top level
registerEnumType(CourseLevel, {
  name: 'CourseLevel',
  description: 'The difficulty level of the course',
});

registerEnumType(EnrollmentType, {
  name: 'EnrollmentType',
  description: 'The type of enrollment for the course',
});

registerEnumType(ContentType, {
  name: 'ContentType',
  description: 'The type of content item',
});

registerEnumType(LessonType, {
  name: 'LessonType',
  description: 'The type of lesson',
});



@ObjectType()
export class Section {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  order: number;

  @Field()
  isLocked: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Lesson], { nullable: true })
  lessons?: Lesson[];
}

@ObjectType()
export class ContentItem {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  fileUrl?: string;

  @Field({ nullable: true })
  fileName?: string;

  @Field(() => Int, { nullable: true })
  fileSize?: number;

  @Field({ nullable: true })
  mimeType?: string;

  @Field(() => Int)
  order: number;

  @Field()
  isPublished: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Lesson {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  videoUrl?: string;

  @Field({ nullable: true })
  audioUrl?: string;

  @Field({ nullable: true })
  attachmentUrl?: string;

  @Field(() => [String])
  downloadUrls: string[];

  @Field(() => Int)
  duration: number;

  @Field(() => Int)
  order: number;

  @Field()
  isPreview: boolean;

  @Field()
  isInteractive: boolean;

  @Field()
  hasAIQuiz: boolean;

  @Field({ nullable: true })
  aiSummary?: string;

  @Field({ nullable: true })
  transcription?: string;

  @Field({ nullable: true })
  captions?: string;

  @Field({ nullable: true })
  transcript?: string;

  @Field(() => ContentItem, { nullable: true })
  contentItem?: ContentItem;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Course {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  shortDescription?: string; // Changed from string | null to string | undefined

  @Field()
  category: string;

  @Field({ nullable: true })
  subcategory?: string;

  @Field()
  level: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  trailer?: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  originalPrice?: number;

  @Field()
  currency: string;

  @Field(() => [String])
  objectives: string[];

  @Field(() => [String])
  prerequisites: string[];

  @Field(() => [String])
  whatYouLearn: string[];

  @Field(() => [String])
  seoTags: string[];

  @Field(() => [String])
  marketingTags: string[];

  @Field()
  status: string;

  @Field()
  enrollmentType: string;

  @Field()
  language: string;

  @Field()
  isPublic: boolean;

  @Field()
  certificate: boolean;

  @Field()
  hasAITutor: boolean;

  @Field({ nullable: true })
  aiPersonality?: string;

  @Field(() => Float)
  difficulty: number;

  @Field(() => Int)
  estimatedHours: number;

  @Field(() => Int)
  views: number;

  @Field(() => Float)
  avgRating: number;

  @Field(() => Int)
  totalRatings: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  publishedAt?: Date;

  @Field()
  instructorId: string;

  // Relations
  @Field(() => UserObject, { nullable: true })
  instructor?: UserObject;

  @Field(() => [Section], { nullable: true })
  sections?: Section[];

  @Field(() => [ContentItem], { nullable: true })
  contentItems?: ContentItem[];

  // Calculated fields
  @Field(() => Int, { nullable: true })
  totalLessons?: number;

  @Field(() => Int, { nullable: true })
  totalDuration?: number;

  @Field(() => Int, { nullable: true })
  enrollmentCount?: number;

  @Field(() => Float, { nullable: true })
  completionPercentage?: number;
}


@ObjectType()
export class CourseCreationResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Course, { nullable: true })
  course?: Course;

  @Field(() => [String], { nullable: true })
  errors?: string[];

  // @Field(() => [String], { nullable: true })
  // missingItems?: string[];

  @Field(() => [String], { nullable: true })
  nextSteps?: string[];

  // @Field(() => [String], { nullable: true })
  // recommendations?: string[];

  // @Field(() => Float, { nullable: true })
  // completionPercentage?: number;

  // @Field(() => Boolean, { nullable: true })
  // readyForReview?: boolean;

  // @Field(() => Boolean, { nullable: true })
  // isBasicVersion?: boolean;

  // @Field({ nullable: true })
  // thumbnailUrl?: string;

  // @Field({ nullable: true })
  // trailerUrl?: string;

  // @Field(() => Int, { nullable: true })
  // fileSize?: number;

  // @Field({ nullable: true })
  // fileName?: string;

  // @Field({ nullable: true })
  // estimatedReviewTime?: string;

  // @Field({ nullable: true })
  // publishedAt?: Date;

  // @Field({ nullable: true })
  // courseUrl?: string;

  // @Field({ nullable: true })
  // deletedCourseTitle?: string;

  // @Field(() => Boolean, { nullable: true })
  // isValid?: boolean;
}