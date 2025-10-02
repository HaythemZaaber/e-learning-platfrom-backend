// stream.service.simple.ts
import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { StreamClient } from '@stream-io/node-sdk';
import { 
  UserRole, 
  AttendanceStatus, 
  SessionStatus,
  ParticipantRole,
  ParticipantStatus 
} from '@prisma/client';

export interface StreamCallData {
  callId: string;
  callType: 'default' | 'livestream' | 'audio_room';
  callCid: string;
  createdBy: string;
  createdAt: Date;
  custom: Record<string, any>;
  settings: {
    audio: boolean;
    video: boolean;
    screen_sharing: boolean;
    recording: boolean;
    transcription: boolean;
    backstage: boolean;
    broadcasting: boolean;
    geo_blocking: boolean;
    max_participants: number;
  };
}

export interface StreamTokenData {
  token: string;
  expiresAt: Date;
  userId: string;
  callId: string;
}

@Injectable()
export class StreamService {
  private readonly logger = new Logger(StreamService.name);
  private streamClient: StreamClient;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('STREAM_API_KEY');
    const apiSecret = this.configService.get<string>('STREAM_API_SECRET');
    
    if (!apiKey || !apiSecret) {
      throw new Error('STREAM_API_KEY and STREAM_API_SECRET must be configured');
    }

    this.streamClient = new StreamClient(apiKey, apiSecret, {
      timeout: 10000
    });

