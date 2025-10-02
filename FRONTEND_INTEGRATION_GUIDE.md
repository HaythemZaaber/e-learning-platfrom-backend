# GetStream Video SDK Frontend Integration Guide

This guide provides everything the frontend developer needs to integrate with the GetStream Video SDK backend implementation.

## Backend API Endpoints

The backend provides the following REST API endpoints for video call functionality:

### Base URL

```
https://your-backend-domain.com/stream
```

### Authentication

All endpoints require Bearer token authentication using your existing Clerk authentication system:

```javascript
headers: {
  'Authorization': `Bearer ${clerkSessionToken}`,
  'Content-Type': 'application/json'
}
```

The backend uses your existing `RestAuthGuard` which:

- Verifies Clerk session tokens
- Syncs user data to the database
- Provides user context with role information
- Handles authentication automatically

## API Endpoints

### 1. Create Video Call

```http
POST /stream/calls
```

**Request Body:**

```json
{
  "sessionId": "session-uuid",
  "callType": "default", // "default" | "livestream" | "audio_room"
  "customSettings": {}
}
```

**Response:**

```json
{
  "callId": "session-123",
  "callType": "default",
  "callCid": "session-123",
  "createdBy": "instructor-uuid",
  "createdAt": "2024-01-01T12:00:00Z",
  "custom": {
    "sessionId": "session-uuid",
    "instructorId": "instructor-uuid",
    "title": "Session Title",
    "maxParticipants": 10
  },
  "settings": {
    "audio": true,
    "video": true,
    "screenSharing": true,
    "recording": false,
    "transcription": false,
    "backstage": false,
    "broadcasting": false,
    "geoBlocking": false,
    "maxParticipants": 10
  }
}
```

### 2. Generate Access Token

```http
POST /stream/calls/{callId}/token
```

**Request Body:**

```json
{
  "userId": "user-uuid",
  "callId": "session-123",
  "role": "user" // "user" | "admin"
}
```

**Response:**

```json
{
  "token": "stream_access_token",
  "expiresAt": "2024-01-01T13:00:00Z",
  "userId": "user-uuid",
  "callId": "session-123"
}
```

### 3. Join Session Call

```http
POST /stream/sessions/{sessionId}/join
```

**Request Body:**

```json
{
  "sessionId": "session-uuid",
  "role": "user"
}
```

**Response:**

```json
{
  "callId": "session-123",
  "callType": "default",
  "sessionId": "session-uuid",
  "sessionTitle": "Session Title",
  "instructorId": "instructor-uuid",
  "instructorName": "John Doe",
  "status": "IN_PROGRESS",
  "recordingEnabled": true,
  "maxParticipants": 10,
  "currentParticipants": 3,
  "startTime": "2024-01-01T12:00:00Z",
  "endTime": "2024-01-01T13:00:00Z",
  "settings": {
    "audio": true,
    "video": true,
    "screenSharing": true,
    "recording": true,
    "transcription": false,
    "backstage": false,
    "broadcasting": false,
    "geoBlocking": false,
    "maxParticipants": 10
  }
}
```

### 4. Get Call Information

```http
GET /stream/calls/{callId}
```

**Response:** Same as Create Call response

### 5. Get Call Participants

```http
GET /stream/calls/{callId}/participants
```

**Response:**

```json
{
  "participants": [
    {
      "userId": "user-uuid",
      "name": "John Doe",
      "image": "https://example.com/avatar.jpg",
      "role": "user",
      "joinedAt": "2024-01-01T12:00:00Z",
      "leftAt": null,
      "isInCall": true
    }
  ],
  "totalCount": 1
}
```

### 6. Update Call Settings (Instructor Only)

```http
PATCH /stream/calls/{callId}/settings
```

**Authentication:** Requires `INSTRUCTOR` or `ADMIN` role

**Request Body:**

```json
{
  "audio": true,
  "video": true,
  "screenSharing": true,
  "recording": false,
  "transcription": false,
  "backstage": false,
  "broadcasting": false,
  "geoBlocking": false,
  "maxParticipants": 10
}
```

### 7. Recording Controls (Instructor Only)

```http
POST /stream/calls/{callId}/recording/start
POST /stream/calls/{callId}/recording/stop
```

**Authentication:** Requires `INSTRUCTOR` or `ADMIN` role

**Start Recording Response:**

```json
{
  "success": true,
  "message": "Recording started successfully"
}
```

**Stop Recording Response:**

```json
{
  "recordingUrl": "https://example.com/recording.mp4",
  "startedAt": "2024-01-01T12:00:00Z",
  "duration": 3600
}
```

### 8. Get Session Call Info

```http
GET /stream/sessions/{sessionId}/call-info
```

**Response:** Same as Join Session Call response

### 9. Get User's Active Calls

```http
GET /stream/user/{userId}/calls?status=IN_PROGRESS
```

**Response:**

