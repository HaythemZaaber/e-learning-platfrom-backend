import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDate,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum InstanceStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class CreateGroupOfferingInstanceDto {
  @ApiProperty()
  @IsString()
  offeringId: string;

  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty({ description: 'Scheduled start date and time' })
  @Type(() => Date)
  @IsDate()
  scheduledStart: Date;

  @ApiProperty({ description: 'Scheduled end date and time' })
  @Type(() => Date)
  @IsDate()
  scheduledEnd: Date;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;
}

export class UpdateGroupOfferingInstanceDto {
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
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;

  @ApiProperty({ required: false, enum: InstanceStatus })
  @IsOptional()
  @IsEnum(InstanceStatus)
  status?: InstanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  cancelReason?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  cancelledAt?: Date;
}

export class GroupInstanceFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  offeringId?: string;

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

  @ApiProperty({ required: false, enum: InstanceStatus })
  @IsOptional()
  @IsEnum(InstanceStatus)
  status?: InstanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isBookable?: boolean;
}
