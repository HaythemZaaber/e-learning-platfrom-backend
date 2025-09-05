import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, IsDate, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum BookingStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export class CreateSessionBookingDto {
  @ApiProperty({ description: 'Time slot ID to book' })
  @IsString()
  timeSlotId: string;

  @ApiProperty({ description: 'Session offering ID' })
  @IsString()
  offeringId: string;

  @ApiProperty({ description: 'Student ID making the booking' })
  @IsString()
  studentId: string;

  @ApiProperty({ description: 'Custom topic for the session', required: false })
  @IsOptional()
  @IsString()
  customTopic?: string;

  @ApiProperty({ description: 'Student message to instructor', required: false })
  @IsOptional()
  @IsString()
  studentMessage?: string;

  @ApiProperty({ description: 'Custom requirements', required: false })
  @IsOptional()
  @IsString()
  customRequirements?: string;

  @ApiProperty({ description: 'Agreed price for the session' })
  @Type(() => Number)
  @IsNumber()
  agreedPrice: number;

  @ApiProperty({ description: 'Currency for the payment', default: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ description: 'Payment method ID if using saved payment method', required: false })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({ description: 'Return URL after payment completion' })
  @IsString()
  returnUrl: string;

  @ApiProperty({ description: 'Cancel URL if payment is cancelled' })
  @IsString()
  cancelUrl: string;
}

export class ConfirmSessionBookingDto {
  @ApiProperty({ description: 'Booking ID to confirm' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Payment intent ID from Stripe' })
  @IsString()
  paymentIntentId: string;

  @ApiProperty({ description: 'Stripe session ID', required: false })
  @IsOptional()
  @IsString()
  stripeSessionId?: string;
}

export class CompleteSessionDto {
  @ApiProperty({ description: 'Session ID to mark as completed' })
  @IsString()
  sessionId: string;

  @ApiProperty({ description: 'Session summary', required: false })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiProperty({ description: 'Instructor notes', required: false })
  @IsOptional()
  @IsString()
  instructorNotes?: string;

  @ApiProperty({ description: 'Session artifacts (files, links)', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  sessionArtifacts?: string[];

  @ApiProperty({ description: 'Actual session duration in minutes', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  actualDuration?: number;
}

export class SessionBookingFilterDto {
  @ApiProperty({ description: 'Filter by instructor ID', required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ description: 'Filter by student ID', required: false })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ description: 'Filter by booking status', required: false })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({ description: 'Filter by offering ID', required: false })
  @IsOptional()
  @IsString()
  offeringId?: string;

  @ApiProperty({ description: 'Filter by date range start', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiProperty({ description: 'Filter by date range end', required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;
}

export class CancelSessionBookingDto {
  @ApiProperty({ description: 'Booking ID to cancel' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'Reason for cancellation', required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ description: 'Whether to process refund', default: true })
  @IsOptional()
  @IsBoolean()
  processRefund?: boolean;
}

export class RescheduleSessionDto {
  @ApiProperty({ description: 'Booking ID to reschedule' })
  @IsString()
  bookingId: string;

  @ApiProperty({ description: 'New time slot ID' })
  @IsString()
  newTimeSlotId: string;

  @ApiProperty({ description: 'Reason for rescheduling', required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

