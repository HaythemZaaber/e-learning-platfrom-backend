import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecurringAvailabilityRuleDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty({
    description: 'Day of week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday',
  })
  @Type(() => Number)
  @IsNumber()
  dayOfWeek: number;

  @ApiProperty({ description: 'Start time in HH:MM format' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'End time in HH:MM format' })
  @IsString()
  endTime: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSessionsInSlot?: number;

  @ApiProperty({ required: false, default: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  defaultSlotDuration?: number;

  @ApiProperty({ required: false, default: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAdvanceHours?: number;

  @ApiProperty({ required: false, default: 720 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAdvanceHours?: number;

  @ApiProperty({ required: false, default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bufferMinutes?: number;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  autoAcceptBookings?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceOverride?: number;

  @ApiProperty({ required: false, default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;
}

export class UpdateRecurringAvailabilityRuleDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dayOfWeek?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

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
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSessionsInSlot?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  defaultSlotDuration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minAdvanceHours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxAdvanceHours?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bufferMinutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  autoAcceptBookings?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  priceOverride?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;
}

export enum AvailabilityOverrideType {
  BLOCK = 'BLOCK',
  MODIFY = 'MODIFY',
}

export class CreateAvailabilityDateOverrideDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recurringRuleId?: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  specificDate: Date;

  @ApiProperty({ enum: AvailabilityOverrideType })
  @IsEnum(AvailabilityOverrideType)
  overrideType: AvailabilityOverrideType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSessionsInSlot?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bufferMinutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class UpdateAvailabilityDateOverrideDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  specificDate?: Date;

  @ApiProperty({ required: false, enum: AvailabilityOverrideType })
  @IsOptional()
  @IsEnum(AvailabilityOverrideType)
  overrideType?: AvailabilityOverrideType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxSessionsInSlot?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  bufferMinutes?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class RecurringAvailabilityRuleFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  dayOfWeek?: number;
}

export class AvailabilityDateOverrideFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

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

  @ApiProperty({ required: false, enum: AvailabilityOverrideType })
  @IsOptional()
  @IsEnum(AvailabilityOverrideType)
  overrideType?: AvailabilityOverrideType;
}
