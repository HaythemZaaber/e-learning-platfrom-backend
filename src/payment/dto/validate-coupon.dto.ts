import { IsString, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponDto {
  @ApiProperty({
    description: 'Coupon code to validate',
    example: 'WELCOME10',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Course ID for coupon validation',
    example: 'course_123',
  })
  @IsString()
  courseId: string;

  @ApiProperty({
    description: 'Original amount in cents',
    example: 9900,
  })
  @IsNumber()
  @Min(0)
  amount: number;
}
