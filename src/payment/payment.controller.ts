import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpStatus,
  HttpCode,
  BadRequestException,
  RawBodyRequest,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    clerkId: string;
    email: string;
    role: string;
  };
}
import { PaymentService } from './payment.service';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { RestAuthGuard } from '../auth/rest-auth.guard';

@ApiTags('Payment')
@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Post('sessions')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a payment session for course enrollment' })
  @ApiResponse({
    status: 201,
    description: 'Payment session created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        session: { type: 'object' },
        redirectUrl: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @HttpCode(HttpStatus.CREATED)
  async createPaymentSession(
    @Body() dto: CreatePaymentSessionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    const result = await this.paymentService.createPaymentSession(dto, userId);
    
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    
    return result;
  }

  @Get('sessions/:id')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment session details' })
  @ApiResponse({
    status: 200,
    description: 'Payment session retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment session not found' })
  async getPaymentSession(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.paymentService.getPaymentSession(id, userId);
  }

  @Get('sessions/stripe/:stripeSessionId')
  @ApiOperation({ summary: 'Get payment session by Stripe session ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment session retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Payment session not found' })
  async getPaymentSessionByStripeId(@Param('stripeSessionId') stripeSessionId: string) {
    try {
      const session = await this.paymentService.getPaymentSessionByStripeId(stripeSessionId);
      return {
        success: true,
        session,
        message: 'Payment session found',
      };
    } catch (error) {
      return {
        success: false,
        session: null,
        error: error.message,
        message: 'Payment session not found',
      };
    }
  }

  @Post('sessions/:id/cancel')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel a payment session' })
  @ApiResponse({
    status: 200,
    description: 'Payment session canceled successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Payment session not found' })
  async cancelPaymentSession(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.paymentService.cancelPaymentSession(id, userId);
  }

  @Post('coupons/validate')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiResponse({
    status: 200,
    description: 'Coupon validation result',
    schema: {
      type: 'object',
      properties: {
        isValid: { type: 'boolean' },
        coupon: { type: 'object' },
        discountAmount: { type: 'number' },
        finalAmount: { type: 'number' },
        error: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async validateCoupon(@Body() dto: ValidateCouponDto) {
    return this.paymentService.validateCoupon(dto);
  }

  @Get('coupons/active')
  @ApiOperation({ summary: 'Get all active coupons' })
  @ApiResponse({
    status: 200,
    description: 'Active coupons retrieved successfully',
  })
  async getActiveCoupons() {
    return this.paymentService.getActiveCoupons();
  }

  @Post('webhooks/stripe')
  @ApiOperation({ summary: 'Handle Stripe webhooks' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook signature' })
  
  async handleStripeWebhook(@Headers('stripe-signature') signature: string,
  @Req() req: RawBodyRequest<Request>) {
     console.log(signature);
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature');
    }

    const event = this.paymentService.constructWebhookEvent(req.rawBody, signature);
    return this.paymentService.handleWebhook(event);
  }

  @Post('enrollments')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a course enrollment' })
  @ApiResponse({
    status: 201,
    description: 'Enrollment created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        enrollment: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @HttpCode(HttpStatus.CREATED)
  async createEnrollment(
    @Body() dto: CreateEnrollmentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    const result = await this.paymentService.createEnrollment(dto, userId);
    
    if (!result.success) {
      throw new BadRequestException(result.error);
    }
    
    return result;
  }

  @Get('enrollments')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user enrollments' })
  @ApiResponse({
    status: 200,
    description: 'User enrollments retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserEnrollments(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.paymentService.getUserEnrollments(userId);
  }

  @Get('enrollments/course/:courseId')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enrollment for specific course' })
  @ApiResponse({
    status: 200,
    description: 'Course enrollment retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Enrollment not found' })
  async getCourseEnrollment(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    const enrollments = await this.paymentService.getUserEnrollments(userId);
    const enrollment = enrollments.find(e => e.courseId === courseId);
    
    if (!enrollment) {
      throw new BadRequestException('Enrollment not found for this course');
    }

    console.log(enrollment);
    
    return enrollment;
  }
}
