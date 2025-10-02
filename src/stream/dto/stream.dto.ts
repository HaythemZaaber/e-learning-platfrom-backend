import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  SessionStatus, 
  SessionType, 
  SessionFormat, 
  SessionMode, 
  ParticipantRole, 
  ParticipantStatus, 
  AttendanceStatus,
  LiveSessionType 
} from '@prisma/client';
import { StreamCallData } from '../services/stream.service.simple';

export enum CallType {
  DEFAULT = 'default',
  LIVESTREAM = 'livestream',
  AUDIO_ROOM = 'audio_room'
}

export type CallTypeString = 'default' | 'livestream' | 'audio_room';

export enum CallRole {
  STUDENT = 'STUDENT',
  INSTRUCTOR = 'INSTRUCTOR'
}

export class CallSettingsDto {
  @ApiProperty({ description: 'Audio enabled' })
  audio: boolean;

  @ApiProperty({ description: 'Video enabled' })
  video: boolean;

  @ApiProperty({ description: 'Screen sharing enabled' })
  screenSharing: boolean;

  @ApiProperty({ description: 'Recording enabled' })
  recording: boolean;

  @ApiProperty({ description: 'Transcription enabled' })
  transcription: boolean;

  @ApiProperty({ description: 'Backstage enabled' })
  backstage: boolean;

  @ApiProperty({ description: 'Broadcasting enabled' })
  broadcasting: boolean;

  @ApiProperty({ description: 'Geo blocking enabled' })
  geoBlocking: boolean;

  @ApiProperty({ description: 'Maximum participants' })
  maxParticipants: number;
}

export class CreateCallDto {
  @ApiProperty({ description: 'Session ID to create call for' })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'Call type', enum: CallType })
  @IsOptional()
  @IsEnum(CallType)
  callType?: CallType;

  @ApiPropertyOptional({ description: 'Custom call settings' })
  @IsOptional()
  @IsObject()
  customSettings?: Record<string, any>;
}

export class GenerateTokenDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Call ID' })
  @IsString()
  callId: string;

  @ApiPropertyOptional({ description: 'User role in call', enum: CallRole })
  @IsOptional()
  @IsEnum(CallRole)
  role?: CallRole = CallRole.STUDENT;
}

export class UpdateCallSettingsDto {
  @ApiPropertyOptional({ description: 'Enable audio' })
  @IsOptional()
  @IsBoolean()
  audio?: boolean;

  @ApiPropertyOptional({ description: 'Enable video' })
  @IsOptional()
  @IsBoolean()
  video?: boolean;

  @ApiPropertyOptional({ description: 'Enable screen sharing' })
  @IsOptional()
  @IsBoolean()
  screenSharing?: boolean;

  @ApiPropertyOptional({ description: 'Enable recording' })
  @IsOptional()
  @IsBoolean()
  recording?: boolean;

  @ApiPropertyOptional({ description: 'Enable transcription' })
  @IsOptional()
  @IsBoolean()
  transcription?: boolean;

  @ApiPropertyOptional({ description: 'Enable backstage mode' })
  @IsOptional()
  @IsBoolean()
  backstage?: boolean;

  @ApiPropertyOptional({ description: 'Enable broadcasting' })
  @IsOptional()
  @IsBoolean()
  broadcasting?: boolean;

  @ApiPropertyOptional({ description: 'Enable geo blocking' })
  @IsOptional()
  @IsBoolean()
  geoBlocking?: boolean;

  @ApiPropertyOptional({ description: 'Maximum participants' })
  @IsOptional()
  @IsNumber()
  maxParticipants?: number;
}

export class CallResponseDto {
  @ApiProperty({ description: 'Call ID' })
  callId: string;

  @ApiProperty({ description: 'Call type', enum: CallType })
  callType: CallTypeString;

  @ApiProperty({ description: 'Call CID' })
  callCid: string;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Call creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Custom call data' })
  custom: Record<string, any>;

  @ApiProperty({ description: 'Call settings' })
  settings: CallSettingsDto;
}

export class TokenResponseDto {
  @ApiProperty({ description: 'Access token' })
  token: string;

  @ApiProperty({ description: 'Token expiration date' })
  expiresAt: Date;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Call ID' })
  callId: string;
}

export class ParticipantDto {
  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'User name' })
  name: string;

  @ApiPropertyOptional({ description: 'User profile image' })
  image?: string;

  @ApiProperty({ description: 'User role', enum: ParticipantRole })
  role: ParticipantRole;

  @ApiProperty({ description: 'Participant status', enum: ParticipantStatus })
  status: ParticipantStatus;

  @ApiProperty({ description: 'Joined at timestamp' })
  joinedAt: Date;

  @ApiPropertyOptional({ description: 'Left at timestamp' })
  leftAt?: Date;

  @ApiProperty({ description: 'Is currently in call' })
  isInCall: boolean;

  @ApiPropertyOptional({ description: 'Attendance status', enum: AttendanceStatus })
  attendanceStatus?: AttendanceStatus;
}

