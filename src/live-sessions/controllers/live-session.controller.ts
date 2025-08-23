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
  import { LiveSessionService } from '../services/live-session.service';
  import { 
    CreateLiveSessionDto, 
    UpdateLiveSessionDto,
    StartLiveSessionDto,
    EndLiveSessionDto,
    CancelLiveSessionDto,
    RescheduleLiveSessionDto,
    LiveSessionFilterDto
  } from '../dto/live-session.dto';
  import { 
    SessionStatus, 
    LiveSessionType, 
    SessionFormat, 
    PayoutStatus 
  } from '../dto/common.dto';
  import { RestAuthGuard } from '../../auth/rest-auth.guard';

  
  @ApiTags('Live Sessions')
  @ApiBearerAuth()
  @UseGuards(RestAuthGuard)
  @Controller('live-sessions')
  export class LiveSessionController {
    constructor(private readonly liveSessionService: LiveSessionService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get live sessions with filters' })
    @ApiResponse({ 
      status: 200, 
      description: 'Live sessions retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'studentId', required: false, description: 'Filter by student ID' })
    @ApiQuery({ name: 'status', required: false, enum: SessionStatus, description: 'Filter by status' })
    @ApiQuery({ name: 'sessionType', required: false, enum: LiveSessionType, description: 'Filter by session type' })
    @ApiQuery({ name: 'format', required: false, enum: SessionFormat, description: 'Filter by format' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
    @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
    @ApiQuery({ name: 'topicId', required: false, description: 'Filter by topic ID' })
    @ApiQuery({ name: 'payoutStatus', required: false, enum: PayoutStatus, description: 'Filter by payout status' })
    async getLiveSessions(
      @Query('instructorId') instructorId?: string,
      @Query('studentId') studentId?: string,
      @Query('status') status?: string,
      @Query('sessionType') sessionType?: LiveSessionType,
      @Query('format') format?: SessionFormat,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
      @Query('courseId') courseId?: string,
      @Query('topicId') topicId?: string,
      @Query('payoutStatus') payoutStatus?: PayoutStatus,
    ) {
      // Filter out undefined values and validate enum values
      const validStatus = status && status !== 'undefined' ? status as SessionStatus : undefined;
      
      const filter: LiveSessionFilterDto = {
        instructorId,
        studentId,
        status: validStatus,
        sessionType,
        format,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        courseId,
        topicId,
        payoutStatus,
      };
  
      return this.liveSessionService.getLiveSessions(filter);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get live session by ID' })
    @ApiResponse({ 
      status: 200, 
      description: 'Live session retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    async getLiveSession(@Param('id') id: string) {
      return this.liveSessionService.getLiveSession(id);
    }
  
    @Post()
    @ApiOperation({ summary: 'Create live session' })
    @ApiResponse({ 
      status: 201, 
      description: 'Live session created successfully' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Bad request - validation errors or conflicts' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Required resources not found' 
    })
    async createLiveSession(@Body() createLiveSessionDto: CreateLiveSessionDto) {
      return this.liveSessionService.createLiveSession(createLiveSessionDto);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update live session' })
    @ApiResponse({ 
      status: 200, 
      description: 'Live session updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Invalid status transition or validation errors' 
    })
    async updateLiveSession(
      @Param('id') id: string,
      @Body() updateLiveSessionDto: UpdateLiveSessionDto
    ) {
      return this.liveSessionService.updateLiveSession(id, updateLiveSessionDto);
    }
  
    @Patch(':id/start')
    @ApiOperation({ summary: 'Start live session' })
    @ApiResponse({ 
      status: 200, 
      description: 'Live session started successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Session cannot be started' 
    })
    async startLiveSession(
      @Param('id') id: string,
      @Body() startLiveSessionDto?: StartLiveSessionDto
    ) {
      return this.liveSessionService.startLiveSession(id, startLiveSessionDto);
    }
  
    @Patch(':id/end')
    @ApiOperation({ summary: 'End live session' })
    @ApiResponse({ 
      status: 200, 
      description: 'Live session ended successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Session cannot be ended' 
    })
    async endLiveSession(
      @Param('id') id: string,
      @Body() endLiveSessionDto?: EndLiveSessionDto
    ) {
      return this.liveSessionService.endLiveSession(id, endLiveSessionDto);
    }
  
    @Patch(':id/cancel')
    @ApiOperation({ summary: 'Cancel live session' })
    @ApiResponse({ 
      status: 200, 
      description: 'Live session cancelled successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Session cannot be cancelled' 
    })
    async cancelLiveSession(
      @Param('id') id: string,
      @Body() cancelLiveSessionDto?: CancelLiveSessionDto
    ) {
      return this.liveSessionService.cancelLiveSession(id, cancelLiveSessionDto);
    }
  
    @Patch(':id/reschedule')
    @ApiOperation({ summary: 'Reschedule live session' })
    @ApiResponse({ 
      status: 200, 
      description: 'Live session rescheduled successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Session cannot be rescheduled or conflicts exist' 
    })
    async rescheduleLiveSession(
      @Param('id') id: string,
      @Body() rescheduleLiveSessionDto: RescheduleLiveSessionDto
    ) {
      return this.liveSessionService.rescheduleLiveSession(id, rescheduleLiveSessionDto);
    }
  
    @Post(':sessionId/participants')
    @ApiOperation({ summary: 'Add participant to session' })
    @ApiResponse({ 
      status: 201, 
      description: 'Participant added successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Session at capacity or user already participant' 
    })
    async addParticipant(
      @Param('sessionId') sessionId: string,
      @Body() participantData: { userId: string; role?: string }
    ) {
      return this.liveSessionService.addParticipant(
        sessionId, 
        participantData.userId, 
        participantData.role
      );
    }
  
    @Delete(':sessionId/participants/:userId')
    @ApiOperation({ summary: 'Remove participant from session' })
    @ApiResponse({ 
      status: 200, 
      description: 'Participant removed successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Participant not found in session' 
    })
    @HttpCode(HttpStatus.OK)
    async removeParticipant(
      @Param('sessionId') sessionId: string,
      @Param('userId') userId: string
    ) {
      return this.liveSessionService.removeParticipant(sessionId, userId);
    }
  
    @Get(':sessionId/participants')
    @ApiOperation({ summary: 'Get session participants' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session participants retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    async getSessionParticipants(@Param('sessionId') sessionId: string) {
      return this.liveSessionService.getSessionParticipants(sessionId);
    }
  
    @Get(':sessionId/attendance')
    @ApiOperation({ summary: 'Get session attendance records' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session attendance retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Live session not found' 
    })
    async getSessionAttendance(@Param('sessionId') sessionId: string) {
      return this.liveSessionService.getSessionAttendance(sessionId);
    }
  
    @Patch(':sessionId/attendance/:userId')
    @ApiOperation({ summary: 'Update attendance record for user' })
    @ApiResponse({ 
      status: 200, 
      description: 'Attendance updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Attendance record not found' 
    })
    async updateAttendance(
      @Param('sessionId') sessionId: string,
      @Param('userId') userId: string,
      @Body() attendanceData: {
        joinedAt?: string;
        leftAt?: string;
        status?: string;
        engagementMetrics?: {
          cameraOnTime?: number;
          micActiveTime?: number;
          chatMessages?: number;
          questionsAsked?: number;
          pollResponses?: number;
        };
      }
    ) {
      const formattedData = {
        ...attendanceData,
        joinedAt: attendanceData.joinedAt ? new Date(attendanceData.joinedAt) : undefined,
        leftAt: attendanceData.leftAt ? new Date(attendanceData.leftAt) : undefined,
      };
  
      return this.liveSessionService.updateAttendance(sessionId, userId, formattedData);
    }
  
    @Get('stats/summary')
    @ApiOperation({ summary: 'Get live session statistics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session statistics retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'studentId', required: false, description: 'Filter by student ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
    async getSessionStats(
      @Query('instructorId') instructorId?: string,
      @Query('studentId') studentId?: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      return this.liveSessionService.getSessionStats(
        instructorId,
        studentId,
        startDate ? new Date(startDate) : undefined,
        endDate ? new Date(endDate) : undefined,
      );
    }
  
    @Get('upcoming')
    @ApiOperation({ summary: 'Get upcoming sessions' })
    @ApiResponse({ 
      status: 200, 
      description: 'Upcoming sessions retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'studentId', required: false, description: 'Filter by student ID' })
    @ApiQuery({ name: 'days', required: false, description: 'Number of days to look ahead', type: Number })
    async getUpcomingSessions(
      @Query('instructorId') instructorId?: string,
      @Query('studentId') studentId?: string,
      @Query('days') days?: number,
    ) {
      return this.liveSessionService.getUpcomingSessions(
        instructorId,
        studentId,
        days ? Number(days) : undefined
      );
    }
  }