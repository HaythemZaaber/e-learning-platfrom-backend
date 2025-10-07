import {
  IsString,
  IsOptional,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStoryReelDto {
  @ApiProperty({ required: false, description: 'Caption for the story/reel' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({
    required: false,
    description: 'Duration of the video in seconds (from frontend)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  duration?: number;

  @ApiProperty({
    required: false,
    description: 'Whether the story/reel is public or private',
    default: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return true;
  })
  @IsBoolean()
  isPublic?: boolean = true;
}

export class LikeStoryReelDto {
  @ApiProperty({ description: 'ID of the story or reel to like/unlike' })
  @IsNotEmpty()
  @IsString()
  id: string;
}

export class GetStoriesReelsDto {
  @ApiProperty({
    required: false,
    description: 'Page number for pagination',
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({
    required: false,
    description: 'Number of items per page',
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class StoryReelResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  mediaUrl: string;

  @ApiProperty()
  mediaType: string;

  @ApiProperty({ required: false })
  caption?: string;

  @ApiProperty({ required: false })
  duration?: number;

  @ApiProperty()
  views: number;

  @ApiProperty()
  likesCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  expiresAt?: Date;

  @ApiProperty()
  instructor: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    profileImage?: string;
  };

  @ApiProperty({ required: false })
  isLiked?: boolean;
}

export class PaginatedResponseDto<T> {
  @ApiProperty()
  data: T[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  hasMore: boolean;
}
