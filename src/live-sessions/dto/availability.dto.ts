import { IsString, IsOptional, IsNumber, IsBoolean, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAvailabilityDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  specificDate: Date;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;

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

  @ApiProperty({ required: false, default: 12 })
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

export class UpdateAvailabilityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  specificDate?: Date;

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

export class GenerateTimeSlotsDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}

export class CheckAvailabilityDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty()
  @IsString()
  startTime: string;

  @ApiProperty()
  @IsString()
  endTime: string;
}

export class GetAvailabilityFilterDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

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

export class GetAvailableTimeSlotsDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  offeringId?: string;
}