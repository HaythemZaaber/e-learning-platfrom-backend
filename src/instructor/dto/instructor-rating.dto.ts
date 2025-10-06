import { ApiProperty } from '@nestjs/swagger';
import {
  IsNumber,
  IsString,
  IsOptional,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateInstructorRatingDto {
  @ApiProperty({
    description: 'The instructor ID to rate',
    example: 'clr1234567890',
  })
  @IsString()
  instructorId: string;

  @ApiProperty({
    description: 'Rating from 1.0 to 5.0 stars',
    example: 4.5,
    minimum: 1.0,
    maximum: 5.0,
  })
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  rating: number;

  @ApiProperty({
    description: 'Optional comment about the instructor',
    example: 'Great instructor! Very knowledgeable and patient.',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Whether the rating should be public',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateInstructorRatingDto {
  @ApiProperty({
    description: 'Updated rating from 1.0 to 5.0 stars',
    example: 4.5,
    minimum: 1.0,
    maximum: 5.0,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1.0)
  @Max(5.0)
  rating?: number;

  @ApiProperty({
    description: 'Updated comment about the instructor',
    example: 'Updated: Great instructor! Very knowledgeable and patient.',
    required: false,
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiProperty({
    description: 'Whether the rating should be public',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class InstructorRatingResponseDto {
  @ApiProperty({
    description: 'Rating ID',
    example: 'clr1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Instructor ID',
    example: 'clr1234567890',
  })
  instructorId: string;

  @ApiProperty({
    description: 'Student ID who gave the rating',
    example: 'clr1234567890',
  })
  studentId: string;

  @ApiProperty({
    description: 'Rating from 1.0 to 5.0 stars',
    example: 4.5,
  })
  rating: number;

  @ApiProperty({
    description: 'Rating comment',
    example: 'Great instructor!',
    required: false,
  })
  comment?: string;

  @ApiProperty({
    description: 'Whether the rating is verified',
    example: true,
  })
  isVerified: boolean;

  @ApiProperty({
    description: 'Whether the rating is public',
    example: true,
  })
  isPublic: boolean;

  @ApiProperty({
    description: 'Number of helpful votes',
    example: 3,
  })
  helpfulVotes: number;

  @ApiProperty({
    description: 'Rating creation date',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Rating last update date',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Student details',
    required: false,
  })
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
}

export class InstructorRatingStatsDto {
  @ApiProperty({
    description: 'Total number of ratings',
    example: 25,
  })
  totalRatings: number;

  @ApiProperty({
    description: 'Average rating',
    example: 4.2,
  })
  averageRating: number;

  @ApiProperty({
    description: 'Rating distribution',
    example: {
      1: 1,
      2: 2,
      3: 5,
      4: 8,
      5: 9,
    },
  })
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export class RatingEligibilityDto {
  @ApiProperty({
    description: 'Whether the student is eligible to rate the instructor',
    example: true,
  })
  isEligible: boolean;

  @ApiProperty({
    description: 'Reason why the student is or is not eligible',
    example:
      'You have enrolled in courses with this instructor and completed live sessions.',
  })
  reason: string;

  @ApiProperty({
    description: 'List of course enrollments that make the student eligible',
    example: ['clr1234567890', 'clr0987654321'],
    required: false,
  })
  courseEnrollments?: string[];

  @ApiProperty({
    description:
      'List of completed live sessions that make the student eligible',
    example: ['clr1111111111', 'clr2222222222'],
    required: false,
  })
  completedSessions?: string[];
}
