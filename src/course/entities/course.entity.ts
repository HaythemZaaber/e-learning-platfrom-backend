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
  LectureType,
  CourseIntensity,
  VideoProvider,
  QuestionType,
  AssignmentType,
  EnrollmentStatus,
  ReviewStatus,
  CourseStatus,
  SubmissionStatus,
  PaymentStatus,
  AnnouncementPriority,
  DiscussionType,
  NotificationType,
  NotificationPriority,
  AIInteractionType,
  UserRole,
  Gender,
  LearningStyle,
  InstructorStatus,
  ApplicationStatus,
  EnrollmentSource,
} from '../../../generated/prisma';
import GraphQLJSON from 'graphql-type-json';

// Register all enums for GraphQL
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

registerEnumType(LectureType, {
  name: 'LectureType',
  description: 'The type of lecture',
});

registerEnumType(CourseIntensity, {
  name: 'CourseIntensity',
  description: 'The intensity level of the course',
});

registerEnumType(VideoProvider, {
  name: 'VideoProvider',
  description: 'The video hosting provider',
});

registerEnumType(QuestionType, {
  name: 'QuestionType',
  description: 'The type of quiz question',
});

registerEnumType(AssignmentType, {
  name: 'AssignmentType',
  description: 'The type of assignment submission',
});

registerEnumType(EnrollmentStatus, {
  name: 'EnrollmentStatus',
  description: 'The status of course enrollment',
});

registerEnumType(ReviewStatus, {
  name: 'ReviewStatus',
  description: 'The status of course review',
});

registerEnumType(CourseStatus, {
  name: 'CourseStatus',
  description: 'The publication status of the course',
});

registerEnumType(SubmissionStatus, {
  name: 'SubmissionStatus',
  description: 'The status of assignment submission',
});

registerEnumType(PaymentStatus, {
  name: 'PaymentStatus',
  description: 'The status of payment',
});

registerEnumType(AnnouncementPriority, {
  name: 'AnnouncementPriority',
  description: 'The priority level of announcements',
});

registerEnumType(DiscussionType, {
  name: 'DiscussionType',
  description: 'The type of discussion',
});

registerEnumType(NotificationType, {
  name: 'NotificationType',
  description: 'The type of notification',
});

registerEnumType(NotificationPriority, {
  name: 'NotificationPriority',
  description: 'The priority level of notifications',
});

registerEnumType(AIInteractionType, {
  name: 'AIInteractionType',
  description: 'The type of AI interaction',
});

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'The role of the user',
});

registerEnumType(Gender, {
  name: 'Gender',
  description: 'The gender of the user',
});

registerEnumType(LearningStyle, {
  name: 'LearningStyle',
  description: 'The learning style preference',
});

registerEnumType(InstructorStatus, {
  name: 'InstructorStatus',
  description: 'The status of instructor application',
});

registerEnumType(ApplicationStatus, {
  name: 'ApplicationStatus',
  description: 'The status of instructor application',
});

registerEnumType(EnrollmentSource, {
  name: 'EnrollmentSource',
  description: 'The source of enrollment',
});

// ============================================
// ENHANCED CONTENT ENTITIES
// ============================================

