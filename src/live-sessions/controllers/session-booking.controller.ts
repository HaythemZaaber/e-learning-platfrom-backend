import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SessionBookingService } from '../services/session-booking.service';
import { 
  CreateSessionBookingDto,
  ConfirmSessionBookingDto,
  CompleteSessionDto,
  SessionBookingFilterDto,
  CancelSessionBookingDto,
  RescheduleSessionDto
} from '../dto/session-booking.dto';
import { RestAuthGuard } from '../../auth/rest-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    clerkId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Session Booking')
@ApiBearerAuth()
@UseGuards(RestAuthGuard)
@Controller('session-bookings')
export class SessionBookingController {
  constructor(private readonly sessionBookingService: SessionBookingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new session booking with payment' })
  @ApiResponse({ 
    status: 201, 
    description: 'Session booking created successfully with payment intent' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors or slot not available' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Time slot, offering, or student not found' 
  })
  @HttpCode(HttpStatus.CREATED)
  async createSessionBooking(
    @Body() createDto: CreateSessionBookingDto,
    @Req() req: AuthenticatedRequest
  ) {
    // Ensure the authenticated user is the student making the booking
    if (req.user.id !== createDto.studentId) {
      throw new Error('You can only create bookings for yourself');
    }

    return this.sessionBookingService.createSessionBooking(createDto);
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm session booking after payment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session booking confirmed and live session created' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Payment intent not ready for capture' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Booking request not found' 
  })
  async confirmSessionBooking(@Body() confirmDto: ConfirmSessionBookingDto) {
    return this.sessionBookingService.confirmSessionBooking(confirmDto);
  }

