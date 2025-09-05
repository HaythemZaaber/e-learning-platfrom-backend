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
import { CreateEnrollmentDto, EnrollmentType, EnrollmentSource } from './dto/create-enrollment.dto';
import { CreateStripeConnectAccountDto } from './dto/stripe-connect.dto';
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

  @Get('enrollments/free/validate/:courseId')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate if a course can be enrolled for free' })
  @ApiResponse({
    status: 200,
    description: 'Validation result',
    schema: {
      type: 'object',
      properties: {
        canEnroll: { type: 'boolean' },
        course: { type: 'object' },
        error: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async validateFreeCourseEnrollment(
    @Param('courseId') courseId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    return this.paymentService.validateFreeCourseEnrollment(courseId, userId);
  }

  @Post('enrollments/free')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a free course directly' })
  @ApiResponse({
    status: 201,
    description: 'Free course enrollment created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        enrollment: { type: 'object' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - Course is not free' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @HttpCode(HttpStatus.CREATED)
  async enrollInFreeCourse(
    @Body() dto: { courseId: string; notes?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user.id;
    
    // Validate free course enrollment first
    const validation = await this.paymentService.validateFreeCourseEnrollment(dto.courseId, userId);
    
    if (!validation.canEnroll) {
      throw new BadRequestException(validation.error);
    }
    
    const result = await this.paymentService.createEnrollment(
      {
        courseId: dto.courseId,
        type: EnrollmentType.FREE,
        source: EnrollmentSource.DIRECT,
        notes: dto.notes || 'Free course enrollment',
      },
      userId,
    );
    
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

  // =============================================================================
  // STRIPE CONNECT ENDPOINTS
  // =============================================================================

  @Post('connect/accounts')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Connect account for instructor' })
  @ApiResponse({ 
    status: 201, 
    description: 'Stripe Connect account created successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors or account already exists' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @HttpCode(HttpStatus.CREATED)
  async createStripeConnectAccount(
    @Body() accountData: CreateStripeConnectAccountDto,
    @Req() req: AuthenticatedRequest
  ) {
    // Only instructors can create Connect accounts
    if (req.user.role !== 'INSTRUCTOR') {
      throw new BadRequestException('Only instructors can create Stripe Connect accounts');
    }

    return this.paymentService.createStripeConnectAccount(req.user.id, accountData);
  }

  @Get('connect/accounts')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor Stripe Connect account details' })
  @ApiResponse({ 
    status: 200, 
    description: 'Stripe Connect account retrieved successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Instructor has not set up Stripe Connect account' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getStripeConnectAccount(@Req() req: AuthenticatedRequest) {
    // Only instructors can view their Connect accounts
    if (req.user.role !== 'INSTRUCTOR') {
      throw new BadRequestException('Only instructors can view Stripe Connect accounts');
    }

    return this.paymentService.getStripeConnectAccount(req.user.id);
  }

  @Post('connect/accounts/links')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Connect account onboarding link' })
  @ApiResponse({ 
    status: 200, 
    description: 'Stripe Connect account link created successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Instructor has not set up Stripe Connect account' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async createStripeConnectAccountLink(@Req() req: AuthenticatedRequest) {
    // Only instructors can create account links
    if (req.user.role !== 'INSTRUCTOR') {
      throw new BadRequestException('Only instructors can view Stripe Connect accounts');
    }

    return this.paymentService.createStripeConnectAccountLink(req.user.id);
  }

  @Post('connect/accounts/capabilities')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update Stripe Connect account capabilities' })
  @ApiResponse({ 
    status: 200, 
    description: 'Stripe Connect account capabilities updated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Instructor has not set up Stripe Connect account' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async updateStripeConnectAccountCapabilities(@Req() req: AuthenticatedRequest) {
    // Only instructors can update their account capabilities
    if (req.user.role !== 'INSTRUCTOR') {
      throw new BadRequestException('Only instructors can update Stripe Connect account capabilities');
    }

    return this.paymentService.updateStripeConnectAccountCapabilities(req.user.id);
  }

  @Post('webhook/connect')
  @ApiOperation({ summary: 'Stripe Connect webhook handler' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully' 
  })
  async handleStripeConnectWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>
  ) {
    return this.paymentService.handleStripeConnectWebhook(req.body);
  }
}