@ObjectType()
export class ContentItem {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => ContentType)
  type: ContentType;

  @Field({ nullable: true })
  fileUrl?: string;

  @Field({ nullable: true })
  fileName?: string;

  @Field(() => Int, { nullable: true })
  fileSize?: number;

  @Field({ nullable: true })
  mimeType?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  contentData?: any;

  @Field({ nullable: true })
  version?: string;

  @Field({ nullable: true })
  checksum?: string;

  @Field(() => Int)
  order: number;

  @Field()
  isPublished: boolean;

  @Field()
  isDownloadable: boolean;

  @Field()
  requiresAuth: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Lecture {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => LectureType)
  type: LectureType;

  @Field({ nullable: true })
  content?: string;

  // Enhanced video fields
  @Field({ nullable: true })
  videoUrl?: string;

  @Field(() => VideoProvider, { nullable: true })
  videoProvider?: VideoProvider;

  @Field(() => Int, { nullable: true })
  videoDuration?: number;

  @Field(() => Int)
  duration: number;

  @Field(() => Int)
  order: number;

  @Field()
  isPreview: boolean;

  @Field()
  isInteractive: boolean;

  @Field()
  isRequired: boolean;

  @Field()
  isLocked: boolean;

  @Field()
  isCompleted: boolean;

  @Field()
  hasAIQuiz: boolean;

  @Field({ nullable: true })
  aiSummary?: string;

  @Field({ nullable: true })
  transcription?: string;

  @Field()
  autoTranscript: boolean;

  @Field({ nullable: true })
  captions?: string;

  @Field({ nullable: true })
  transcript?: string;

  @Field()
  downloadable: boolean;

  @Field({ nullable: true })
  offlineContent?: string;

  @Field(() => GraphQLJSON, { nullable: true })
  settings?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field(() => ContentItem, { nullable: true })
  contentItem?: ContentItem;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Computed fields
  @Field(() => Int, { nullable: true })
  completionCount?: number;

  @Field(() => Float, { nullable: true })
  averageTimeSpent?: number;
}

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
  isRequired: boolean;

  @Field(() => Int)
  estimatedDuration: number; // in minutes

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [Lecture], { nullable: true })
  lectures?: Lecture[];

  // Computed fields
  @Field(() => Int, { nullable: true })
  totalLectures?: number;

  @Field(() => Int, { nullable: true })
  totalLessons?: number;

  @Field(() => Int, { nullable: true })
  totalDuration?: number;

  @Field(() => Float, { nullable: true })
  completionRate?: number;
}

// ============================================
// QUIZ & ASSIGNMENT ENTITIES
// ============================================

@ObjectType()
export class QuizQuestion {
  @Field(() => ID)
  id: string;

  @Field()
  question: string;

  @Field(() => QuestionType)
  type: QuestionType;

  @Field(() => GraphQLJSON)
  options: any;

  @Field(() => GraphQLJSON)
  correctAnswer: any;

  @Field({ nullable: true })
  explanation?: string;

  @Field(() => Float)
  points: number;

  @Field(() => Int)
  order: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class Quiz {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  instructions?: string;

  @Field(() => Int, { nullable: true })
  timeLimit?: number;

  @Field(() => Int)
  attempts: number;

  @Field(() => Float)
  passingScore: number;

  @Field()
  showResults: boolean;

  @Field()
  randomize: boolean;

  @Field()
  isPublished: boolean;

  @Field(() => Int)
  order: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => [QuizQuestion], { nullable: true })
  questions?: QuizQuestion[];

  // Computed fields
  @Field(() => Int, { nullable: true })
  totalQuestions?: number;

  @Field(() => Float, { nullable: true })
  totalPoints?: number;

  @Field(() => Int, { nullable: true })
  attemptCount?: number;

  @Field(() => Float, { nullable: true })
  averageScore?: number;
}

@ObjectType()
export class Assignment {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  instructions?: string;

  @Field({ nullable: true })
  dueDate?: Date;

  @Field(() => Float)
  points: number;

  @Field(() => AssignmentType)
  submissionType: AssignmentType;

  @Field()
  allowLateSubmission: boolean;

  @Field(() => Int, { nullable: true })
  maxFileSize?: number;

  @Field()
  isPublished: boolean;

  @Field(() => Int)
  order: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Computed fields
  @Field(() => Int, { nullable: true })
  submissionCount?: number;

  @Field(() => Int, { nullable: true })
  gradedCount?: number;

  @Field(() => Float, { nullable: true })
  averageGrade?: number;
}

// ============================================
// REVIEW & FEEDBACK ENTITIES
// ============================================

