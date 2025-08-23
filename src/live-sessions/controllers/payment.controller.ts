import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    HttpCode,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { PaymentService } from '../services/payment.service';
  import { 
    CreatePaymentIntentDto,
    UpdatePaymentStatusDto,
    CreateSessionPaymentDto,
    ProcessRefundDto,
    CreateInstructorPayoutDto,
    UpdatePayoutStatusDto,
    CalculateSessionPriceDto,
    PaymentFilterDto,
    PayoutFilterDto
  } from '../dto/payment.dto';
  import { PaymentStatus, PayoutStatus, SessionType } from '../dto/common.dto';
  import { RestAuthGuard } from '../../auth/rest-auth.guard';
  
  @ApiTags('Payments')
  @ApiBearerAuth()
  @UseGuards(RestAuthGuard)
  @Controller('payments')
  export class PaymentController {
    constructor(private readonly paymentService: PaymentService) {}
  
    @Post('payment-intents')
    @ApiOperation({ summary: 'Create payment intent' })
    @ApiResponse({ 
      status: 201, 
      description: 'Payment intent created successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Booking request not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Booking request not accepted' 
    })
    async createPaymentIntent(@Body() createPaymentIntentDto: CreatePaymentIntentDto) {
      return this.paymentService.createPaymentIntent(createPaymentIntentDto);
    }
  
    @Patch('payment-intents/:paymentIntentId')
    @ApiOperation({ summary: 'Update payment status' })
    @ApiResponse({ 
      status: 200, 
      description: 'Payment status updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Payment intent not found' 
    })
    async updatePaymentStatus(
      @Param('paymentIntentId') paymentIntentId: string,
      @Body() updatePaymentStatusDto: UpdatePaymentStatusDto
    ) {
      return this.paymentService.updatePaymentStatus(paymentIntentId, updatePaymentStatusDto);
    }
  
    @Post('session-payments')
    @ApiOperation({ summary: 'Create session payment' })
    @ApiResponse({ 
      status: 201, 
      description: 'Session payment created successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session or payer not found' 
    })
    async createSessionPayment(@Body() createSessionPaymentDto: CreateSessionPaymentDto) {
      return this.paymentService.createSessionPayment(createSessionPaymentDto);
    }
  
    @Post('refund')
    @ApiOperation({ summary: 'Process refund' })
    @ApiResponse({ 
      status: 200, 
      description: 'Refund processed successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Booking request not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Cannot refund unpaid booking' 
    })
    async processRefund(@Body() processRefundDto: ProcessRefundDto) {
      return this.paymentService.processRefund(processRefundDto);
    }
  
    @Get('live-sessions/:sessionId/payments')
    @ApiOperation({ summary: 'Get payments for a session' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session payments retrieved successfully' 
    })
    async getSessionPayments(@Param('sessionId') sessionId: string) {
      return this.paymentService.getSessionPayments(sessionId);
    }
  
    @Post('instructor-payouts')
    @ApiOperation({ summary: 'Create instructor payout' })
    @ApiResponse({ 
      status: 201, 
      description: 'Payout created successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Some sessions not eligible for payout' 
    })
    async createInstructorPayout(@Body() createInstructorPayoutDto: CreateInstructorPayoutDto) {
      return this.paymentService.createInstructorPayout(createInstructorPayoutDto);
    }
  
    @Get('instructor-payouts')
    @ApiOperation({ summary: 'Get instructor payouts' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor payouts retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: true, description: 'Instructor ID' })
    @ApiQuery({ name: 'status', required: false, enum: PayoutStatus, description: 'Filter by status' })
    async getInstructorPayouts(
      @Query('instructorId') instructorId: string,
      @Query('status') status?: PayoutStatus
    ) {
      return this.paymentService.getInstructorPayouts(instructorId, status);
    }
  
    @Patch('instructor-payouts/:payoutId')
    @ApiOperation({ summary: 'Update payout status' })
    @ApiResponse({ 
      status: 200, 
      description: 'Payout status updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Payout not found' 
    })
    async updatePayoutStatus(
      @Param('payoutId') payoutId: string,
      @Body() updatePayoutStatusDto: UpdatePayoutStatusDto
    ) {
      return this.paymentService.updatePayoutStatus(payoutId, updatePayoutStatusDto);
    }
  
    @Post('pricing/calculate')
    @ApiOperation({ summary: 'Calculate session price' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session price calculated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session offering not found' 
    })
    async calculateSessionPrice(@Body() calculateSessionPriceDto: CalculateSessionPriceDto) {
      return this.paymentService.calculateSessionPrice(calculateSessionPriceDto);
    }
  }