  @Patch('sessions/:sessionId/complete')
  @ApiOperation({ summary: 'Complete a live session and capture payment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session completed and payment captured' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Session is not in progress' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async completeSession(
    @Param('sessionId') sessionId: string,
    @Body() completeDto: CompleteSessionDto
  ) {
    completeDto.sessionId = sessionId;
    return this.sessionBookingService.completeSession(completeDto);
  }

  // REMOVED: Duplicate start session route
  // Use PATCH /live-sessions/:id/start instead
  // This route was removed to consolidate session lifecycle operations

  @Get()
  @ApiOperation({ summary: 'Get session bookings with filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session bookings retrieved successfully' 
  })
  @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Filter by student ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by booking status' })
  @ApiQuery({ name: 'offeringId', required: false, description: 'Filter by offering ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
  async getSessionBookings(
    @Query() filter: SessionBookingFilterDto,
    @Req() req: AuthenticatedRequest
  ) {
    // If user is a student, only show their bookings
    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.id;
    }
    // If user is an instructor, only show their bookings
    else if (req.user.role === 'INSTRUCTOR') {
      filter.instructorId = req.user.id;
    }

    return this.sessionBookingService.getSessionBookings(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session booking by ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session booking retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session booking not found' 
  })
  async getSessionBookingById(
    @Param('id') id: string,
    @Req() req: AuthenticatedRequest
  ) {
    const booking = await this.sessionBookingService.getSessionBookingById(id);
    
    // Ensure user can only access their own bookings or bookings they're involved in
    if (req.user.role === 'STUDENT' && booking.studentId !== req.user.id) {
      throw new Error('Access denied');
    }
    if (req.user.role === 'INSTRUCTOR' && booking.offering.instructorId !== req.user.id) {
      throw new Error('Access denied');
    }

    return booking;
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a pending session booking' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session booking approved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session booking not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Booking is not in pending status' 
  })
  async approveSessionBooking(
    @Param('id') id: string,
    @Body() body: { instructorMessage?: string },
    @Req() req: AuthenticatedRequest
  ) {
    // Only instructors can approve bookings
    if (req.user.role !== 'INSTRUCTOR') {
      throw new Error('Only instructors can approve bookings');
    }

    return this.sessionBookingService.approveSessionBooking(id, req.user.id, body.instructorMessage);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a pending session booking' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session booking rejected successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session booking not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Booking is not in pending status' 
  })
  async rejectSessionBooking(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: AuthenticatedRequest
  ) {
    // Only instructors can reject bookings
    if (req.user.role !== 'INSTRUCTOR') {
      throw new Error('Only instructors can reject bookings');
    }

    return this.sessionBookingService.rejectSessionBooking(id, req.user.id, body.reason);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel a session booking' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session booking cancelled successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session booking not found' 
  })
  async cancelSessionBooking(
    @Param('id') id: string,
    @Body() cancelDto: CancelSessionBookingDto,
    @Req() req: AuthenticatedRequest
  ) {
    cancelDto.bookingId = id;
    
    // Verify user has permission to cancel this booking
    const booking = await this.sessionBookingService.getSessionBookingById(id);
    if (req.user.role === 'STUDENT' && booking.studentId !== req.user.id) {
      throw new Error('Access denied');
    }
    if (req.user.role === 'INSTRUCTOR' && booking.offering.instructorId !== req.user.id) {
      throw new Error('Access denied');
    }

    return this.sessionBookingService.cancelSessionBooking(cancelDto);
  }

  @Patch(':id/reschedule')
  @ApiOperation({ summary: 'Reschedule a session booking' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session booking rescheduled successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'New time slot not available' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session booking not found' 
  })
  async rescheduleSession(
    @Param('id') id: string,
    @Body() rescheduleDto: RescheduleSessionDto,
    @Req() req: AuthenticatedRequest
  ) {
    rescheduleDto.bookingId = id;
    
    // Verify user has permission to reschedule this booking
    const booking = await this.sessionBookingService.getSessionBookingById(id);
    if (req.user.role === 'STUDENT' && booking.studentId !== req.user.id) {
      throw new Error('Access denied');
    }
    if (req.user.role === 'INSTRUCTOR' && booking.offering.instructorId !== req.user.id) {
      throw new Error('Access denied');
    }

    return this.sessionBookingService.rescheduleSession(rescheduleDto);
  }

  @Get('sessions/:sessionId/meeting-info')
  @ApiOperation({ summary: 'Get meeting information for a session' })
  @ApiResponse({ 
    status: 200, 
    description: 'Meeting information retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async getMeetingInfo(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthenticatedRequest
  ) {
    // This would return the Jitsi meeting information
    // Implementation would be in the service
    return {
      meetingRoomId: `session-${sessionId}`,
      meetingLink: `https://meet.jit.si/session-${sessionId}`,
      meetingPassword: null, // Jitsi doesn't require passwords by default
      joinInstructions: 'Click the meeting link to join the session'
    };
  }

  @Post('webhook/stripe')
  @ApiOperation({ summary: 'Stripe webhook handler for payment events' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook processed successfully' 
  })
  async handleStripeWebhook(@Body() event: any) {
    // This would handle Stripe webhook events
    // Implementation would be in the service
    return { received: true };
  }

  @Get('sessions/:sessionId/participants')
  @ApiOperation({ summary: 'Get session participants' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session participants retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async getSessionParticipants(@Param('sessionId') sessionId: string) {
    // This would return the participants for a session
    // Implementation would be in the service
    return [];
  }

  @Post('sessions/:sessionId/join')
  @ApiOperation({ summary: 'Join a live session' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully joined session' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async joinSession(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthenticatedRequest
  ) {
    // This would handle joining a session
    // Implementation would be in the service
    return {
      success: true,
      meetingLink: `https://meet.jit.si/session-${sessionId}`,
      joinedAt: new Date()
    };
  }

  @Post('sessions/:sessionId/leave')
  @ApiOperation({ summary: 'Leave a live session' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully left session' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async leaveSession(
    @Param('sessionId') sessionId: string,
    @Req() req: AuthenticatedRequest
  ) {
    // This would handle leaving a session
    // Implementation would be in the service
    return {
      success: true,
      leftAt: new Date()
    };
  }
}