@ObjectType()
export class Review {
  @Field(() => ID)
  id: string;

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

  @Field(() => ReviewStatus)
  status: ReviewStatus;

  @Field(() => Int)
  flaggedCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => UserObject, { nullable: true })
  user?: UserObject;
}

// ============================================
// ANNOUNCEMENT ENTITY
// ============================================

@ObjectType()
export class CourseAnnouncement {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field(() => AnnouncementPriority)
  priority: AnnouncementPriority;

  @Field()
  publishAt: Date;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field()
  sendEmail: boolean;

  @Field()
  sendPush: boolean;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

// ============================================
// MAIN COURSE ENTITY (Enhanced)
// ============================================

@ObjectType()
export class Course {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  shortDescription?: string;

  @Field()
  category: string;

  @Field({ nullable: true })
  subcategory?: string;

  @Field(() => CourseLevel)
  level: CourseLevel;

  // Enhanced media
  @Field({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  trailer?: string;

  @Field(() => [String])
  galleryImages: string[];

  // Enhanced pricing
  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  originalPrice?: number;

  @Field()
  currency: string;

  @Field(() => Float, { nullable: true })
  discountPercent?: number;

  @Field({ nullable: true })
  discountValidUntil?: Date;

  // Enhanced content structure
  @Field(() => [String])
  objectives: string[];

  @Field(() => [String])
  prerequisites: string[];

  @Field(() => [String])
  whatYouLearn: string[];

  @Field(() => [String])
  requirements: string[];

  // Enhanced SEO & Marketing
  @Field({ nullable: true })
  seoTitle?: string;

  @Field({ nullable: true })
  seoDescription?: string;

  @Field(() => [String])
  seoTags: string[];

  @Field(() => [String])
  marketingTags: string[];

  @Field(() => [String])
  targetAudience: string[];

  // Course settings & status
  @Field(() => CourseStatus)
  status: CourseStatus;

  @Field(() => EnrollmentType)
  enrollmentType: EnrollmentType;

  @Field()
  language: string;

  @Field(() => [String])
  subtitleLanguages: string[];

  @Field()
  isPublic: boolean;

  @Field()
  isFeatured: boolean;

  @Field()
  isBestseller: boolean;

  @Field()
  isTrending: boolean;

  @Field()
  isNew: boolean;


  // Certificates & completion
  @Field()
  certificate: boolean;

  @Field({ nullable: true })
  certificateTemplate?: string;

  @Field(() => Float)
  passingGrade: number;

  @Field()
  allowRetakes: boolean;

  @Field(() => Int, { nullable: true })
  maxAttempts?: number;

  // Duration & difficulty
  @Field(() => Int)
  estimatedHours: number;

  @Field(() => Int)
  estimatedMinutes: number;

  @Field(() => Float)
  difficulty: number;

  @Field(() => CourseIntensity)
  intensityLevel: CourseIntensity;

  // AI & modern features
  @Field()
  hasAITutor: boolean;

  @Field({ nullable: true })
  aiPersonality?: string;

  @Field()
  hasAIQuizzes: boolean;

  @Field()
  hasInteractiveElements: boolean;

  @Field()
  hasLiveSessions: boolean;

  @Field()
  hasRecordings: boolean;

  @Field()
  hasProjectWork: boolean;

  // Content features
  @Field()
  hasDiscussions: boolean;

  @Field()
  hasAssignments: boolean;

  @Field()
  hasQuizzes: boolean;

  @Field()
  downloadableResources: boolean;

  @Field()
  offlineAccess: boolean;

  @Field()
  mobileOptimized: boolean;

  // Scheduling & availability
  @Field({ nullable: true })
  enrollmentStartDate?: Date;

  @Field({ nullable: true })
  enrollmentEndDate?: Date;

  @Field({ nullable: true })
  courseStartDate?: Date;

  @Field({ nullable: true })
  courseEndDate?: Date;

  // Capacity management
  @Field(() => Int, { nullable: true })
  maxStudents?: number;

  @Field(() => Int)
  currentEnrollments: number;

  @Field()
  waitlistEnabled: boolean;

  // Versioning
  @Field()
  version: string;

  @Field({ nullable: true })
  lastMajorUpdate?: Date;

  // Analytics & performance
  @Field(() => Int)
  views: number;

  @Field(() => Int)
  uniqueViews: number;

  @Field(() => Float)
  avgRating: number;

  @Field(() => Int)
  totalRatings: number;

  @Field(() => Float)
  completionRate: number;

  // Content counts
  @Field(() => Int)
  totalSections: number;

  @Field(() => Int)
  totalLectures: number;

  @Field(() => Int)
  totalQuizzes: number;

  @Field(() => Int)
  totalAssignments: number;

  @Field(() => Int)
  totalContentItems: number;

  @Field(() => Int)
  totalDiscussions: number;

  @Field(() => Int)
  totalAnnouncements: number;

  // Enhanced settings and metadata
  @Field(() => GraphQLJSON, { nullable: true })
  settings?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  accessibility?: any;

  // Timestamps
  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field({ nullable: true })
  publishedAt?: Date;

  @Field({ nullable: true })
  archivedAt?: Date;

  @Field()
  instructorId: string;

  // Relations
  @Field(() => UserObject, { nullable: true })
  instructor?: UserObject;

  @Field(() => [Section], { nullable: true })
  sections?: Section[];

  @Field(() => [ContentItem], { nullable: true })
  contentItems?: ContentItem[];

  @Field(() => [Quiz], { nullable: true })
  quizzes?: Quiz[];

  @Field(() => [Assignment], { nullable: true })
  assignments?: Assignment[];

  @Field(() => [Review], { nullable: true })
  reviews?: Review[];

  @Field(() => [CourseAnnouncement], { nullable: true })
  announcements?: CourseAnnouncement[];

  // Computed/aggregated fields
  @Field(() => Int, { nullable: true })
  enrollmentCount?: number;

  @Field(() => Float, { nullable: true })
  completionPercentage?: number;

  @Field(() => Int, { nullable: true })
  publishedContent?: number;

  @Field(() => Boolean, { nullable: true })
  isBookmarked?: boolean;

  @Field(() => Boolean, { nullable: true })
  isEnrolled?: boolean;

  @Field(() => Float, { nullable: true })
  userProgress?: number;

  @Field(() => Date, { nullable: true })
  userLastAccessed?: Date;

  // Course statistics
  @Field(() => GraphQLJSON, { nullable: true })
  statistics?: {
    enrollments: {
      total: number;
      active: number;
      completed: number;
      dropped: number;
    };
    engagement: {
      averageTimeSpent: number;
      discussionParticipation: number;
      assignmentSubmissions: number;
      quizAttempts: number;
    };
    performance: {
      averageGrade: number;
      passRate: number;
      retakeRate: number;
    };
    content: {
      totalLectures: number;
      totalQuizzes: number;
      totalAssignments: number;
      totalResources: number;
    };
  };

  // Content organization (for enhanced content management)
  @Field(() => GraphQLJSON, { nullable: true })
  organizedContent?: {
    contentByLecture: Record<string, any>;
    summary: {
      totalLectures: number;
      totalContent: number;
      contentTypes: Record<string, number>;
      lectureBreakdown: Record<string, any>;
    };
  };
}

// ============================================
// ENHANCED RESPONSE TYPES
// ============================================

@ObjectType()
export class CourseCreationResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Course, { nullable: true })
  course?: Course;