```json
[
  {
    "callId": "session-123",
    "callType": "default",
    "sessionId": "session-uuid",
    "sessionTitle": "Session Title",
    "instructorId": "instructor-uuid",
    "instructorName": "John Doe",
    "status": "IN_PROGRESS",
    "recordingEnabled": true,
    "maxParticipants": 10,
    "currentParticipants": 3,
    "startTime": "2024-01-01T12:00:00Z",
    "endTime": "2024-01-01T13:00:00Z",
    "settings": {
      /* call settings */
    }
  }
]
```

## Frontend Implementation Guide

### 1. Install GetStream Video SDK

```bash
npm install @stream-io/video-react-sdk
# or
yarn add @stream-io/video-react-sdk
```

### 2. Environment Variables

```env
REACT_APP_STREAM_API_KEY=your_stream_api_key
REACT_APP_BACKEND_URL=https://your-backend-domain.com
```

### 3. Basic Video Call Component

```typescript
import React, { useState, useEffect } from 'react';
import { StreamCall, StreamVideo, StreamVideoClient, useCallStateHooks } from '@stream-io/video-react-sdk';

interface VideoCallProps {
  sessionId: string;
  user: {
    id: string;
    name: string;
    image?: string;
    role: 'user' | 'admin';
  };
  onCallEnd?: () => void;
}

const VideoCallComponent: React.FC<VideoCallProps> = ({ sessionId, user, onCallEnd }) => {
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initializeCall();
  }, [sessionId]);

  const initializeCall = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Join the session call to get call info and token
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/stream/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          role: user.role
        })
      });

      if (!response.ok) {
        throw new Error('Failed to join session call');
      }

      const callInfo = await response.json();

      // 2. Generate access token
      const tokenResponse = await fetch(`${process.env.REACT_APP_BACKEND_URL}/stream/calls/${callInfo.callId}/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          callId: callInfo.callId,
          role: user.role
        })
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to generate access token');
      }

      const tokenData = await tokenResponse.json();
      setToken(tokenData.token);

      // 3. Initialize Stream client
      const streamClient = new StreamVideoClient({
        apiKey: process.env.REACT_APP_STREAM_API_KEY!,
        user: {
          id: user.id,
          name: user.name,
          image: user.image
        },
        token: tokenData.token
      });

      setClient(streamClient);

      // 4. Create call object
      const streamCall = streamClient.call('default', callInfo.callId);
      setCall(streamCall);

      // 5. Join the call
      await streamCall.join({ create: true });

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize call');
      setLoading(false);
    }
  };

  const endCall = async () => {
    if (call) {
      await call.leave();
      onCallEnd?.();
    }
  };

  if (loading) {
    return <div>Connecting to call...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!client || !call) {
    return <div>Failed to initialize call</div>;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallUI onCallEnd={endCall} user={user} />
      </StreamCall>
    </StreamVideo>
  );
};

const CallUI: React.FC<{ onCallEnd: () => void; user: any }> = ({ onCallEnd, user }) => {
  const { useCallState, useParticipants, useCallCallingState } = useCallStateHooks();
  const callState = useCallState();
  const participants = useParticipants();
  const callingState = useCallCallingState();

  const toggleAudio = () => {
    callState?.microphone.toggle();
  };

  const toggleVideo = () => {
    callState?.camera.toggle();
  };

  const toggleScreenShare = () => {
    callState?.screenShare.toggle();
  };

  return (
    <div className="video-call-container">
      {/* Video Grid */}
      <div className="video-grid">
        {participants.map((participant) => (
          <div key={participant.sessionId} className="participant-video">
            <div className="video-container">
              {/* Stream's video component will render here */}
            </div>
            <div className="participant-info">
              <span>{participant.name || participant.userId}</span>
              {!participant.isAudioEnabled && <span>🔇</span>}
              {!participant.isVideoEnabled && <span>📹</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Call Controls */}
      <div className="call-controls">
        <button onClick={toggleAudio} className={callState?.microphone.enabled ? 'active' : ''}>
          🎤
        </button>
        <button onClick={toggleVideo} className={callState?.camera.enabled ? 'active' : ''}>
          📹
        </button>
        <button onClick={toggleScreenShare} className={callState?.screenShare.isSharing ? 'active' : ''}>
          🖥️
        </button>
        <button onClick={onCallEnd} className="end-call">
          📞
        </button>
      </div>

      {/* Call Status */}
      <div className="call-status">
        {callingState === 'idle' && 'Connecting...'}
        {callingState === 'joining' && 'Joining...'}
        {callingState === 'joined' && 'Connected'}
        {callingState === 'left' && 'Call Ended'}
      </div>
    </div>
  );
};

export default VideoCallComponent;
```

### 4. Advanced Features

#### Recording Controls (Instructor Only)

```typescript
const startRecording = async (callId: string) => {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/stream/calls/${callId}/recording/start`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    },
  );

  if (response.ok) {
    console.log('Recording started');
  }
};

const stopRecording = async (callId: string) => {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/stream/calls/${callId}/recording/stop`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    },
  );

  if (response.ok) {
    const data = await response.json();
    console.log('Recording URL:', data.recordingUrl);
  }
};
```

#### Participant Management

```typescript
const getParticipants = async (callId: string) => {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/stream/calls/${callId}/participants`,
    {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
      },
    },
  );

  if (response.ok) {
    const data = await response.json();
    return data.participants;
  }
};
```

#### Call Settings Update (Instructor Only)

```typescript
const updateCallSettings = async (callId: string, settings: any) => {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/stream/calls/${callId}/settings`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(settings),
    },
  );

  if (response.ok) {
    console.log('Call settings updated');
  }
};
```

### 5. Error Handling

```typescript
const handleCallError = (error: any) => {
  console.error('Call error:', error);

  switch (error.code) {
    case 'INVALID_TOKEN':
      // Token expired, refresh token
      break;
    case 'CALL_NOT_FOUND':
      // Call doesn't exist
      break;
    case 'PERMISSION_DENIED':
      // User lacks required permissions
      break;
    case 'CALL_FULL':
      // Maximum participants reached
      break;
    default:
      // Generic error handling
      break;
  }
};
```

### 6. CSS Styling

```css
.video-call-container {
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
  color: white;
  display: flex;
  flex-direction: column;
}

