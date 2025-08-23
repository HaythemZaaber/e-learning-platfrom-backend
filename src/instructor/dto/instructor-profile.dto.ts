import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SessionType, SessionFormat, CancellationPolicy } from '../../live-sessions/dto/common.dto';

export class CreateInstructorProfileDto {
  @ApiProperty()
  @IsString()
  userId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shortBio?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experience?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  personalWebsite?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  linkedinProfile?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectsTeaching?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teachingCategories?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  languagesSpoken?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teachingStyle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teachingMethodology?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  liveSessionsEnabled?: boolean;

  @ApiProperty({ required: false, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  defaultSessionDuration?: number;

  @ApiProperty({ required: false, enum: SessionType, default: SessionType.INDIVIDUAL })
  @IsOptional()
  @IsEnum(SessionType)
  defaultSessionType?: SessionType;

  @ApiProperty({ required: false, default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  preferredGroupSize?: number;

  @ApiProperty({ required: false, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bufferBetweenSessions?: number;

  @ApiProperty({ required: false, default: 8 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSessionsPerDay?: number;

  @ApiProperty({ required: false, default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAdvanceBooking?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  autoAcceptBookings?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  instantMeetingEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  individualSessionRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  groupSessionRate?: number;

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  platformFeeRate?: number;

  @ApiProperty({ required: false, enum: CancellationPolicy, default: CancellationPolicy.MODERATE })
  @IsOptional()
  @IsEnum(CancellationPolicy)
  defaultCancellationPolicy?: CancellationPolicy;

  @ApiProperty({ required: false, enum: SessionFormat, default: SessionFormat.ONLINE })
  @IsOptional()
  @IsEnum(SessionFormat)
  defaultSessionFormat?: SessionFormat;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isAcceptingStudents?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxStudentsPerCourse?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  preferredSchedule?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  availableTimeSlots?: any[];
}

export class UpdateInstructorProfileDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shortBio?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  expertise?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  qualifications?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  experience?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  socialLinks?: Record<string, string>;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  personalWebsite?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  linkedinProfile?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  subjectsTeaching?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teachingCategories?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  languagesSpoken?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teachingStyle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  targetAudience?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  teachingMethodology?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  liveSessionsEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  defaultSessionDuration?: number;

  @ApiProperty({ required: false, enum: SessionType })
  @IsOptional()
  @IsEnum(SessionType)
  defaultSessionType?: SessionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  preferredGroupSize?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bufferBetweenSessions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSessionsPerDay?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAdvanceBooking?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoAcceptBookings?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  instantMeetingEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  individualSessionRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  groupSessionRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  platformFeeRate?: number;

  @ApiProperty({ required: false, enum: CancellationPolicy })
  @IsOptional()
  @IsEnum(CancellationPolicy)
  defaultCancellationPolicy?: CancellationPolicy;

  @ApiProperty({ required: false, enum: SessionFormat })
  @IsOptional()
  @IsEnum(SessionFormat)
  defaultSessionFormat?: SessionFormat;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAcceptingStudents?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxStudentsPerCourse?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  preferredSchedule?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  availableTimeSlots?: any[];
}