  @Field(() => Int, { nullable: true })
  completionPercentage?: number;

  @Field(() => [String], { nullable: true })
  errors?: string[];

  @Field(() => [String], { nullable: true })
  warnings?: string[];

  @Field(() => [String], { nullable: true })
  nextSteps?: string[];

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field(() => Boolean, { nullable: true })
  readyForReview?: boolean;

  @Field(() => Boolean, { nullable: true })
  isValid?: boolean;

  @Field(() => Float, { nullable: true })
  validationScore?: number;
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

  @Field(() => Int, { nullable: true })
  version?: number;

  @Field(() => Date, { nullable: true })
  lastAutoSave?: Date;

  @Field(() => Int, { nullable: true })
  saveCount?: number;
}

@ObjectType()
export class CourseAnalytics {
  @Field(() => GraphQLJSON)
  course: {
    id: string;
    title: string;
    views: number;
    uniqueViews: number;
    avgRating: number;
    totalRatings: number;
  };

  @Field(() => GraphQLJSON)
  enrollments: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
    averageProgress: number;
  };

  @Field(() => GraphQLJSON)
  revenue: {
    total: number;
    currency: string;
  };

  @Field(() => GraphQLJSON)
  engagement: {
    totalDiscussions: number;
    totalReviews: number;
    averageTimeSpent: number;
    retentionRate: number;
  };

