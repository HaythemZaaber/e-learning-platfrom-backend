import { IsString, IsOptional, IsObject, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentSessionDto {
  @ApiProperty({
    description: 'Course ID to enroll in',
    example: 'course_123',
  })
  @IsString()
  courseId: string;

  @ApiPropertyOptional({
    description: 'Coupon code to apply',
    example: 'WELCOME10',
  })
  @IsOptional()
  @IsString()
  couponCode?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the payment session',
    example: { source: 'web', campaign: 'summer2024' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Return URL after successful payment',
    example: 'https://example.com/success',
  })
  @IsOptional()
  @IsString()
  returnUrl?: string;

  @ApiPropertyOptional({
    description: 'Cancel URL if payment is cancelled',
    example: 'https://example.com/cancel',
  })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
