import { IsString, IsOptional, IsBoolean, IsEnum, IsArray, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SessionType, TopicDifficulty } from './common.dto';

export class CreateSessionTopicDto {
  @ApiProperty()
  @IsString()
  instructorId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, enum: TopicDifficulty, default: TopicDifficulty.BEGINNER })
  @IsOptional()
  @IsEnum(TopicDifficulty)
  difficulty?: TopicDifficulty;

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false, default: true })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  suggestedDuration?: number;

  @ApiProperty({ required: false, enum: SessionType })
  @IsOptional()
  @IsEnum(SessionType)
  suggestedFormat?: SessionType;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];
}

export class UpdateSessionTopicDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, enum: TopicDifficulty })
  @IsOptional()
  @IsEnum(TopicDifficulty)
  difficulty?: TopicDifficulty;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  suggestedDuration?: number;

  @ApiProperty({ required: false, enum: SessionType })
  @IsOptional()
  @IsEnum(SessionType)
  suggestedFormat?: SessionType;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  materials?: string[];
}

export class GetSessionTopicsFilterDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  instructorId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false, enum: TopicDifficulty })
  @IsOptional()
  @IsEnum(TopicDifficulty)
  difficulty?: TopicDifficulty;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRating?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