  @Field(() => GraphQLJSON)
  trends: {
    enrollments: Record<string, { count: number; revenue: number }>;
    completion: Record<string, number>;
    engagement: Record<string, number>;
  };

  @Field(() => GraphQLJSON)
  insights: {
    topPerformingLectures: any[];
    strugglingStudents: number;
    recommendedImprovements: string[];
    contentGaps: string[];
  };

  @Field(() => GraphQLJSON)
  comparisons: {
    categoryAverage: number;
    industryBenchmark: number;
    previousPeriod: number;
  };
}

@ObjectType()
export class CourseAnalyticsResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => CourseAnalytics, { nullable: true })
  analytics?: CourseAnalytics;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class CourseValidationResult {
  @Field()
  isValid: boolean;

  @Field(() => [String])
  errors: string[];

  @Field(() => [String])
  warnings: string[];

  @Field(() => Int)
  completionPercentage: number;

  @Field(() => GraphQLJSON, { nullable: true })
  validationDetails?: {
    basicInfo: boolean;
    content: boolean;
    pricing: boolean;
    settings: boolean;
    accessibility: boolean;
    seo: boolean;
  };

  @Field(() => [String], { nullable: true })
  missingRequirements?: string[];

  @Field(() => [String], { nullable: true })
  recommendations?: string[];
}

@ObjectType()
export class SocialLinks {
  @Field()
  facebook: string;

  @Field()
  twitter: string;

  @Field()
  linkedin: string;

  @Field()
  whatsapp: string;

  @Field()
  telegram: string;

  @Field()
  email: string;
}

@ObjectType()
export class CourseShareData {
  @Field()
  courseUrl: string;

  @Field(() => SocialLinks)
  socialLinks: SocialLinks;

  @Field()
  embedCode: string;

  @Field({ nullable: true })
  qrCode?: string;
}