export class CallParticipantsResponseDto {
  @ApiProperty({ description: 'List of participants', type: [ParticipantDto] })
  participants: ParticipantDto[];

  @ApiProperty({ description: 'Total participant count' })
  totalCount: number;
}

export class RecordingResponseDto {
  @ApiProperty({ description: 'Recording URL' })
  recordingUrl: string;

  @ApiProperty({ description: 'Recording start time' })
  startedAt: Date;

  @ApiPropertyOptional({ description: 'Recording end time' })
  endedAt?: Date;

  @ApiProperty({ description: 'Recording duration in seconds' })
  duration: number;
}

export class WebhookEventDto {
  @ApiProperty({ description: 'Event type' })
  type: string;

  @ApiProperty({ description: 'Call CID' })
  call_cid: string;

  @ApiProperty({ description: 'Call ID' })
  call_id: string;

  @ApiProperty({ description: 'Event timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Event data' })
  data: Record<string, any>;
}

export class JoinCallDto {
  @ApiProperty({ description: 'Session ID' })
  @IsString()
  sessionId: string;

  @ApiPropertyOptional({ description: 'User role in call', enum: CallRole })
  @IsOptional()
  @IsEnum(CallRole)
  role?: CallRole = CallRole.STUDENT;
}

export class CallInfoDto {
  @ApiProperty({ description: 'Call ID' })
  callId: string;

  @ApiProperty({ description: 'Call type', enum: CallType })
  callType: CallType;

  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Session title' })
  sessionTitle: string;

  @ApiProperty({ description: 'Instructor ID' })
  instructorId: string;

  @ApiProperty({ description: 'Instructor name' })
  instructorName: string;

  @ApiProperty({ description: 'Call status', enum: SessionStatus })
  status: SessionStatus;

  @ApiProperty({ description: 'Is recording enabled' })
  recordingEnabled: boolean;

  @ApiProperty({ description: 'Maximum participants' })
  maxParticipants: number;

  @ApiProperty({ description: 'Current participants count' })
  currentParticipants: number;

  @ApiProperty({ description: 'Call start time' })
  startTime: Date;

  @ApiPropertyOptional({ description: 'Call end time' })
  endTime?: Date;

  @ApiProperty({ description: 'Call settings' })
  settings: CallSettingsDto;

  @ApiPropertyOptional({ description: 'Session format', enum: SessionFormat })
  sessionFormat?: SessionFormat;

  @ApiPropertyOptional({ description: 'Session type', enum: SessionType })
  sessionType?: SessionType;

  @ApiPropertyOptional({ description: 'Session mode', enum: SessionMode })
  sessionMode?: SessionMode;
}

export class AttendanceUpdateDto {
  @ApiProperty({ description: 'User ID' })
  @IsString()
  userId: string;

  @ApiPropertyOptional({ description: 'Joined at timestamp' })
  @IsOptional()
  joinedAt?: Date;

  @ApiPropertyOptional({ description: 'Left at timestamp' })
  @IsOptional()
  leftAt?: Date;

  @ApiPropertyOptional({ description: 'Attendance status', enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Engagement metrics' })
  @IsOptional()
  @IsObject()
  engagementMetrics?: {
    cameraOnTime?: number;
    micActiveTime?: number;
    chatMessages?: number;
    questionsAsked?: number;
    pollResponses?: number;
  };
}

export class SessionCallInfoDto {
  @ApiProperty({ description: 'Session ID' })
  sessionId: string;

  @ApiProperty({ description: 'Call ID' })
  callId: string;

  @ApiProperty({ description: 'Meeting room ID' })
  meetingRoomId: string;

  @ApiProperty({ description: 'Meeting link' })
  meetingLink: string;

  @ApiPropertyOptional({ description: 'Meeting password' })
  meetingPassword?: string;

  @ApiProperty({ description: 'Session status', enum: SessionStatus })
  status: SessionStatus;

  @ApiProperty({ description: 'Is recording enabled' })
  recordingEnabled: boolean;

  @ApiProperty({ description: 'Maximum participants' })
  maxParticipants: number;

  @ApiProperty({ description: 'Current participants count' })
  currentParticipants: number;

  @ApiProperty({ description: 'Session start time' })
  scheduledStart: Date;

  @ApiProperty({ description: 'Session end time' })
  scheduledEnd: Date;

  @ApiPropertyOptional({ description: 'Actual start time' })
  actualStart?: Date;

  @ApiPropertyOptional({ description: 'Actual end time' })
  actualEnd?: Date;

  @ApiProperty({ description: 'Call settings' })
  settings: CallSettingsDto;
}

export class JoinSessionResponseDto {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Stream call data' })
  callData: StreamCallData;

  @ApiProperty({ description: 'Stream access token' })
  token: string;

  @ApiProperty({ description: 'Stream API key' })
  apiKey: string;

  @ApiProperty({ description: 'Session information' })
  session: any;
}