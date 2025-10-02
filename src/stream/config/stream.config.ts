// stream.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('stream', () => ({
  // API Configuration
  apiKey: process.env.STREAM_API_KEY,
  apiSecret: process.env.STREAM_API_SECRET,
  baseUrl: process.env.STREAM_BASE_URL || 'https://getstream.io',
  
  // Webhook Configuration
  // NOTE: GetStream uses your API Secret for webhook signing
  // Do NOT set a separate STREAM_WEBHOOK_SECRET
  webhookUrl: process.env.STREAM_WEBHOOK_URL,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Default call settings
  defaultCallSettings: {
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
      mode: process.env.STREAM_RECORDING_ENABLED === 'true' ? 'available' : 'disabled',
      quality: process.env.STREAM_RECORDING_ENABLED === 'true' ? '720p' : undefined
    },
    transcription: { 
      mode: process.env.STREAM_TRANSCRIPTION_ENABLED === 'true' ? 'available' : 'disabled' 
    },
    backstage: { enabled: false },
    broadcasting: { enabled: false },
    geofencing: { enabled: false }
  },

  // Call type mappings
  callTypeMapping: {
    'ONE_ON_ONE': 'default',
    'GROUP': 'default',
    'LIVESTREAM': 'livestream',
    'AUDIO_ONLY': 'audio_room'
  },

  // Token expiration (in seconds)
  tokenExpiration: parseInt(process.env.STREAM_TOKEN_EXPIRATION || '3600'), // 1 hour

  // Webhook events to handle
  webhookEvents: [
    'call.session_started',
    'call.session_ended',
    'call.recording_started',
    'call.recording_stopped',
    'call.recording_ready',
    'call.participant_joined',
    'call.participant_left',
    'call.member_added',
    'call.member_removed'
  ],

  // Recording settings
  recordingSettings: {
    enabled: process.env.STREAM_RECORDING_ENABLED === 'true',
    quality: process.env.STREAM_RECORDING_QUALITY || 'high',
    format: process.env.STREAM_RECORDING_FORMAT || 'mp4'
  },

  // Notification settings
  notificationSettings: {
    sessionStart: true,
    sessionEnd: true,
    participantJoin: false,
    participantLeave: false,
    recordingStart: true,
    recordingEnd: true
  }
}));