@ObjectType()
export class CourseShareResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => CourseShareData, { nullable: true })
  shareData?: CourseShareData;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class Enrollment {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  courseId: string;

  @Field(() => EnrollmentStatus)
  status: EnrollmentStatus;

  @Field(() => EnrollmentType)
  type: EnrollmentType;

  @Field(() => EnrollmentSource)
  source: EnrollmentSource;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field({ nullable: true })
  paidAt?: Date;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Float)
  completionPercentage: number;

  @Field(() => Float)
  progress: number;

  @Field({ nullable: true })
  currentLectureId?: string;

  @Field({ nullable: true })
  currentLessonId?: string;

  @Field()
  enrolledAt: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field({ nullable: true })
  paymentId?: string;

  @Field(() => Float, { nullable: true })
  amountPaid?: number;

  @Field(() => Float)
  discountApplied: number;

  @Field(() => Int)
  completedLectures: number;

  @Field(() => Int)
  totalLectures: number;

  @Field(() => Int)
  totalTimeSpent: number;

  @Field(() => Int)
  streakDays: number;

  @Field({ nullable: true })
  lastAccessedAt?: Date;

  @Field()
  certificateEarned: boolean;

  @Field({ nullable: true })
  certificateEarnedAt?: Date;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class CourseProgress {
  @Field(() => Int)
  completedLectures: number;

  @Field(() => Int)
  totalLectures: number;

  @Field(() => Int)
  completedSections: number;

  @Field({ nullable: true })
  lastWatchedLecture?: string;

  @Field(() => Int)
  timeSpent: number; // in minutes

  @Field(() => Float)
  completionPercentage: number;

  @Field()
  certificateEarned: boolean;

  @Field(() => Int)
  watchTime: number; // in seconds

  @Field(() => GraphQLJSON)
  interactions: any;

  @Field({ nullable: true })
  currentLessonId?: string;

  @Field(() => Int)
  streakDays: number;

  @Field({ nullable: true })
  lastAccessedAt?: Date;

  @Field(() => Float, { nullable: true })
  difficultyRating?: number;

  @Field({ nullable: true })
  aiRecommendations?: string;
}

@ObjectType()
export class LectureAnalytics {
  @Field(() => Int)
  totalViews: number;

  @Field(() => Int)
  uniqueViews: number;

  @Field(() => Float)
  averageWatchTime: number; // in seconds

  @Field(() => Float)
  completionRate: number;

  @Field(() => Float)
  engagementRate: number;

  @Field(() => [GraphQLJSON])
  dropOffPoints: Array<{
    time: number;
    percentage: number;
  }>;

  @Field(() => [GraphQLJSON])
  popularSegments: Array<{
    startTime: number;
    endTime: number;
    viewCount: number;
  }>;

  @Field(() => [GraphQLJSON])
  userInteractions: Array<{
    type: string;
    count: number;
    timestamp: number;
  }>;
}

@ObjectType()
export class CourseNavigation {
  @Field(() => [Section])
  sections: Section[];

  @Field({ nullable: true })
  currentSection?: string;

  @Field({ nullable: true })
  currentLecture?: string;

  @Field(() => CourseProgress)
  progress: CourseProgress;
}

@ObjectType()
export class CoursePreview {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field({ nullable: true })
  shortDescription?: string;

  @Field({ nullable: true })
  thumbnail?: string;

  @Field({ nullable: true })
  trailer?: string;

  @Field(() => [String])
  galleryImages: string[];

  // Categorization
  @Field()
  category: string;

  @Field({ nullable: true })
  subcategory?: string;

  @Field(() => CourseLevel)
  level: CourseLevel;

  @Field(() => CourseStatus)
  status: CourseStatus;

  // Pricing
  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  originalPrice?: number;

  @Field()
  currency: string;

  @Field(() => Float, { nullable: true })
  discountPercent?: number;

  @Field({ nullable: true })
  discountValidUntil?: Date;

  // Analytics & Performance
  @Field(() => Int)
  views: number;

  @Field(() => Int)
  uniqueViews: number;

  @Field(() => Float)
  completionRate: number;

  @Field(() => Float)
  avgRating: number;

  @Field(() => Int)
  totalRatings: number;

  // Content Counts
  @Field(() => Int)
  totalSections: number;

  @Field(() => Int)
  totalLectures: number;

  @Field(() => Int)
  totalQuizzes: number;

  @Field(() => Int)
  totalAssignments: number;

  @Field(() => Int)
  totalContentItems: number;

  // Course Settings & Features
  @Field()
  isFeatured: boolean;

  @Field()
  isBestseller: boolean;

  @Field()
  isTrending: boolean;

  // Instructor
  @Field(() => UserObject, { nullable: true })
  instructor?: UserObject;

  @Field()
  instructorId: string;

  // Content Structure (limited for preview)
  @Field(() => [Section], { nullable: true })
  sections?: Section[];

