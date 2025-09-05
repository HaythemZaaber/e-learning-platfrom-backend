import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, IsDate } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { 
  LiveSessionType, 
  SessionFormat, 
  SessionMode, 
  SessionStatus, 
  SessionType,
  PayoutStatus 
} from './common.dto';

export class CreateLiveSessionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bookingRequestId?: string;

  @ApiProperty()
  @IsString()
  offeringId: string;

  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty({ required: false, enum: LiveSessionType })
  @IsOptional()
  @IsEnum(LiveSessionType)
  sessionType?: LiveSessionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  lectureId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? null : value)
  topicId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customTopic?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  finalTopic?: string;

  @ApiProperty({ required: false, enum: SessionFormat })
  @IsOptional()
  @IsEnum(SessionFormat)
  format?: SessionFormat;

  @ApiProperty({ required: false, enum: SessionFormat })
  @IsOptional()
  @IsEnum(SessionFormat)
  sessionFormat?: SessionFormat;

  @ApiProperty({ required: false, enum: SessionMode })
  @IsOptional()
  @IsEnum(SessionMode)
  sessionMode?: SessionMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxParticipants?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minParticipants?: number;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  scheduledStart: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledEnd?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timeSlotId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingRoomId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingPassword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  recordingEnabled?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pricePerPerson?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateLiveSessionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  finalTopic?: string;

  @ApiProperty({ required: false, enum: SessionFormat })
  @IsOptional()
  @IsEnum(SessionFormat)
  format?: SessionFormat;

  @ApiProperty({ required: false, enum: SessionFormat })
  @IsOptional()
  @IsEnum(SessionFormat)
  sessionFormat?: SessionFormat;

  @ApiProperty({ required: false, enum: SessionMode })
  @IsOptional()
  @IsEnum(SessionMode)
  sessionMode?: SessionMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxParticipants?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minParticipants?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledStart?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledEnd?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false, enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingRoomId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingPassword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  recordingEnabled?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sessionNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sessionArtifacts?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pricePerPerson?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  totalRevenue?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  platformFee?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  instructorPayout?: number;

  @ApiProperty({ required: false, enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  payoutStatus?: PayoutStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualStart?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  actualEnd?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualDuration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  currentParticipants?: number;
}

export class StartLiveSessionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  meetingPassword?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorNotes?: string;
}

export class EndLiveSessionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorNotes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sessionArtifacts?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualDuration?: number;
}

export class CancelLiveSessionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellationMessage?: string;
}

export class RescheduleLiveSessionDto {
  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  newStartTime: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  newEndTime: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  rescheduleMessage?: string;
}

export class LiveSessionFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ required: false, enum: SessionStatus })
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  @ApiProperty({ required: false, enum: LiveSessionType })
  @IsOptional()
  @IsEnum(LiveSessionType)
  sessionType?: LiveSessionType;

  @ApiProperty({ required: false, enum: SessionFormat })
  @IsOptional()
  @IsEnum(SessionFormat)
  format?: SessionFormat;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiProperty({ required: false, enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  payoutStatus?: PayoutStatus;
}