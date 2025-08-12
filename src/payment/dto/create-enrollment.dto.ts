import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EnrollmentType {
  FREE = 'FREE',
  PAID = 'PAID',
  SUBSCRIPTION = 'SUBSCRIPTION',
  INVITATION_ONLY = 'INVITATION_ONLY',
  WAITLIST = 'WAITLIST',
}

export enum EnrollmentSource {
  DIRECT = 'DIRECT',
  REFERRAL = 'REFERRAL',
  PROMOTION = 'PROMOTION',
  BUNDLE = 'BUNDLE',
  LEARNING_PATH = 'LEARNING_PATH',
}

export class CreateEnrollmentDto {
  @ApiProperty({
    description: 'Course ID to enroll in',
    example: 'course_123',
  })
  @IsString()
  courseId: string;

  @ApiPropertyOptional({
    description: 'Payment session ID if paid enrollment',
    example: 'ps_123456789',
  })
  @IsOptional()
  @IsString()
  paymentSessionId?: string;

  @ApiPropertyOptional({
    description: 'Enrollment type',
    enum: EnrollmentType,
    default: EnrollmentType.FREE,
  })
  @IsOptional()
  @IsEnum(EnrollmentType)
  type?: EnrollmentType = EnrollmentType.FREE;

  @ApiPropertyOptional({
    description: 'Enrollment source',
    enum: EnrollmentSource,
    default: EnrollmentSource.DIRECT,
  })
  @IsOptional()
  @IsEnum(EnrollmentSource)
  source?: EnrollmentSource = EnrollmentSource.DIRECT;

  @ApiPropertyOptional({
    description: 'Additional notes for the enrollment',
    example: 'Enrolled through summer promotion',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
