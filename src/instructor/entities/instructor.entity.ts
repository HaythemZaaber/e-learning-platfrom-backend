import { ObjectType, Field, ID, Int, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

// =============================================================================
// USER TYPE
// =============================================================================

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  profileImage?: string;

  @Field()
  role: string;

  @Field()
  instructorStatus: string;
}

// =============================================================================
// INSTRUCTOR COURSE TYPE
// =============================================================================

@ObjectType()
export class InstructorCourse {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  status: string;

  @Field(() => Float, { nullable: true })
  avgRating?: number;

  @Field(() => Int)
  totalRatings: number;

  @Field(() => Int)
  views: number;

  @Field(() => Int)
  currentEnrollments: number;

  @Field(() => Float)
  price: number;
}

// =============================================================================
// INSTRUCTOR PROFILE TYPE
// =============================================================================

@ObjectType()
export class InstructorProfile {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  // Professional Information
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  shortBio?: string;

  @Field(() => [String])
  expertise: string[];

  @Field(() => [String])
  qualifications: string[];

  @Field(() => Int, { nullable: true })
  experience?: number;

  @Field(() => GraphQLJSON)
  socialLinks: any;

  @Field({ nullable: true })
  personalWebsite?: string;

  @Field({ nullable: true })
  linkedinProfile?: string;

  // Teaching Specialization
  @Field(() => [String])
  subjectsTeaching: string[];

  @Field(() => [String])
  teachingCategories: string[];

  @Field(() => GraphQLJSON)
  languagesSpoken: any;

  @Field({ nullable: true })
  teachingStyle?: string;

  @Field({ nullable: true })
  targetAudience?: string;

  @Field({ nullable: true })
  teachingMethodology?: string;

  // Platform Statistics
  @Field(() => Float, { nullable: true })
  teachingRating?: number;

  @Field(() => Int)
  totalStudents: number;

  @Field(() => Int)
  totalCourses: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field()
  currency: string;

  // Performance Metrics
  @Field(() => Float)
  averageCourseRating: number;

  @Field(() => Float)
  studentRetentionRate: number;

  @Field(() => Float)
  courseCompletionRate: number;

  @Field(() => Int)
  responseTime: number;

  @Field(() => Float)
  studentSatisfaction: number;

  // Teaching Availability
  @Field()
  isAcceptingStudents: boolean;

  @Field(() => Int, { nullable: true })
  maxStudentsPerCourse?: number;

  @Field(() => GraphQLJSON)
  preferredSchedule: any;

  @Field(() => GraphQLJSON)
  availableTimeSlots: any;

  // Verification & Compliance
  @Field()
  isVerified: boolean;

  @Field({ nullable: true })
  verificationLevel?: string;

  @Field(() => Date, { nullable: true })
  lastVerificationDate?: Date;

  @Field()
  complianceStatus: string;

  // Content Creation Stats
  @Field(() => Int)
  totalLectures: number;

  @Field(() => Int)
  totalVideoHours: number;

  @Field(() => Int)
  totalQuizzes: number;

  @Field(() => Int)
  totalAssignments: number;

  @Field(() => Int)
  contentUpdateFreq: number;

  // Financial Information
  @Field(() => GraphQLJSON)
  payoutSettings: any;

  @Field(() => GraphQLJSON)
  taxInformation: any;

  @Field(() => GraphQLJSON)
  paymentPreferences: any;

  @Field(() => Float, { nullable: true })
  revenueSharing?: number;

  // Marketing & Promotion
  @Field()
  isPromotionEligible: boolean;

  @Field()
  marketingConsent: boolean;

  @Field()
  featuredInstructor: boolean;

  @Field(() => [String])
  badgesEarned: string[];

  // Activity Tracking
  @Field(() => Date, { nullable: true })
  lastCourseUpdate?: Date;

  @Field(() => Date, { nullable: true })
  lastStudentReply?: Date;

  @Field(() => Date, { nullable: true })
  lastContentCreation?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Relations
  @Field(() => User, { nullable: true })
  user?: User;
}

// =============================================================================
// INSTRUCTOR STATISTICS TYPE
// =============================================================================

@ObjectType()
export class InstructorStatistics {
  @Field(() => Int)
  totalCourses: number;

  @Field(() => Int)
  publishedCourses: number;

  @Field(() => Int)
  totalEnrollments: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  averageRating: number;

  @Field(() => [InstructorCourse])
  courses: InstructorCourse[];
}

@ObjectType()
export class InstructorStats {
  @Field(() => InstructorProfile)
  profile: InstructorProfile;

  @Field(() => InstructorStatistics)
  statistics: InstructorStatistics;
}

// =============================================================================
// INSTRUCTOR SEARCH RESPONSE TYPE
// =============================================================================

@ObjectType()
export class InstructorSearchResponse {
  @Field(() => [InstructorProfile])
  instructors: InstructorProfile[];

  @Field(() => Int)
  total: number;

  @Field()
  hasMore: boolean;
}