    this.logger.log('Stream client initialized successfully');
  }

  async createCall(sessionId: string, createdBy: string): Promise<StreamCallData> {
    try {
      const session = await this.prisma.liveSession.findUnique({
        where: { id: sessionId },
        include: {
          instructor: true,
          offering: true
        }
      });

      if (!session) {
        throw new NotFoundException('Live session not found');
      }

      const callId = `session-${sessionId}`;
      const callType = this.getCallType(session.offering?.sessionFormat);
      
      // Create call using Stream API
      const call = this.streamClient.video.call(callType, callId);
      
      const response = await call.getOrCreate({
        data: {
          created_by_id: createdBy,
          custom: {
            sessionId,
            instructorId: session.instructorId,
            title: session.title,
            description: session.description,
            maxParticipants: session.maxParticipants,
            sessionType: session.sessionType,
            courseId: session.courseId,
            topicId: session.topicId
          },
          settings_override: {
            audio: { default_device: 'speaker' },
            video: { 
              enabled: true,
              target_resolution: {
                width: 1280,
                height: 720,
                bitrate: 2000000 // 2 Mbps
              }
            },
            screensharing: { enabled: true },
            recording: { 
              mode: session.recordingEnabled ? 'available' : 'disabled',
              quality: session.recordingEnabled ? '720p' : undefined
            }
          }
        }
      });

      // Update session with call information
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: {
          meetingRoomId: response.call.id,
          meetingLink: `https://getstream.io/video/demos/?call_id=${response.call.id}`,
          status: SessionStatus.CONFIRMED
        }
      });

      return this.mapToCallData(response.call);
    } catch (error) {
      this.logger.error('Error creating Stream call:', error);
      throw new BadRequestException(`Failed to create video call: ${error.message}`);
    }
  }

  async generateToken(
    userId: string, 
    callId: string, 
    role: ParticipantRole = ParticipantRole.STUDENT
  ): Promise<StreamTokenData> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create user token with call permissions
      const token = this.streamClient.createToken(userId, Math.floor(Date.now() / 1000) + 3600);
      const expiresAt = new Date(Date.now() + 3600 * 1000);

      return {
        token,
        expiresAt,
        userId,
        callId
      };
    } catch (error) {
      this.logger.error('Error generating Stream token:', error);
      throw new BadRequestException('Failed to generate access token');
    }
  }

  async getCall(callId: string): Promise<StreamCallData> {
    try {
      const call = this.streamClient.video.call('default', callId);
      const response = await call.get();

      return this.mapToCallData(response.call);
    } catch (error) {
      this.logger.error('Error getting Stream call:', error);
      throw new NotFoundException('Call not found');
    }
  }

  async endCall(callId: string): Promise<void> {
    try {
      const call = this.streamClient.video.call('default', callId);
      await call.end();
      
      this.logger.log(`Call ${callId} ended successfully`);
    } catch (error) {
      this.logger.error('Error ending Stream call:', error);
      throw new BadRequestException('Failed to end video call');
    }
  }

  async startRecording(callId: string): Promise<void> {
    try {
      const call = this.streamClient.video.call('default', callId);
      await call.startRecording();
      
      this.logger.log(`Recording started for call ${callId}`);
    } catch (error) {
      this.logger.error('Error starting recording:', error);
      throw new BadRequestException('Failed to start recording');
    }
  }

  async stopRecording(callId: string): Promise<string> {
    try {
      const call = this.streamClient.video.call('default', callId);
      await call.stopRecording();
      
      // Get recording URL
      const recordings = await this.listRecordings(callId);
      if (recordings && recordings.length > 0) {
        return recordings[recordings.length - 1].url;
      }
      
      this.logger.log(`Recording stopped for call ${callId}`);
      return '';
    } catch (error) {
      this.logger.error('Error stopping recording:', error);
      throw new BadRequestException('Failed to stop recording');
    }
  }

  async getRecording(callId: string): Promise<string | null> {
    try {
      const recordings = await this.listRecordings(callId);
      
      if (recordings && recordings.length > 0) {
        return recordings[recordings.length - 1].url || null;
      }

      return null;
    } catch (error) {
      this.logger.error('Error getting recording:', error);
      return null;
    }
  }

  async listRecordings(callId: string): Promise<any[]> {
    try {
      const call = this.streamClient.video.call('default', callId);
      const response = await call.listRecordings();
      return response.recordings || [];
    } catch (error) {
      this.logger.error('Error listing recordings:', error);
      return [];
    }
  }

  async getCallParticipants(callId: string): Promise<any[]> {
    try {
      const call = this.streamClient.video.call('default', callId);
      const response = await call.queryMembers();

      return response.members.map(m => ({
        user: {
          id: m.user.id,
          name: m.user.name || m.user.id,
          image: m.user.image,
          role: m.role
        },
        joined_at: new Date(m.created_at),
        left_at: null,
        is_in_call: true,
        status: 'active'
      }));
    } catch (error) {
      this.logger.error('Error getting call participants:', error);
      throw new BadRequestException('Failed to get call participants');
    }
  }

  async updateCallSettings(callId: string, settings: any): Promise<void> {
    try {
      const call = this.streamClient.video.call('default', callId);
      await call.update({ settings_override: settings });
      
      this.logger.log(`Call settings updated for ${callId}`);
    } catch (error) {
      this.logger.error('Error updating call settings:', error);
      throw new BadRequestException('Failed to update call settings');
    }
  }

  private getCallType(sessionFormat?: string): 'default' | 'livestream' | 'audio_room' {
    switch (sessionFormat?.toLowerCase()) {
      case 'livestream':
        return 'livestream';
      case 'audio':
        return 'audio_room';
      default:
        return 'default';
    }
  }

  private mapToCallData(call: any): StreamCallData {
    return {
      callId: call.id,
      callType: call.type as 'default' | 'livestream' | 'audio_room',
      callCid: call.cid,
      createdBy: call.created_by?.id || '',
      createdAt: new Date(call.created_at),
      custom: call.custom || {},
      settings: {
        audio: call.settings?.audio?.default_device === 'speaker',
        video: call.settings?.video?.enabled !== false,
        screen_sharing: call.settings?.screensharing?.enabled !== false,
        recording: call.settings?.recording?.mode === 'available',
        transcription: call.settings?.transcription?.mode === 'available',
        backstage: call.settings?.backstage?.enabled === true,
        broadcasting: call.settings?.broadcasting?.enabled === true,
        geo_blocking: call.settings?.geofencing?.enabled === true,
        max_participants: 50
      }
    };
  }

  async handleWebhookEvent(event: any): Promise<void> {
    try {
      const { type, call_cid, call_id } = event;
      
      // Extract session ID from call_cid (format: "default:session-{sessionId}")
      const sessionId = call_cid?.split(':')[1]?.replace('session-', '');
      
      if (!sessionId) {
        this.logger.warn('No session ID found in webhook event', { call_cid, call_id });
        return;
      }

      this.logger.log(`Processing webhook: ${type} for session ${sessionId}`);

      switch (type) {
        case 'call.session_started':
          await this.handleCallStarted(sessionId, event);
          break;
        case 'call.session_ended':
          await this.handleCallEnded(sessionId, event);
          break;
        case 'call.recording_started':
          await this.handleRecordingStarted(sessionId, event);
          break;
        case 'call.recording_stopped':
          await this.handleRecordingStopped(sessionId, event);
          break;
        case 'call.recording_ready':
          await this.handleRecordingReady(sessionId, event);
          break;
        case 'call.participant_joined':
        case 'call.member_added':
          await this.handleParticipantJoined(sessionId, event);
          break;
        case 'call.participant_left':
        case 'call.member_removed':
          await this.handleParticipantLeft(sessionId, event);
          break;
        default:
          this.logger.log(`Unhandled webhook event type: ${type}`);
      }
    } catch (error) {
      this.logger.error('Error handling webhook event:', error);
      throw error;
    }
  }

  private async handleCallStarted(sessionId: string, event: any): Promise<void> {
    await this.prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
        actualStart: new Date()
      }
    });

    this.logger.log(`Session ${sessionId} started`);
  }

  private async handleCallEnded(sessionId: string, event: any): Promise<void> {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId }
    });

    if (session && session.status === SessionStatus.IN_PROGRESS) {
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.COMPLETED,
          actualEnd: new Date()
        }
      });

      // Update all participant statuses to ATTENDED
      await this.prisma.sessionParticipant.updateMany({
        where: { 
          sessionId: sessionId,
          status: { in: ['ENROLLED'] }
        },
        data: { status: 'ATTENDED' }
      });

      this.logger.log(`Session ${sessionId} ended and participant statuses updated`);
    }

    this.logger.log(`Session ${sessionId} ended`);
  }

  private async handleRecordingStarted(sessionId: string, event: any): Promise<void> {
    this.logger.log(`Recording started for session ${sessionId}`);
  }

  private async handleRecordingStopped(sessionId: string, event: any): Promise<void> {
    this.logger.log(`Recording stopped for session ${sessionId}`);
  }

  private async handleRecordingReady(sessionId: string, event: any): Promise<void> {
    const recordingUrl = event.recording?.url;
    
    if (recordingUrl) {
      await this.prisma.liveSession.update({
        where: { id: sessionId },
        data: { recordingUrl }
      });

      this.logger.log(`Recording ready for session ${sessionId}: ${recordingUrl}`);
    }
  }

  private async handleParticipantJoined(sessionId: string, event: any): Promise<void> {
    const userId = event.user?.id || event.member?.user_id;
    
    if (!userId) return;

    // Check if user is already a participant in the session
    const existingParticipant = await this.prisma.sessionParticipant.findUnique({
      where: {
        sessionId_userId: { sessionId, userId }
      }
    });

    // Only add participant if they're not already in the session
    if (!existingParticipant) {
      // Check if user is the instructor
      const session = await this.prisma.liveSession.findUnique({
        where: { id: sessionId },
        select: { instructorId: true, maxParticipants: true, currentParticipants: true }
      });

      if (!session) {
        this.logger.warn(`Session ${sessionId} not found when handling participant join`);
        return;
      }

      const isInstructor = session.instructorId === userId;
      const role = isInstructor ? 'INSTRUCTOR' : 'STUDENT';

      // Check capacity (instructor doesn't count against capacity)
      if (!isInstructor && session.currentParticipants >= session.maxParticipants) {
        this.logger.warn(`Session ${sessionId} is at capacity, cannot add participant ${userId}`);
        return;
      }

      // Add participant to session
      await this.prisma.sessionParticipant.create({
        data: {
          sessionId,
          userId,
          role: role as any,
          status: 'ENROLLED',
          deviceType: 'DESKTOP',
          paidAmount: 0, // Will be updated if needed
          currency: 'USD',
          paymentDate: new Date()
        }
      });

      // Update participant count (instructor doesn't count against capacity)
      if (!isInstructor) {
        await this.prisma.liveSession.update({
          where: { id: sessionId },
          data: {
            currentParticipants: { increment: 1 }
          }
        });
      }

      this.logger.log(`Added new participant ${userId} to session ${sessionId} as ${role}`);
    } else {
      this.logger.log(`Participant ${userId} already exists in session ${sessionId}, updating attendance only`);
    }

    // Update attendance record
    await this.prisma.attendanceRecord.upsert({
      where: {
        sessionId_userId: { sessionId, userId }
      },
      update: {
        joinedAt: new Date(),
        status: AttendanceStatus.PRESENT
      },
      create: {
        sessionId,
        userId,
        status: AttendanceStatus.PRESENT,
        joinedAt: new Date(),
        duration: 0,
        cameraOnTime: 0,
        micActiveTime: 0,
        chatMessages: 0,
        questionsAsked: 0,
        pollResponses: 0,
        engagementScore: 0
      }
    });

    this.logger.log(`Participant ${userId} joined session ${sessionId}`);
  }

  private async handleParticipantLeft(sessionId: string, event: any): Promise<void> {
    const userId = event.user?.id || event.member?.user_id;
    
    if (!userId) return;

    // Update attendance record
    const attendanceRecord = await this.prisma.attendanceRecord.findUnique({
      where: {
        sessionId_userId: { sessionId, userId }
      }
    });

    if (attendanceRecord && attendanceRecord.joinedAt) {
      const leftAt = new Date();
      const duration = Math.round((leftAt.getTime() - attendanceRecord.joinedAt.getTime()) / 60000);
      
      await this.prisma.attendanceRecord.update({
        where: {
          sessionId_userId: { sessionId, userId }
        },
        data: { leftAt, duration }
      });

      this.logger.log(`Participant ${userId} left session ${sessionId} (duration: ${duration}m)`);
    }

    // Note: We don't remove the participant from sessionParticipant table or decrement currentParticipants
    // because they might rejoin the same session. The participant count should only be decremented
    // when the session is actually ended or when explicitly removing a participant.
    // This prevents issues with users who disconnect and reconnect during the same session.
  }

  async getSessionDetails(sessionId: string) {
    const session = await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Live session not found');
    }

    // Get actual participant count
    const actualParticipantCount = await this.getActualParticipantCount(sessionId);

    return {
      id: session.id,
      title: session.title,
      instructorId: session.instructorId,
      instructorName: `${session.instructor.firstName} ${session.instructor.lastName}`,
      status: session.status,
      recordingEnabled: session.recordingEnabled || false,
      maxParticipants: session.maxParticipants,
      currentParticipants: actualParticipantCount, // Use actual count instead of stored count
      startTime: session.scheduledStart,
      endTime: session.scheduledEnd,
      meetingRoomId: session.meetingRoomId,
      meetingLink: session.meetingLink
    };
  }

  async getUserCalls(userId: string, status?: string): Promise<any[]> {
    const where: any = {
      OR: [
        { instructorId: userId },
        { participants: { some: { userId } } }
      ]
    };

    if (status) {
      where.status = status;
    }

    const sessions = await this.prisma.liveSession.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      },
      orderBy: { scheduledStart: 'desc' }
    });

    const callInfos: any[] = [];

    for (const session of sessions) {
      if (session.meetingRoomId) {
        try {
          const callData = await this.getCall(session.meetingRoomId);
          
          callInfos.push({
            callId: callData.callId,
            callType: callData.callType,
            sessionId: session.id,
            sessionTitle: session.title,
            instructorId: session.instructorId,
            instructorName: `${session.instructor.firstName} ${session.instructor.lastName}`,
            status: session.status,
            recordingEnabled: session.recordingEnabled || false,
            maxParticipants: session.maxParticipants,
            currentParticipants: session.currentParticipants,
            startTime: session.scheduledStart,
            endTime: session.scheduledEnd,
            settings: callData.settings
          });
        } catch (error) {
          this.logger.warn(`Skipping session ${session.id}:`, error.message);
        }
      }
    }

    return callInfos;
  }

  getApiKey(): string {
    return this.configService.get<string>('STREAM_API_KEY') || '';
  }

  /**
   * Get the actual participant count for a session from the database
   */
  async getActualParticipantCount(sessionId: string): Promise<number> {
    const count = await this.prisma.sessionParticipant.count({
      where: {
        sessionId: sessionId,
        status: { in: ['ENROLLED', 'ATTENDED'] }
      }
    });
    return count;
  }

  /**
   * Sync the currentParticipants count with the actual participant count
   */
  async syncParticipantCount(sessionId: string): Promise<void> {
    const actualCount = await this.getActualParticipantCount(sessionId);
    
    await this.prisma.liveSession.update({
      where: { id: sessionId },
      data: { currentParticipants: actualCount }
    });

    this.logger.log(`Synced participant count for session ${sessionId}: ${actualCount}`);
  }
}