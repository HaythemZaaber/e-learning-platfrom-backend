import { Field, Int, Float, ObjectType, InputType } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';

// ============================================
// COURSE ANALYTICS RESPONSE DTOs
// ============================================

@ObjectType()
export class EnrollmentTrend {
  @Field()
  date: string;

  @Field(() => Int)
  enrollments: number;

  @Field(() => Float)
  cumulative: number;
}

@ObjectType()
export class CourseRatingDistribution {
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
export class CompletionStats {
  @Field(() => Int)
  totalEnrollments: number;

  @Field(() => Int)
  completedEnrollments: number;

  @Field(() => Float)
  completionRate: number;

  @Field(() => Float)
  averageCompletionTime: number; // in days
}

@ObjectType()
export class EngagementMetrics {
  @Field(() => Int)
  totalViews: number;

  @Field(() => Int)
  uniqueViewers: number;

  @Field(() => Float)
  averageSessionDuration: number; // in minutes

  @Field(() => Float)
  averageProgressRate: number; // percentage

  @Field(() => Int)
  totalInteractions: number;
}

@ObjectType()
export class RevenueStats {
  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  averageRevenuePerStudent: number;

  @Field(() => Int)
  totalPaidEnrollments: number;

  @Field(() => Float)
  conversionRate: number; // free to paid conversion
}

@ObjectType()
export class CourseReview {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field({ nullable: true })
  userProfileImage?: string;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  comment?: string;

  @Field(() => Int, { nullable: true })
  courseQuality?: number;

  @Field(() => Int, { nullable: true })
  instructorRating?: number;

  @Field(() => Int, { nullable: true })
  difficultyRating?: number;

  @Field(() => Int, { nullable: true })
  valueForMoney?: number;

  @Field()
  createdAt: string;

  @Field({ nullable: true })
  updatedAt?: string;
}

@ObjectType()
export class PopularContent {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  type: string;

  @Field(() => Int)
  views: number;

  @Field(() => Float)
  completionRate: number;

  @Field(() => Float)
  averageRating: number;
}

@ObjectType()
export class StudentProgress {
  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field({ nullable: true })
  userProfileImage?: string;

  @Field(() => Float)
  progressPercentage: number;

  @Field(() => Int)
  lecturesCompleted: number;

  @Field(() => Int)
  totalLectures: number;

  @Field(() => Float)
  timeSpent: number; // in minutes

  @Field()
  enrolledAt: string;

  @Field({ nullable: true })
  lastAccessedAt?: string;

  @Field()
  status: string; // 'active', 'completed', 'inactive'
}

@ObjectType()
export class CourseAnalyticsData {
  // Basic Course Info
  @Field()
  courseId: string;

  @Field()
  courseTitle: string;

  @Field()
  courseStatus: string;

  @Field()
  createdAt: string;

  // Enrollment Analytics
  @Field(() => Int)
  totalEnrollments: number;

  @Field(() => Int)
  activeStudents: number;

  @Field(() => Int)
  completedStudents: number;

  @Field(() => [EnrollmentTrend])
  enrollmentTrend: EnrollmentTrend[];

  @Field(() => CompletionStats)
  completionStats: CompletionStats;

  // Rating & Review Analytics
  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  totalRatings: number;

  @Field(() => CourseRatingDistribution)
  ratingDistribution: CourseRatingDistribution;

  @Field(() => [CourseReview])
  recentReviews: CourseReview[];

  // Engagement Analytics
  @Field(() => EngagementMetrics)
  engagementMetrics: EngagementMetrics;

  @Field(() => [PopularContent])
  popularContent: PopularContent[];

  // Revenue Analytics (if applicable)
  @Field(() => RevenueStats, { nullable: true })
  revenueStats?: RevenueStats;

  // Student Progress
  @Field(() => [StudentProgress])
  studentProgress: StudentProgress[];

  // Performance Metrics
  @Field(() => Float)
  courseQualityScore: number;

  @Field(() => Float)
  instructorRating: number;

  @Field(() => Int)
  totalRevenue: number;

  @Field()
  currency: string;

  @Field(() => GraphQLJSON)
  additionalMetrics: any;
}

@ObjectType()
export class CourseAnalyticsResponseData {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => CourseAnalyticsData, { nullable: true })
  analytics?: CourseAnalyticsData;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

// ============================================
// ANALYTICS FILTER INPUT DTOs
// ============================================

@InputType()
export class AnalyticsFilters {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  startDate?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  endDate?: string;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  timeRange?: string; // '7d', '30d', '90d', '1y', 'all'
}