  // Requirements & Outcomes
  @Field(() => [String])
  requirements: string[];

  @Field(() => [String])
  whatYouLearn: string[];

  @Field(() => [String])
  objectives: string[];

  @Field(() => [String])
  prerequisites: string[];

  // Course Details
  @Field()
  language: string;

  @Field(() => [String])
  subtitleLanguages: string[];

  // Advanced Features
  @Field()
  hasLiveSessions: boolean;

  @Field()
  hasRecordings: boolean;

  @Field()
  hasDiscussions: boolean;

  @Field()
  hasAssignments: boolean;

  @Field()
  hasQuizzes: boolean;

  @Field()
  downloadableResources: boolean;

  @Field()
  offlineAccess: boolean;

  @Field()
  mobileOptimized: boolean;

  // Scheduling
  @Field({ nullable: true })
  enrollmentStartDate?: Date;

  @Field({ nullable: true })
  enrollmentEndDate?: Date;

  @Field({ nullable: true })
  courseStartDate?: Date;

  @Field({ nullable: true })
  courseEndDate?: Date;

  // Capacity
  @Field(() => Int, { nullable: true })
  maxStudents?: number;

  @Field(() => Int)
  currentEnrollments: number;

  @Field()
  waitlistEnabled: boolean;

  // Reviews (limited for preview)
  @Field(() => [Review], { nullable: true })
  reviews?: Review[];

  // SEO & Marketing
  @Field({ nullable: true })
  seoTitle?: string;

  @Field({ nullable: true })
  seoDescription?: string;

  @Field(() => [String])
  seoTags: string[];

  @Field(() => [String])
  marketingTags: string[];

  @Field(() => [String])
  targetAudience: string[];

  // Duration & Difficulty
  @Field(() => Int)
  estimatedHours: number;

  @Field(() => Int)
  estimatedMinutes: number;

  @Field(() => Float)
  difficulty: number;

  @Field(() => CourseIntensity)
  intensityLevel: CourseIntensity;

  // Certificates & Completion
  @Field()
  certificate: boolean;

  @Field({ nullable: true })
  certificateTemplate?: string;

  @Field(() => Float)
  passingGrade: number;

  @Field()
  allowRetakes: boolean;

  @Field(() => Int, { nullable: true })
  maxAttempts?: number;

  // Course Settings
  @Field(() => EnrollmentType)
  enrollmentType: EnrollmentType;

  @Field()
  isPublic: boolean;

  @Field()
  version: string;

  @Field({ nullable: true })
  lastMajorUpdate?: Date;

  // User-specific data (if enrolled)
  @Field(() => Enrollment, { nullable: true })
  enrollment?: Enrollment;

  // Progress tracking
  @Field(() => CourseProgress, { nullable: true })
  progress?: CourseProgress;
}

