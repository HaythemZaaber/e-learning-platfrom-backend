import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { BookingMode, BookingStatus, PaymentStatus } from './common.dto';

export class CreateBookingRequestDto {
  @ApiProperty()
  @IsString()
  offeringId: string;

  @ApiProperty()
  @IsString()
  studentId: string;

  @ApiProperty({ enum: BookingMode, default: BookingMode.REQUEST })
  @IsEnum(BookingMode)
  bookingMode: BookingMode;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  preferredDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preferredTime?: string;

  @ApiProperty({ required: false, type: [Date] })
  @IsOptional()
  @IsArray()
  @Type(() => Date)
  @IsDate({ each: true })
  alternativeDates?: Date[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timeSlotId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customTopic?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topicDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customRequirements?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  studentMessage?: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  offeredPrice: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priority?: number;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  expiresAt: Date;
}

export class UpdateBookingRequestDto {
  @ApiProperty({ required: false, enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorResponse?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  preferredDate?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  preferredTime?: string;

  @ApiProperty({ required: false, type: [Date] })
  @IsOptional()
  @IsArray()
  @Type(() => Date)
  @IsDate({ each: true })
  alternativeDates?: Date[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timeSlotId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customTopic?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topicDescription?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customRequirements?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  studentMessage?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  finalPrice?: number;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentIntentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stripeSessionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  expiresAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rescheduleCount?: number;
}

export class AcceptBookingRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  response?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  finalPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timeSlotId?: string;

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
}

export class RejectBookingRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  response?: string;
}

export class CancelBookingRequestDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancellationMessage?: string;
}

export class BookingRequestFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ required: false, enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  offeringId?: string;

  @ApiProperty({ required: false, enum: BookingMode })
  @IsOptional()
  @IsEnum(BookingMode)
  bookingMode?: BookingMode;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

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