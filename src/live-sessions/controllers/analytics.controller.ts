import { 
  Controller, 
  Get, 
  Query, 
  Param, 
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { RestAuthGuard } from '../../auth/rest-auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@Controller('analytics')
@UseGuards(RestAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('session-stats')
  @ApiOperation({ summary: 'Get session statistics' })
  @ApiQuery({ name: 'instructorId', required: false, description: 'Instructor ID' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Session stats retrieved successfully' })
  async getSessionStats(
    @Query('instructorId') instructorId?: string,
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getSessionStats(
      instructorId,
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('instructor/:instructorId')
  @ApiOperation({ summary: 'Get instructor analytics' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Instructor analytics retrieved successfully' })
  async getInstructorAnalytics(
    @Param('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getInstructorAnalytics(
      instructorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Get student analytics' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Student analytics retrieved successfully' })
  async getStudentAnalytics(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getStudentAnalytics(
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('booking-stats')
  @ApiOperation({ summary: 'Get booking request statistics' })
  @ApiQuery({ name: 'instructorId', required: false, description: 'Instructor ID' })
  @ApiQuery({ name: 'studentId', required: false, description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Booking stats retrieved successfully' })
  async getBookingRequestStats(
    @Query('instructorId') instructorId?: string,
    @Query('studentId') studentId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getBookingRequestStats(
      instructorId,
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('revenue/:instructorId')
  @ApiOperation({ summary: 'Get revenue analytics for instructor' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  async getRevenueAnalytics(
    @Param('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getRevenueAnalytics(
      instructorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('ratings/:instructorId')
  @ApiOperation({ summary: 'Get rating analytics for instructor' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Rating analytics retrieved successfully' })
  async getRatingAnalytics(
    @Param('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getRatingAnalytics(
      instructorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('topics/:instructorId')
  @ApiOperation({ summary: 'Get topic analytics for instructor' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Topic analytics retrieved successfully' })
  async getTopicAnalytics(
    @Param('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getTopicAnalytics(
      instructorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('time-slots/:instructorId')
  @ApiOperation({ summary: 'Get time slot analytics for instructor' })
  @ApiParam({ name: 'instructorId', description: 'Instructor ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Time slot analytics retrieved successfully' })
  async getTimeSlotAnalytics(
    @Param('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getTimeSlotAnalytics(
      instructorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('spending/:studentId')
  @ApiOperation({ summary: 'Get spending analytics for student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Spending analytics retrieved successfully' })
  async getSpendingAnalytics(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getSpendingAnalytics(
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('student-ratings/:studentId')
  @ApiOperation({ summary: 'Get rating analytics for student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Student rating analytics retrieved successfully' })
  async getStudentRatingAnalytics(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getStudentRatingAnalytics(
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }

  @Get('student-topics/:studentId')
  @ApiOperation({ summary: 'Get topic analytics for student' })
  @ApiParam({ name: 'studentId', description: 'Student ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date' })
  @ApiResponse({ status: 200, description: 'Student topic analytics retrieved successfully' })
  async getStudentTopicAnalytics(
    @Param('studentId') studentId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    return this.analyticsService.getStudentTopicAnalytics(
      studentId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
  }
}