@ObjectType()
export class LecturePreview {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => LectureType)
  type: LectureType;

  @Field({ nullable: true })
  content?: string;

  @Field({ nullable: true })
  videoUrl?: string;

  @Field(() => VideoProvider, { nullable: true })
  videoProvider?: VideoProvider;

  @Field(() => Int, { nullable: true })
  videoDuration?: number;

  @Field(() => Int)
  duration: number;

  @Field(() => Int)
  order: number;

  @Field()
  isPreview: boolean;

  @Field()
  isInteractive: boolean;

  @Field()
  isRequired: boolean;

  @Field()
  isCompleted: boolean;

  @Field()
  isLocked: boolean;

  // AI features
  @Field()
  hasAIQuiz: boolean;

  @Field({ nullable: true })
  aiSummary?: string;

  @Field({ nullable: true })
  transcription?: string;

  @Field()
  autoTranscript: boolean;

  // Accessibility
  @Field({ nullable: true })
  captions?: string;

  @Field({ nullable: true })
  transcript?: string;

  // Download & offline
  @Field()
  downloadable: boolean;

  @Field({ nullable: true })
  offlineContent?: string;

  // Content association
  @Field(() => ContentItem, { nullable: true })
  contentItem?: ContentItem;

  // Settings and metadata
  @Field(() => GraphQLJSON, { nullable: true })
  settings?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  metadata?: any;

  @Field({ nullable: true })
  status?: string;

  @Field()
  sectionId: string;

  // Resources
  @Field(() => [GraphQLJSON], { nullable: true })
  resources?: Array<{
    name: string;
    url: string;
    type: string;
  }>;

  // Quiz data (embedded)
  @Field(() => Quiz, { nullable: true })
  quiz?: Quiz;

  // Timestamps
  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  // Computed fields
  @Field(() => Int, { nullable: true })
  completionCount?: number;

  @Field(() => Float, { nullable: true })
  averageTimeSpent?: number;

  // Navigation
  @Field(() => GraphQLJSON, { nullable: true })
  previousLecture?: any;

  @Field(() => GraphQLJSON, { nullable: true })
  nextLecture?: any;

  // Section info
  @Field(() => Section, { nullable: true })
  section?: Section;

  // Course info
  @Field(() => GraphQLJSON, { nullable: true })
  course?: any;
}



@ObjectType()
export class ProgressResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => CourseProgress, { nullable: true })
  progress?: CourseProgress;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class LectureAnalyticsResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => LectureAnalytics, { nullable: true })
  analytics?: LectureAnalytics;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class CourseNavigationResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field(() => CourseNavigation, { nullable: true })
  navigation?: CourseNavigation;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class LectureInteractionResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class QuizSubmissionResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Float, { nullable: true })
  score?: number;

  @Field(() => Int, { nullable: true })
  totalQuestions?: number;

  @Field(() => Int, { nullable: true })
  correctAnswers?: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class ResourceDownloadResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  downloadUrl?: string;

  @Field({ nullable: true })
  expiresAt?: Date;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class BookmarkResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field()
  isBookmarked: boolean;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class LectureNote {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => Float, { nullable: true })
  timestamp?: number;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}

@ObjectType()
export class NoteResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => LectureNote, { nullable: true })
  note?: LectureNote;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class LectureRating {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  rating: number;

  @Field({ nullable: true })
  feedback?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class RatingResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => LectureRating, { nullable: true })
  rating?: LectureRating;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class LectureIssue {
  @Field(() => ID)
  id: string;

  @Field()
  issueType: string;

  @Field()
  description: string;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class IssueResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => LectureIssue, { nullable: true })
  report?: LectureIssue;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class AccessRequest {
  @Field(() => ID)
  id: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  reason?: string;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class AccessResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => AccessRequest, { nullable: true })
  request?: AccessRequest;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class ShareResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field({ nullable: true })
  shareUrl?: string;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class Transcript {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  language: string;

  @Field(() => GraphQLJSON)
  timestamps: any;

  @Field(() => Float)
  accuracy: number;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class TranscriptResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Transcript, { nullable: true })
  transcript?: Transcript;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class LectureSummary {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => [String])
  keyPoints: string[];

  @Field(() => Float)
  difficulty: number;

  @Field(() => Int)
  estimatedReadingTime: number;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class SummaryResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => LectureSummary, { nullable: true })
  summary?: LectureSummary;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class Discussion {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field()
  content: string;

  @Field(() => UserObject)
  author: UserObject;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class DiscussionResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => Discussion, { nullable: true })
  discussion?: Discussion;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}

@ObjectType()
export class DiscussionReply {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field(() => UserObject)
  author: UserObject;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class ReplyResponse {
  @Field()
  success: boolean;

  @Field()
  message: string;

  @Field(() => DiscussionReply, { nullable: true })
  reply?: DiscussionReply;

  @Field(() => [String], { nullable: true })
  errors?: string[];
}
