import { Field, InputType, Int, ObjectType } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

// ============================================
// COURSE RATING INPUT DTOs
// ============================================

@InputType()
export class CreateCourseRatingInput {
  @Field()
  @IsString()
  courseId: string;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  courseQuality?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  instructorRating?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyRating?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  valueForMoney?: number;
}

@InputType()
export class UpdateCourseRatingInput {
  @Field()
  @IsString()
  ratingId: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  comment?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  courseQuality?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  instructorRating?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyRating?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  valueForMoney?: number;
}

@InputType()
export class CourseRatingFiltersInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  courseId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  userId?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;
}

// ============================================
// COURSE RATING RESPONSE DTOs
// ============================================

@ObjectType()
export class CourseRatingUser {
  @Field()
  id: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  profileImage?: string;
}

@ObjectType()
export class CourseRating {
  @Field()
  id: string;

  @Field()
  courseId: string;

  @Field()
  userId: string;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field()
  isVerified: boolean;

  @Field(() => Int)
  helpfulCount: number;

  @Field(() => Int, { nullable: true })
  courseQuality?: number;

  @Field(() => Int, { nullable: true })
  instructorRating?: number;

  @Field(() => Int, { nullable: true })
  difficultyRating?: number;

  @Field(() => Int, { nullable: true })
  valueForMoney?: number;

  @Field()
  status: string;

  @Field(() => Int)
  flaggedCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => CourseRatingUser, { nullable: true })
  user?: CourseRatingUser;
}

@ObjectType()
export class CourseRatingResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  rating?: CourseRating;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class RatingDistribution {
  @Field(() => Int)
  one: number;

  @Field(() => Int)
  two: number;

  @Field(() => Int)
  three: number;

  @Field(() => Int)
  four: number;

  @Field(() => Int)
  five: number;
}

@ObjectType()
export class CourseRatingStats {
  @Field(() => Int)
  totalRatings: number;

  @Field(() => Int)
  averageRating: number;

  @Field(() => RatingDistribution)
  ratingDistribution: RatingDistribution;

  @Field(() => Int, { nullable: true })
  averageCourseQuality?: number;

  @Field(() => Int, { nullable: true })
  averageInstructorRating?: number;

  @Field(() => Int, { nullable: true })
  averageDifficultyRating?: number;

  @Field(() => Int, { nullable: true })
  averageValueForMoney?: number;
}

@ObjectType()
export class PaginatedCourseRatingsResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => [CourseRating])
  ratings: CourseRating[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  limit: number;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}
