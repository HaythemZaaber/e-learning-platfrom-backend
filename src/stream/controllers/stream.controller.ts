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
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StreamService } from '../services/stream.service.simple';
import { 
  CreateCallDto,
  GenerateTokenDto,
  UpdateCallSettingsDto,
  CallResponseDto,
  TokenResponseDto,
  CallParticipantsResponseDto,
  RecordingResponseDto,
  JoinCallDto,
  CallInfoDto,
  CallRole,
  JoinSessionResponseDto
} from '../dto/stream.dto';
import { RestAuthGuard } from '../../auth/rest-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { Roles } from '../../auth/roles.decorator';
import { UserRole, SessionStatus } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    clerkId: string;
    email: string;
    role: UserRole;
  };
}

@ApiTags('Stream Video Calls')
@ApiBearerAuth()
@UseGuards(RestAuthGuard)
@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Post('calls')
  @ApiOperation({ summary: 'Create a new video call for a session' })
  @ApiResponse({ 
    status: 201, 
    description: 'Video call created successfully',
    type: CallResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async createCall(
    @Body() createCallDto: CreateCallDto,
    @Req() req: AuthenticatedRequest
  ): Promise<CallResponseDto> {
    const callData = await this.streamService.createCall(createCallDto.sessionId, req.user.id);
    return {
      callId: callData.callId,
      callType: callData.callType as any,
      callCid: callData.callCid,
      createdBy: callData.createdBy,
      createdAt: callData.createdAt,
      custom: callData.custom,
      settings: {
        audio: callData.settings.audio,
        video: callData.settings.video,
        screenSharing: callData.settings.screen_sharing,
        recording: callData.settings.recording,
        transcription: callData.settings.transcription,
        backstage: callData.settings.backstage,
        broadcasting: callData.settings.broadcasting,
        geoBlocking: callData.settings.geo_blocking,
        maxParticipants: callData.settings.max_participants
      }
    };
  }

  @Post('calls/:callId/token')
  @ApiOperation({ summary: 'Generate access token for a call' })
  @ApiResponse({ 
    status: 201, 
    description: 'Token generated successfully',
    type: TokenResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Call or user not found' 
  })
  async generateToken(
    @Param('callId') callId: string,
    @Body() generateTokenDto: GenerateTokenDto,
    @Req() req: AuthenticatedRequest
  ): Promise<TokenResponseDto> {
    const userId = generateTokenDto.userId || req.user.id;
    const role = generateTokenDto.role || CallRole.STUDENT;
    
    return this.streamService.generateToken(userId, callId, role);
  }

  @Get('calls/:callId')
  @ApiOperation({ summary: 'Get call information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Call information retrieved successfully',
    type: CallResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Call not found' 
  })
  async getCall(@Param('callId') callId: string): Promise<CallResponseDto> {
    const callData = await this.streamService.getCall(callId);
    return {
      callId: callData.callId,
      callType: callData.callType as any,
      callCid: callData.callCid,
      createdBy: callData.createdBy,
      createdAt: callData.createdAt,
      custom: callData.custom,
      settings: {
        audio: callData.settings.audio,
        video: callData.settings.video,
        screenSharing: callData.settings.screen_sharing,
        recording: callData.settings.recording,
        transcription: callData.settings.transcription,
        backstage: callData.settings.backstage,
        broadcasting: callData.settings.broadcasting,
        geoBlocking: callData.settings.geo_blocking,
        maxParticipants: callData.settings.max_participants
      }
    };
  }

  @Patch('calls/:callId/settings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update call settings (Instructor only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Call settings updated successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Call not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Instructor access required' 
  })
  async updateCallSettings(
    @Param('callId') callId: string,
    @Body() updateSettingsDto: UpdateCallSettingsDto
  ): Promise<void> {
    const settings = {
      audio: updateSettingsDto.audio,
      video: updateSettingsDto.video,
      screen_sharing: updateSettingsDto.screenSharing,
      recording: updateSettingsDto.recording,
      transcription: updateSettingsDto.transcription,
      backstage: updateSettingsDto.backstage,
      broadcasting: updateSettingsDto.broadcasting,
      geo_blocking: updateSettingsDto.geoBlocking,
      max_participants: updateSettingsDto.maxParticipants
    };

    // Remove undefined values
    const cleanSettings = Object.fromEntries(
      Object.entries(settings).filter(([_, value]) => value !== undefined)
    );

    return this.streamService.updateCallSettings(callId, cleanSettings);
  }

  @Get('calls/:callId/participants')
  @ApiOperation({ summary: 'Get call participants' })
  @ApiResponse({ 
    status: 200, 
    description: 'Call participants retrieved successfully',
    type: CallParticipantsResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Call not found' 
  })
  async getCallParticipants(@Param('callId') callId: string): Promise<CallParticipantsResponseDto> {
    const participants = await this.streamService.getCallParticipants(callId);
    
    return {
      participants: participants.map(p => ({
        userId: p.user.id,
        name: p.user.name,
        image: p.user.image,
        role: p.user.role,
        status: p.status,
        joinedAt: p.joined_at,
        leftAt: p.left_at,
        isInCall: p.is_in_call
      })),
      totalCount: participants.length
    };
  }

  @Post('calls/:callId/recording/start')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Start call recording (Instructor only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recording started successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Failed to start recording' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Call not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Instructor access required' 
  })
  async startRecording(@Param('callId') callId: string): Promise<void> {
    return this.streamService.startRecording(callId);
  }

  @Post('calls/:callId/recording/stop')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'Stop call recording (Instructor only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recording stopped successfully',
    type: RecordingResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Failed to stop recording' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Call not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Instructor access required' 
  })
  async stopRecording(@Param('callId') callId: string): Promise<RecordingResponseDto> {
    const recordingUrl = await this.streamService.stopRecording(callId);
    
    return {
      recordingUrl,
      startedAt: new Date(), // This would come from the actual recording data
      duration: 0 // This would be calculated from start/end times
    };
  }

  @Get('calls/:callId/recording')
  @ApiOperation({ summary: 'Get call recording URL' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recording URL retrieved successfully',
    type: RecordingResponseDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Call or recording not found' 
  })
  async getRecording(@Param('callId') callId: string): Promise<RecordingResponseDto | null> {
    const recordingUrl = await this.streamService.getRecording(callId);
    
    if (!recordingUrl) {
      return null;
    }

    return {
      recordingUrl,
      startedAt: new Date(), // This would come from the actual recording data
      duration: 0 // This would be calculated from start/end times
    };
  }

  @Delete('calls/:callId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @ApiOperation({ summary: 'End a video call (Instructor only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Call ended successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Call not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Instructor access required' 
  })
  @HttpCode(HttpStatus.OK)
  async endCall(@Param('callId') callId: string): Promise<void> {
    return this.streamService.endCall(callId);
  }

  @Post('sessions/:sessionId/join')
  @ApiOperation({ summary: 'Join a session call' })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully joined session call',
    type: JoinSessionResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request - validation errors' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async joinSessionCall(
    @Param('sessionId') sessionId: string,
    @Body() joinCallDto: JoinCallDto,
    @Req() req: AuthenticatedRequest
  ): Promise<JoinSessionResponseDto> {
    const userId = req.user.id;
    const role = joinCallDto.role || CallRole.STUDENT;

    // Get or create call for the session
    const callData = await this.streamService.createCall(sessionId, userId);
    
    // Generate token for the user
    const tokenData = await this.streamService.generateToken(userId, callData.callId, role);

    // Get session details
    const session = await this.streamService.getSessionDetails(sessionId);

    // Get Stream API key from config
    const apiKey = this.streamService.getApiKey();

    return {
      success: true,
      callData: callData,
      token: tokenData.token,
      apiKey: apiKey,
      session: {
        id: session.id,
        title: session.title,
        instructorId: session.instructorId,
        instructorName: session.instructorName,
        status: session.status,
        recordingEnabled: session.recordingEnabled,
        maxParticipants: session.maxParticipants,
        currentParticipants: session.currentParticipants,
        startTime: session.startTime,
        endTime: session.endTime,
        meetingRoomId: session.meetingRoomId,
        meetingLink: session.meetingLink
      }
    };
  }

  @Get('sessions/:sessionId/call-info')
  @ApiOperation({ summary: 'Get session call information' })
  @ApiResponse({ 
    status: 200, 
    description: 'Session call information retrieved successfully',
    type: CallInfoDto
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Session not found' 
  })
  async getSessionCallInfo(@Param('sessionId') sessionId: string): Promise<CallInfoDto> {
    const session = await this.streamService.getSessionDetails(sessionId);
    
    if (!session.meetingRoomId) {
      throw new Error('No call associated with this session');
    }

    const callData = await this.streamService.getCall(session.meetingRoomId);

    return {
      callId: callData.callId,
      callType: callData.callType as any,
      sessionId: sessionId,
      sessionTitle: session.title,
      instructorId: session.instructorId,
      instructorName: session.instructorName,
      status: session.status,
      recordingEnabled: session.recordingEnabled,
      maxParticipants: session.maxParticipants,
      currentParticipants: session.currentParticipants,
      startTime: session.startTime,
      endTime: session.endTime,
      settings: {
        audio: callData.settings.audio,
        video: callData.settings.video,
        screenSharing: callData.settings.screen_sharing,
        recording: callData.settings.recording,
        transcription: callData.settings.transcription,
        backstage: callData.settings.backstage,
        broadcasting: callData.settings.broadcasting,
        geoBlocking: callData.settings.geo_blocking,
        maxParticipants: callData.settings.max_participants
      }
    };
  }

  @Get('user/:userId/calls')
  @ApiOperation({ summary: 'Get user\'s active calls' })
  @ApiResponse({ 
    status: 200, 
    description: 'User calls retrieved successfully',
    type: [CallInfoDto]
  })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by call status' })
  async getUserCalls(
    @Param('userId') userId: string,
    @Query('status') status?: string
  ): Promise<CallInfoDto[]> {
    return this.streamService.getUserCalls(userId, status);
  }
}
