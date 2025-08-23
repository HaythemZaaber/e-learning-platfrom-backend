import { IsString, IsOptional, IsNumber, IsBoolean, IsEnum, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SessionType, SessionFormat, SessionTopicType, CancellationPolicy } from './common.dto';

export class CreateSessionOfferingDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ enum: SessionTopicType, default: SessionTopicType.FIXED })
  @IsEnum(SessionTopicType)
  topicType: SessionTopicType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fixedTopic?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ enum: SessionType, default: SessionType.INDIVIDUAL })
  @IsEnum(SessionType)
  sessionType: SessionType;

  @ApiProperty({ enum: SessionFormat, default: SessionFormat.ONLINE })
  @IsEnum(SessionFormat)
  sessionFormat: SessionFormat;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  duration: number;

  @ApiProperty({ default: 1 })
  @Type(() => Number)
  @IsNumber()
  capacity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minParticipants?: number;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  basePrice: number;

  @ApiProperty({ default: 'USD' })
  @IsString()
  currency: string;

  @ApiProperty({ enum: CancellationPolicy, default: CancellationPolicy.MODERATE })
  @IsEnum(CancellationPolicy)
  cancellationPolicy: CancellationPolicy;

  @ApiProperty({ default: true })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  isPublic: boolean;

  @ApiProperty({ default: false })
  @IsBoolean()
  requiresApproval: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiProperty({ default: false })
  @IsBoolean()
  recordingEnabled: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  whiteboardEnabled: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  screenShareEnabled: boolean;

  @ApiProperty({ default: true })
  @IsBoolean()
  chatEnabled: boolean;
}

export class UpdateSessionOfferingDto {
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
  shortDescription?: string;

  @ApiProperty({ required: false, enum: SessionTopicType })
  @IsOptional()
  @IsEnum(SessionTopicType)
  topicType?: SessionTopicType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fixedTopic?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiProperty({ required: false, enum: SessionType })
  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType;

  @ApiProperty({ required: false, enum: SessionFormat })
  @IsOptional()
  @IsEnum(SessionFormat)
  sessionFormat?: SessionFormat;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  duration?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minParticipants?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  basePrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ required: false, enum: CancellationPolicy })
  @IsOptional()
  @IsEnum(CancellationPolicy)
  cancellationPolicy?: CancellationPolicy;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipment?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  recordingEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  whiteboardEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  screenShareEnabled?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  chatEnabled?: boolean;
}

export class SessionOfferingFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, enum: SessionType })
  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType;

  @ApiProperty({ required: false, enum: SessionTopicType })
  @IsOptional()
  @IsEnum(SessionTopicType)
  topicType?: SessionTopicType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  domain?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;
}