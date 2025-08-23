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
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { AvailabilityService } from '../services/availability.service';
  import { 
    CreateAvailabilityDto, 
    UpdateAvailabilityDto,
    GenerateTimeSlotsDto,
    CheckAvailabilityDto,
    GetAvailabilityFilterDto,
    GetAvailableTimeSlotsDto
  } from '../dto/availability.dto';
  import { RestAuthGuard } from '../../auth/rest-auth.guard';
 
  
  @ApiTags('Instructor Availability')
  @ApiBearerAuth()
  @UseGuards(RestAuthGuard)
  @Controller('instructor-availability')
  export class AvailabilityController {
    constructor(private readonly availabilityService: AvailabilityService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get instructor availability' })
    @ApiResponse({ 
      status: 200, 
      description: 'Availability retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: true, description: 'Instructor ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date filter' })
    async getInstructorAvailability(
      @Query('instructorId') instructorId: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      const filter: GetAvailabilityFilterDto = {
        instructorId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      };
  
      return this.availabilityService.getInstructorAvailability(filter);
    }
  
    @Post()
    @ApiOperation({ summary: 'Create availability slot' })
    @ApiResponse({ 
      status: 201, 
      description: 'Availability created successfully' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Bad request - validation errors or time conflicts' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    @ApiResponse({ 
      status: 409, 
      description: 'Time slot conflicts with existing availability' 
    })
    async createAvailability(@Body() createAvailabilityDto: CreateAvailabilityDto) {
      return this.availabilityService.createAvailability(createAvailabilityDto);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update availability slot' })
    @ApiResponse({ 
      status: 200, 
      description: 'Availability updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Availability not found' 
    })
    @ApiResponse({ 
      status: 409, 
      description: 'Time slot conflicts with existing availability' 
    })
    async updateAvailability(
      @Param('id') id: string,
      @Body() updateAvailabilityDto: UpdateAvailabilityDto
    ) {
      return this.availabilityService.updateAvailability(id, updateAvailabilityDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete availability slot' })
    @ApiResponse({ 
      status: 200, 
      description: 'Availability deleted successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Availability not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Cannot delete availability with active bookings' 
    })
    @HttpCode(HttpStatus.OK)
    async deleteAvailability(@Param('id') id: string) {
      return this.availabilityService.deleteAvailability(id);
    }
  
    @Post('generate-slots')
    @ApiOperation({ summary: 'Generate time slots for availability' })
    @ApiResponse({ 
      status: 201, 
      description: 'Time slots generated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    async generateTimeSlots(@Body() generateTimeSlotsDto: GenerateTimeSlotsDto) {
      return this.availabilityService.generateTimeSlots(generateTimeSlotsDto);
    }
  
    @Post('check-availability')
    @ApiOperation({ summary: 'Check time slot availability' })
    @ApiResponse({ 
      status: 200, 
      description: 'Availability checked successfully' 
    })
    async checkAvailability(@Body() checkAvailabilityDto: CheckAvailabilityDto) {
      return this.availabilityService.checkAvailability(checkAvailabilityDto);
    }
  
    @Get('time-slots/available')
    @ApiOperation({ summary: 'Get available time slots' })
    @ApiResponse({ 
      status: 200, 
      description: 'Available time slots retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: true, description: 'Instructor ID' })
    @ApiQuery({ name: 'date', required: true, description: 'Date for availability' })
    @ApiQuery({ name: 'offeringId', required: false, description: 'Session offering ID' })
    async getAvailableTimeSlots(
      @Query('instructorId') instructorId: string,
      @Query('date') date: string,
      @Query('offeringId') offeringId?: string,
    ) {
      const filter: GetAvailableTimeSlotsDto = {
        instructorId,
        date: new Date(date),
        offeringId,
      };
  
      return this.availabilityService.getAvailableTimeSlots(filter);
    }
  
    @Patch('time-slots/:slotId/block')
    @ApiOperation({ summary: 'Block a time slot' })
    @ApiResponse({ 
      status: 200, 
      description: 'Time slot blocked successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Time slot not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Cannot block slot with existing bookings' 
    })
    async blockTimeSlot(
      @Param('slotId') slotId: string,
      @Body() body?: { reason?: string }
    ) {
      return this.availabilityService.blockTimeSlot(slotId, body?.reason);
    }
  
    @Patch('time-slots/:slotId/unblock')
    @ApiOperation({ summary: 'Unblock a time slot' })
    @ApiResponse({ 
      status: 200, 
      description: 'Time slot unblocked successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Time slot not found' 
    })
    async unblockTimeSlot(@Param('slotId') slotId: string) {
      return this.availabilityService.unblockTimeSlot(slotId);
    }
  
    @Get(':instructorId/upcoming')
    @ApiOperation({ summary: 'Get upcoming availability for instructor' })
    @ApiResponse({ 
      status: 200, 
      description: 'Upcoming availability retrieved successfully' 
    })
    @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead', type: Number })
    async getUpcomingAvailability(
      @Param('instructorId') instructorId: string,
      @Query('days') days?: number,
    ) {
      return this.availabilityService.getUpcomingAvailability(
        instructorId, 
        days ? Number(days) : undefined
      );
    }
  
    @Get(':instructorId/stats')
    @ApiOperation({ summary: 'Get availability statistics for instructor' })
    @ApiResponse({ 
      status: 200, 
      description: 'Availability statistics retrieved successfully' 
    })
    async getAvailabilityStats(@Param('instructorId') instructorId: string) {
      return this.availabilityService.getAvailabilityStats(instructorId);
    }
  }