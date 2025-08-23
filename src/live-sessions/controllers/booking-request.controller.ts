import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    HttpCode,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { BookingRequestService } from '../services/booking-request.service';
  import { 
    CreateBookingRequestDto, 
    UpdateBookingRequestDto,
    AcceptBookingRequestDto,
    RejectBookingRequestDto,
    CancelBookingRequestDto,
    BookingRequestFilterDto
  } from '../dto/booking-request.dto';
  import { BookingStatus, BookingMode, PaymentStatus } from '../dto/common.dto';
  import { RestAuthGuard } from '../../auth/rest-auth.guard';

  
  @ApiTags('Booking Requests')
  @ApiBearerAuth()
  @UseGuards(RestAuthGuard)
  @Controller('booking-requests')
  export class BookingRequestController {
    constructor(private readonly bookingRequestService: BookingRequestService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get booking requests with filters' })
    @ApiResponse({ 
      status: 200, 
      description: 'Booking requests retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'studentId', required: false, description: 'Filter by student ID' })
    @ApiQuery({ name: 'status', required: false, enum: BookingStatus, description: 'Filter by status' })
    @ApiQuery({ name: 'offeringId', required: false, description: 'Filter by offering ID' })
    @ApiQuery({ name: 'bookingMode', required: false, enum: BookingMode, description: 'Filter by booking mode' })
    @ApiQuery({ name: 'paymentStatus', required: false, enum: PaymentStatus, description: 'Filter by payment status' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
    async getBookingRequests(
      @Query('instructorId') instructorId?: string,
      @Query('studentId') studentId?: string,
      @Query('status') status?: BookingStatus,
      @Query('offeringId') offeringId?: string,
      @Query('bookingMode') bookingMode?: BookingMode,
      @Query('paymentStatus') paymentStatus?: PaymentStatus,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      const filter: BookingRequestFilterDto = {
        instructorId,
        studentId,
        status,
        offeringId,
        bookingMode,
        paymentStatus,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };
  
      return this.bookingRequestService.getBookingRequests(filter);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get booking request by ID' })
    @ApiResponse({ 
      status: 200, 
      description: 'Booking request retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Booking request not found' 
    })
    async getBookingRequest(@Param('id') id: string) {
      return this.bookingRequestService.getBookingRequest(id);
    }
  
    @Post()
    @ApiOperation({ summary: 'Create booking request' })
    @ApiResponse({ 
      status: 201, 
      description: 'Booking request created successfully' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Bad request - validation errors or conflicts' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Offering or student not found' 
    })
    async createBookingRequest(@Body() createBookingRequestDto: CreateBookingRequestDto) {
      return this.bookingRequestService.createBookingRequest(createBookingRequestDto);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update booking request' })
    @ApiResponse({ 
      status: 200, 
      description: 'Booking request updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Booking request not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Invalid status transition or validation errors' 
    })
    async updateBookingRequest(
      @Param('id') id: string,
      @Body() updateBookingRequestDto: UpdateBookingRequestDto
    ) {
      return this.bookingRequestService.updateBookingRequest(id, updateBookingRequestDto);
    }
  
    @Patch(':id/accept')
    @ApiOperation({ summary: 'Accept booking request' })
    @ApiResponse({ 
      status: 200, 
      description: 'Booking request accepted successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Booking request not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Booking request cannot be accepted' 
    })
    async acceptBookingRequest(
      @Param('id') id: string,
      @Body() acceptBookingRequestDto?: AcceptBookingRequestDto
    ) {
      return this.bookingRequestService.acceptBookingRequest(id, acceptBookingRequestDto);
    }
  
    @Patch(':id/reject')
    @ApiOperation({ summary: 'Reject booking request' })
    @ApiResponse({ 
      status: 200, 
      description: 'Booking request rejected successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Booking request not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Booking request cannot be rejected' 
    })
    async rejectBookingRequest(
      @Param('id') id: string,
      @Body() rejectBookingRequestDto?: RejectBookingRequestDto
    ) {
      return this.bookingRequestService.rejectBookingRequest(id, rejectBookingRequestDto);
    }
  
    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel booking request' })
    @ApiResponse({ 
      status: 200, 
      description: 'Booking request cancelled successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Booking request not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Booking request cannot be cancelled' 
    })
    async cancelBookingRequest(
      @Param('id') id: string,
      @Body() cancelBookingRequestDto?: CancelBookingRequestDto
    ) {
      return this.bookingRequestService.cancelBookingRequest(id, cancelBookingRequestDto);
    }
  
    @Get('student/:studentId')
    @ApiOperation({ summary: 'Get booking requests for a student' })
    @ApiResponse({ 
      status: 200, 
      description: 'Student booking requests retrieved successfully' 
    })
    @ApiQuery({ name: 'status', required: false, enum: BookingStatus, description: 'Filter by status' })
    async getBookingRequestsByStudent(
      @Param('studentId') studentId: string,
      @Query('status') status?: BookingStatus
    ) {
      return this.bookingRequestService.getBookingRequestsByStudent(studentId, status);
    }
  
    @Get('instructor/:instructorId')
    @ApiOperation({ summary: 'Get booking requests for an instructor' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor booking requests retrieved successfully' 
    })
    @ApiQuery({ name: 'status', required: false, enum: BookingStatus, description: 'Filter by status' })
    async getBookingRequestsByInstructor(
      @Param('instructorId') instructorId: string,
      @Query('status') status?: BookingStatus
    ) {
      return this.bookingRequestService.getBookingRequestsByInstructor(instructorId, status);
    }
  
    @Post('expire-requests')
    @ApiOperation({ summary: 'Expire pending booking requests (admin/cron job)' })
    @ApiResponse({ 
      status: 200, 
      description: 'Expired requests processed successfully' 
    })
    @HttpCode(HttpStatus.OK)
    async expireBookingRequests() {
      const expiredCount = await this.bookingRequestService.expireBookingRequests();
      return { 
        message: `${expiredCount} booking requests expired`,
        expiredCount 
      };
    }
  
    @Get('stats/summary')
    @ApiOperation({ summary: 'Get booking request statistics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Booking statistics retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'studentId', required: false, description: 'Filter by student ID' })
    async getBookingRequestStats(
      @Query('instructorId') instructorId?: string,
      @Query('studentId') studentId?: string,
    ) {
      return this.bookingRequestService.getBookingRequestStats(instructorId, studentId);
    }
  
    @Patch(':id/reschedule')
    @ApiOperation({ summary: 'Reschedule booking request' })
    @ApiResponse({ 
      status: 200, 
      description: 'Booking request rescheduled successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Booking request not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Booking request cannot be rescheduled or maximum reschedule limit reached' 
    })
    async rescheduleBookingRequest(
      @Param('id') id: string,
      @Body() rescheduleData: {
        newDate: string;
        newTime: string;
        reason?: string;
      }
    ) {
      return this.bookingRequestService.rescheduleBookingRequest(
        id,
        new Date(rescheduleData.newDate),
        rescheduleData.newTime,
        rescheduleData.reason
      );
    }
  }