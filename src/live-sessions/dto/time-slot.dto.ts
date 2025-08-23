import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDate, IsNumber, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTimeSlotDto {
  @ApiProperty()
  @IsString()
  availabilityId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startTime: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endTime: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  date: Date;

  @ApiProperty()
  @IsNumber()
  dayOfWeek: number;

  @ApiProperty()
  @IsNumber()
  slotDuration: number;

  @ApiProperty()
  @IsString()
  timezone: string;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  maxBookings?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  currentBookings?: number;

  @ApiProperty({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isBooked?: boolean;

  @ApiProperty({ default: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

export class UpdateTimeSlotDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startTime?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endTime?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  slotDuration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  maxBookings?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  currentBookings?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBooked?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

export class GetTimeSlotsFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  availabilityId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  date?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBooked?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;
}

export class GenerateTimeSlotsDto {
  @ApiProperty()
  @IsString()
  availabilityId: string;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty()
  @Type(() => Date)
  @IsDate()
  endDate: Date;
}

export class CheckTimeSlotAvailabilityDto {
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

export class BlockTimeSlotDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}
