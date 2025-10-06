import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  IsBoolean,
  IsObject,
  IsUrl,
  IsEnum,
} from 'class-validator';

export class CreateInstructorProfileDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Professional title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Detailed bio' })
  @IsString()
  bio: string;

  @ApiProperty({ description: 'Short bio for preview' })
  @IsString()
  shortBio: string;

  @ApiProperty({ description: 'Areas of expertise', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expertise?: string[];

  @ApiProperty({ description: 'Professional qualifications', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualifications?: string[];

  @ApiProperty({ description: 'Years of experience' })
  @IsNumber()
  @IsOptional()
  experience?: number;

  @ApiProperty({ description: 'Social media links' })
  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiProperty({ description: 'Personal website URL' })
  @IsUrl()
  @IsOptional()
  personalWebsite?: string;

  @ApiProperty({ description: 'LinkedIn profile URL' })
  @IsUrl()
  @IsOptional()
  linkedinProfile?: string;

  @ApiProperty({ description: 'Subjects taught', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjectsTeaching?: string[];

  @ApiProperty({ description: 'Teaching categories', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  teachingCategories?: string[];

  @ApiProperty({ description: 'Languages spoken', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languagesSpoken?: string[];

  @ApiProperty({ description: 'Teaching style description' })
  @IsString()
  @IsOptional()
  teachingStyle?: string;

  @ApiProperty({ description: 'Target audience' })
  @IsString()
  @IsOptional()
  targetAudience?: string;

  @ApiProperty({ description: 'Teaching methodology' })
  @IsString()
  @IsOptional()
  teachingMethodology?: string;

  @ApiProperty({ description: 'Whether live sessions are enabled' })
  @IsBoolean()
  @IsOptional()
  liveSessionsEnabled?: boolean;

  @ApiProperty({ description: 'Default session duration in minutes' })
  @IsNumber()
  @IsOptional()
  defaultSessionDuration?: number;

  @ApiProperty({ description: 'Default session type' })
  @IsString()
  @IsOptional()
  defaultSessionType?: string;

  @ApiProperty({ description: 'Preferred group size' })
  @IsNumber()
  @IsOptional()
  preferredGroupSize?: number;

  @ApiProperty({ description: 'Buffer between sessions in minutes' })
  @IsNumber()
  @IsOptional()
  bufferBetweenSessions?: number;

  @ApiProperty({ description: 'Maximum sessions per day' })
  @IsNumber()
  @IsOptional()
  maxSessionsPerDay?: number;

  @ApiProperty({ description: 'Minimum advance booking in hours' })
  @IsNumber()
  @IsOptional()
  minAdvanceBooking?: number;

  @ApiProperty({ description: 'Auto accept bookings' })
  @IsBoolean()
  @IsOptional()
  autoAcceptBookings?: boolean;

  @ApiProperty({ description: 'Instant meeting enabled' })
  @IsBoolean()
  @IsOptional()
  instantMeetingEnabled?: boolean;

  @ApiProperty({ description: 'Individual session rate' })
  @IsNumber()
  @IsOptional()
  individualSessionRate?: number;

  @ApiProperty({ description: 'Group session rate' })
  @IsNumber()
  @IsOptional()
  groupSessionRate?: number;

  @ApiProperty({ description: 'Currency' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Platform fee rate percentage' })
  @IsNumber()
  @IsOptional()
  platformFeeRate?: number;

  @ApiProperty({ description: 'Default cancellation policy' })
  @IsString()
  @IsOptional()
  defaultCancellationPolicy?: string;

  @ApiProperty({ description: 'Default session format' })
  @IsString()
  @IsOptional()
  defaultSessionFormat?: string;

  @ApiProperty({ description: 'Whether accepting students' })
  @IsBoolean()
  @IsOptional()
  isAcceptingStudents?: boolean;

  @ApiProperty({ description: 'Maximum students per course' })
  @IsNumber()
  @IsOptional()
  maxStudentsPerCourse?: number;

  @ApiProperty({ description: 'Preferred schedule' })
  @IsObject()
  @IsOptional()
  preferredSchedule?: Record<string, any>;

  @ApiProperty({ description: 'Available time slots', type: [Object] })
  @IsArray()
  @IsOptional()
  availableTimeSlots?: any[];
}

export class UpdateInstructorProfileDto {
  @ApiProperty({ description: 'Professional title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Detailed bio' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ description: 'Short bio for preview' })
  @IsString()
  @IsOptional()
  shortBio?: string;

  @ApiProperty({ description: 'Areas of expertise', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  expertise?: string[];

  @ApiProperty({ description: 'Professional qualifications', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualifications?: string[];

  @ApiProperty({ description: 'Years of experience' })
  @IsNumber()
  @IsOptional()
  experience?: number;

  @ApiProperty({ description: 'Social media links' })
  @IsObject()
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiProperty({ description: 'Personal website URL' })
  @IsUrl()
  @IsOptional()
  personalWebsite?: string;

  @ApiProperty({ description: 'LinkedIn profile URL' })
  @IsUrl()
  @IsOptional()
  linkedinProfile?: string;

  @ApiProperty({ description: 'Subjects taught', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  subjectsTeaching?: string[];

  @ApiProperty({ description: 'Teaching categories', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  teachingCategories?: string[];

  @ApiProperty({ description: 'Languages spoken', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  languagesSpoken?: string[];

  @ApiProperty({ description: 'Teaching style description' })
  @IsString()
  @IsOptional()
  teachingStyle?: string;

  @ApiProperty({ description: 'Target audience' })
  @IsString()
  @IsOptional()
  targetAudience?: string;

  @ApiProperty({ description: 'Teaching methodology' })
  @IsString()
  @IsOptional()
  teachingMethodology?: string;

  @ApiProperty({ description: 'Whether live sessions are enabled' })
  @IsBoolean()
  @IsOptional()
  liveSessionsEnabled?: boolean;

  @ApiProperty({ description: 'Default session duration in minutes' })
  @IsNumber()
  @IsOptional()
  defaultSessionDuration?: number;

  @ApiProperty({ description: 'Default session type' })
  @IsString()
  @IsOptional()
  defaultSessionType?: string;

  @ApiProperty({ description: 'Preferred group size' })
  @IsNumber()
  @IsOptional()
  preferredGroupSize?: number;

  @ApiProperty({ description: 'Buffer between sessions in minutes' })
  @IsNumber()
  @IsOptional()
  bufferBetweenSessions?: number;

  @ApiProperty({ description: 'Maximum sessions per day' })
  @IsNumber()
  @IsOptional()
  maxSessionsPerDay?: number;

  @ApiProperty({ description: 'Minimum advance booking in hours' })
  @IsNumber()
  @IsOptional()
  minAdvanceBooking?: number;

  @ApiProperty({ description: 'Auto accept bookings' })
  @IsBoolean()
  @IsOptional()
  autoAcceptBookings?: boolean;

  @ApiProperty({ description: 'Instant meeting enabled' })
  @IsBoolean()
  @IsOptional()
  instantMeetingEnabled?: boolean;

  @ApiProperty({ description: 'Individual session rate' })
  @IsNumber()
  @IsOptional()
  individualSessionRate?: number;

  @ApiProperty({ description: 'Group session rate' })
  @IsNumber()
  @IsOptional()
  groupSessionRate?: number;

  @ApiProperty({ description: 'Currency' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Platform fee rate percentage' })
  @IsNumber()
  @IsOptional()
  platformFeeRate?: number;

  @ApiProperty({ description: 'Default cancellation policy' })
  @IsString()
  @IsOptional()
  defaultCancellationPolicy?: string;

  @ApiProperty({ description: 'Default session format' })
  @IsString()
  @IsOptional()
  defaultSessionFormat?: string;

  @ApiProperty({ description: 'Whether accepting students' })
  @IsBoolean()
  @IsOptional()
  isAcceptingStudents?: boolean;

  @ApiProperty({ description: 'Maximum students per course' })
  @IsNumber()
  @IsOptional()
  maxStudentsPerCourse?: number;

  @ApiProperty({ description: 'Preferred schedule' })
  @IsObject()
  @IsOptional()
  preferredSchedule?: Record<string, any>;

  @ApiProperty({ description: 'Available time slots', type: [Object] })
  @IsArray()
  @IsOptional()
  availableTimeSlots?: any[];
}

export class SessionStatsDto {
  @ApiProperty({ description: 'Number of pending booking requests' })
  pendingRequests: number;

  @ApiProperty({ description: 'Total earnings from sessions' })
  totalEarnings: number;

  @ApiProperty({ description: 'Number of upcoming sessions' })
  upcomingSessions: number;

  @ApiProperty({ description: 'Session completion rate percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Average bid amount' })
  averageBid: number;

  @ApiProperty({ description: 'Popular time slots', type: [String] })
  popularTimeSlots: string[];

  @ApiProperty({ description: 'Total number of sessions' })
  totalSessions: number;

  @ApiProperty({ description: 'Number of completed sessions' })
  completedSessions: number;

  @ApiProperty({ description: 'Number of cancelled sessions' })
  cancelledSessions: number;

  @ApiProperty({ description: 'Average session rating' })
  averageRating: number;

  @ApiProperty({ description: 'Total number of unique learners' })
  totalLearners: number;

  @ApiProperty({ description: 'Total number of students' })
  totalStudents: number;

  @ApiProperty({ description: 'Total number of payouts' })
  totalPayouts: number;

  @ApiProperty({ description: 'Number of pending payouts' })
  pendingPayouts: number;
}

export class InstructorCoursesQueryDto {
  @ApiProperty({ description: 'Page number', required: false })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Course status filter', required: false })
  @IsString()
  @IsOptional()
  status?: string;
}

export class InstructorReviewsQueryDto {
  @ApiProperty({ description: 'Page number', required: false })
  @IsNumber()
  @IsOptional()
  page?: number;

  @ApiProperty({ description: 'Items per page', required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Filter by rating', required: false })
  @IsNumber()
  @IsOptional()
  rating?: number;
}

export class InstructorAvailabilityQueryDto {
  @ApiProperty({ description: 'Start date (YYYY-MM-DD)', required: false })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'End date (YYYY-MM-DD)', required: false })
  @IsString()
  @IsOptional()
  endDate?: string;
}

export class InstructorDetailsResponseDto {
  @ApiProperty({ description: 'Instructor basic information' })
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
    teachingRating?: number;
    totalStudents?: number;
    totalCourses?: number;
    expertise: string[];
    qualifications: string[];
    experience?: number;
    bio?: string;
  };

  @ApiProperty({ description: 'Instructor profile details' })
  profile: any;

  @ApiProperty({ description: 'Instructor statistics' })
  stats: any;

  @ApiProperty({ description: 'Recent courses', type: [Object] })
  recentCourses: any[];

  @ApiProperty({ description: 'Recent reviews', type: [Object] })
  recentReviews: any[];

  @ApiProperty({ description: 'Instructor availability' })
  availability: any;

  @ApiProperty({ description: 'Follow data' })
  follow: {
    totalFollowers: number;
    newFollowersThisWeek: number;
    newFollowersThisMonth: number;
    isFollowing: boolean;
  };

  @ApiProperty({ description: 'Summary statistics' })
  summary: {
    totalCourses: number;
    totalReviews: number;
    averageRating: number;
    totalStudents: number;
    totalSessions: number;
    totalFollowers: number;
  };
}
