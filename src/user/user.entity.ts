import { ObjectType, Field, ID, Float, Int } from '@nestjs/graphql';
import {
  UserRole,
  Gender,
  LearningStyle,
  InstructorStatus,
} from '@prisma/client';

@ObjectType()
export class UserObject {
  @Field(() => ID)
  id: string;

  @Field({ nullable: true })
  clerkId?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  username?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  profileImage?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  zip?: string;

  @Field({ nullable: true })
  country?: string;

  @Field({ nullable: true })
  dateOfBirth?: Date;

  @Field(() => Gender, { nullable: true })
  gender?: Gender;

  @Field({ nullable: true })
  timezone?: string;

  @Field({ nullable: true })
  locale?: string;

  @Field(() => UserRole, { nullable: true })
  role?: UserRole;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  isEmailVerified?: boolean;

  @Field({ nullable: true })
  isPhoneVerified?: boolean;

  @Field(() => InstructorStatus, { nullable: true })
  instructorStatus?: InstructorStatus;

  @Field({ nullable: true })
  instructorBio?: string;

  @Field(() => [String], { nullable: true })
  expertise?: string[];

  @Field(() => [String], { nullable: true })
  qualifications?: string[];

  @Field(() => Int, { nullable: true })
  experience?: number;

  @Field(() => Float, { nullable: true })
  teachingRating?: number;

  @Field(() => Int, { nullable: true })
  totalStudents?: number;

  @Field(() => Int, { nullable: true })
  totalCourses?: number;

  @Field(() => LearningStyle, { nullable: true })
  learningStyle?: LearningStyle;

  @Field(() => [String], { nullable: true })
  preferredLanguages?: string[];

  @Field(() => [String], { nullable: true })
  skillTags?: string[];

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => Int, { nullable: true })
  totalPoints?: number;

  @Field(() => Int, { nullable: true })
  currentStreak?: number;

  @Field(() => Int, { nullable: true })
  longestStreak?: number;

  @Field(() => [String], { nullable: true })
  achievements?: string[];

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