.video-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  padding: 16px;
}

.participant-video {
  background: #2a2a2a;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.video-container {
  width: 100%;
  height: 200px;
  background: #3a3a3a;
  display: flex;
  align-items: center;
  justify-content: center;
}

.participant-info {
  padding: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.call-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 16px;
  background: rgba(0, 0, 0, 0.8);
  padding: 16px 24px;
  border-radius: 24px;
  backdrop-filter: blur(10px);
}

.call-controls button {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 50%;
  background: #4a4a4a;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.call-controls button:hover {
  background: #5a5a5a;
  transform: scale(1.1);
}

.call-controls button.active {
  background: #007bff;
}

.call-controls button.end-call {
  background: #dc3545;
}

.call-status {
  position: fixed;
  top: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
}
```

## Integration with Existing Session Flow

### 1. Session Start Flow

```typescript
// When instructor starts a session
const startSession = async (sessionId: string) => {
  // 1. Start the session (this creates the call automatically)
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/live-sessions/${sessionId}/start`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    },
  );

  if (response.ok) {
    const data = await response.json();
    // 2. Navigate to video call component
    navigate(`/session/${sessionId}/call`);
  }
};
```

### 2. Student Join Flow

```typescript
// When student joins a session
const joinSession = async (sessionId: string) => {
  // 1. Check if session is active
  const sessionResponse = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/live-sessions/${sessionId}`,
  );

  if (sessionResponse.ok) {
    const session = await sessionResponse.json();

    if (session.status === 'IN_PROGRESS') {
      // 2. Navigate to video call component
      navigate(`/session/${sessionId}/call`);
    } else {
      alert('Session is not active yet');
    }
  }
};
```

## Webhook Events (Optional)

The backend sends webhook events for real-time updates. You can listen to these if needed:

```typescript
// WebSocket connection for real-time updates
const connectToWebhooks = () => {
  const ws = new WebSocket('wss://your-backend-domain.com/stream/webhooks/ws');

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.type) {
      case 'call.session_started':
        // Session started
        break;
      case 'call.session_ended':
        // Session ended
        break;
      case 'call.participant_joined':
        // Participant joined
        break;
      case 'call.participant_left':
        // Participant left
        break;
      case 'call.recording_started':
        // Recording started
        break;
      case 'call.recording_stopped':
        // Recording stopped
        break;
    }
  };
};
```

## Testing

### 1. Test Call Creation

```typescript
const testCallCreation = async () => {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/stream/calls`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: 'test-session-id',
        callType: 'default',
      }),
    },
  );

  console.log('Call creation test:', await response.json());
};
```

### 2. Test Token Generation

```typescript
const testTokenGeneration = async (callId: string) => {
  const response = await fetch(
    `${process.env.REACT_APP_BACKEND_URL}/stream/calls/${callId}/token`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test-user-id',
        callId: callId,
        role: 'user',
      }),
    },
  );

  console.log('Token generation test:', await response.json());
};
```

## Troubleshooting

### Common Issues

1. **Token Expired**: Refresh the token by calling the token generation endpoint
2. **Call Not Found**: Ensure the session exists and is active
3. **Permission Denied**: Check user role and session permissions
4. **Connection Failed**: Verify Stream API key and network connection

### Debug Mode

Enable debug logging:

```typescript
// Set debug mode for Stream SDK
localStorage.setItem('stream-debug', 'true');
```

## Security Considerations

1. **Token Security**: Tokens are short-lived (1 hour) and user-specific
2. **HTTPS Required**: All API calls must use HTTPS in production
3. **Authentication**: Always include Bearer token in API requests
4. **Role-based Access**: Respect user roles (instructor vs student)

## Performance Optimization

1. **Token Caching**: Cache tokens to reduce API calls
2. **Connection Pooling**: Reuse WebSocket connections
3. **Lazy Loading**: Load video components only when needed
4. **Error Boundaries**: Implement React error boundaries for call components

This guide provides everything needed to integrate the GetStream Video SDK with the backend implementation. The backend handles all the complex call management, authentication, and webhook processing, while the frontend focuses on the user interface and real-time video experience.
