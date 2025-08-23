import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean, IsDate, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum SessionType {
  INDIVIDUAL = "INDIVIDUAL",
  SMALL_GROUP = "SMALL_GROUP",
  LARGE_GROUP = "LARGE_GROUP",
  WORKSHOP = "WORKSHOP",
  MASTERCLASS = "MASTERCLASS"
}

export enum SessionFormat {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
  HYBRID = "HYBRID"
}

export enum SessionStatus {
  SCHEDULED = "SCHEDULED",
  CONFIRMED = "CONFIRMED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW",
  RESCHEDULED = "RESCHEDULED"
}

export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED"
}

export enum CancellationPolicy {
  FLEXIBLE = "FLEXIBLE",
  MODERATE = "MODERATE",
  STRICT = "STRICT"
}

export enum SessionTopicType {
  FIXED = "FIXED",
  FLEXIBLE = "FLEXIBLE",
  HYBRID = "HYBRID"
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PAID = "PAID",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
  FREE = "FREE",
  PARTIAL_REFUND = "PARTIAL_REFUND",
  CANCELED = "CANCELED",
  EXPIRED = "EXPIRED"
}

export enum PaymentTiming {
  BEFORE_SESSION = "BEFORE_SESSION",
  AFTER_SESSION = "AFTER_SESSION",
  ON_COMPLETION = "ON_COMPLETION"
}

export enum BookingMode {
  REQUEST = "REQUEST",
  DIRECT = "DIRECT"
}

export enum ReservationStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  COMPLETED = "COMPLETED",
  NO_SHOW = "NO_SHOW"
}

export enum AttendanceStatus {
  NOT_ATTENDED = "NOT_ATTENDED",
  PRESENT = "PRESENT",
  ABSENT = "ABSENT",
  LATE = "LATE",
  LEFT_EARLY = "LEFT_EARLY",
  PARTIAL = "PARTIAL"
}

export enum PayoutStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  PAID = "PAID",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED"
}

export enum TopicDifficulty {
  BEGINNER = "BEGINNER",
  INTERMEDIATE = "INTERMEDIATE",
  ADVANCED = "ADVANCED",
  EXPERT = "EXPERT"
}

export enum NotificationType {
  BOOKING_RECEIVED = "BOOKING_RECEIVED",
  BOOKING_ACCEPTED = "BOOKING_ACCEPTED",
  BOOKING_REJECTED = "BOOKING_REJECTED",
  SESSION_REMINDER = "SESSION_REMINDER",
  SESSION_STARTING = "SESSION_STARTING",
  SESSION_COMPLETED = "SESSION_COMPLETED",
  PAYMENT_RECEIVED = "PAYMENT_RECEIVED",
  PAYOUT_PROCESSED = "PAYOUT_PROCESSED",
  TOPIC_APPROVAL_NEEDED = "TOPIC_APPROVAL_NEEDED",
  SCHEDULE_CONFLICT = "SCHEDULE_CONFLICT",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT"
}

export enum DeliveryStatus {
  QUEUED = "QUEUED",
  SENT = "SENT",
  FAILED = "FAILED",
  RETRYING = "RETRYING"
}

export enum LiveSessionType {
  COURSE_BASED = "COURSE_BASED",
  CUSTOM = "CUSTOM"
}

export enum SessionMode {
  LIVE = "LIVE",
  RECORDED = "RECORDED",
  BLENDED = "BLENDED"
}

export enum ParticipantRole {
  STUDENT = "STUDENT",
  INSTRUCTOR = "INSTRUCTOR",
  ASSISTANT = "ASSISTANT",
  OBSERVER = "OBSERVER"
}

export enum ParticipantStatus {
  ENROLLED = "ENROLLED",
  ATTENDED = "ATTENDED",
  NO_SHOW = "NO_SHOW",
  CANCELLED = "CANCELLED",
  REFUNDED = "REFUNDED"
}

export enum DeviceType {
  DESKTOP = "DESKTOP",
  MOBILE = "MOBILE",
  TABLET = "TABLET"
}

export enum ReviewType {
  SESSION = "SESSION",
  INSTRUCTOR = "INSTRUCTOR"
}

export class PaginationDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 10;
}

export class FilterDto extends PaginationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

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
}