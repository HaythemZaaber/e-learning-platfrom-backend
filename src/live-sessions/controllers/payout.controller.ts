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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PayoutService } from '../services/payout.service';
import { RestAuthGuard } from '../../auth/rest-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    clerkId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Instructor Payouts')
@ApiBearerAuth()
@UseGuards(RestAuthGuard)
@Controller('payouts')
export class PayoutController {
  constructor(private readonly payoutService: PayoutService) {}

  @Post('process')
  @ApiOperation({ summary: 'Process instructor payout for completed sessions' })
  @ApiResponse({ 
    status: 201, 
    description: 'Payout processed successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - no completed sessions found' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  @HttpCode(HttpStatus.CREATED)
  async processPayout(
    @Body() body: { sessionIds: string[] },
    @Req() req: AuthenticatedRequest
  ) {
    // Only instructors can process their own payouts
    if (req.user.role !== 'INSTRUCTOR') {
      throw new Error('Only instructors can process payouts');
    }

    return this.payoutService.processInstructorPayout(req.user.id, body.sessionIds);
  }

  @Get()
  @ApiOperation({ summary: 'Get instructor payouts' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payouts retrieved successfully' 
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by payout status' })
  async getPayouts(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: string
  ) {
    // Only instructors can view their own payouts
    if (req.user.role !== 'INSTRUCTOR') {
      throw new Error('Only instructors can view payouts');
    }

    return this.payoutService.getInstructorPayouts(req.user.id, status);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get instructor payout statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payout statistics retrieved successfully' 
  })
  async getPayoutStats(@Req() req: AuthenticatedRequest) {
    // Only instructors can view their payout stats
    if (req.user.role !== 'INSTRUCTOR') {
      throw new Error('Only instructors can view payout statistics');
    }

    return this.payoutService.getPayoutStats(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payout by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payout retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Payout not found' 
  })
  async getPayoutById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    const payout = await this.payoutService.getPayoutById(id);
    
    // Ensure instructor can only view their own payouts
    if (req.user.role === 'INSTRUCTOR' && payout.instructorId !== req.user.id) {
      throw new Error('Access denied');
    }

    return payout;
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook handler for payout events' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully' 
  })
  async handleStripeWebhook(@Body() event: any) {
    return this.payoutService.handleStripePayoutWebhook(event);
  }

  @Post('process-automatic')
  @ApiOperation({ summary: 'Process automatic payouts for all instructors' })
  @ApiResponse({ 
    status: 200, 
    description: 'Automatic payouts processed successfully' 
  })
  async processAutomaticPayouts(@Req() req: AuthenticatedRequest) {
    // Only admins can trigger automatic payouts
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
      throw new Error('Only administrators can process automatic payouts');
    }

    return this.payoutService.processAutomaticPayouts();
  }
}
