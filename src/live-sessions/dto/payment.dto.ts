import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsDate, IsArray, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus, PaymentTiming, PayoutStatus, SessionType } from './common.dto';

export class CreatePaymentIntentDto {
  @ApiProperty()
  @IsString()
  bookingId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentMethodId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiProperty({ required: false, enum: PaymentTiming, default: PaymentTiming.BEFORE_SESSION })
  @IsOptional()
  @IsEnum(PaymentTiming)
  paymentTiming?: PaymentTiming;
}

export class UpdatePaymentStatusDto {
  @ApiProperty({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stripePaymentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  failureReason?: string;
}

export class CalculateSessionPriceDto {
  @ApiProperty()
  @IsString()
  offeringId: string;

  @ApiProperty({ enum: SessionType })
  @IsEnum(SessionType)
  sessionType: SessionType;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  participantCount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  customPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  promoCode?: string;
}

export class PaymentFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payerId?: string;

  @ApiProperty({ required: false, enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiProperty({ required: false, enum: PaymentTiming })
  @IsOptional()
  @IsEnum(PaymentTiming)
  paymentTiming?: PaymentTiming;

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
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;
}

export class PayoutFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ required: false, enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

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
  @Type(() => Number)
  @IsNumber()
  minAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAmount?: number;
}

export class CreateSessionPaymentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reservationId?: string;

  @ApiProperty()
  @IsString()
  sessionId: string;

  @ApiProperty()
  @IsString()
  payerId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: PaymentTiming, default: PaymentTiming.BEFORE_SESSION })
  @IsEnum(PaymentTiming)
  paymentTiming: PaymentTiming;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stripePaymentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date;
}

export class ProcessRefundDto {
  @ApiProperty()
  @IsString()
  bookingId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  reason: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refundDescription?: string;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isPartialRefund?: boolean;
}

export class CreateInstructorPayoutDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  sessionIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  payoutMethod?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  scheduledDate?: Date;
}

export class UpdatePayoutStatusDto {
  @ApiProperty({ enum: PayoutStatus })
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  stripePayoutId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bankTransferId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  processedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  paidAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  failedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  failureReason?: string;
}

// Interface for PaymentIntent (since it's not in the schema, we'll handle it differently)
export interface PaymentIntent {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: "requires_payment_method" | "requires_confirmation" | "requires_action" | "processing" | "requires_capture" | "canceled" | "succeeded";
  clientSecret?: string;
  createdAt: Date;
  updatedAt: Date;
}