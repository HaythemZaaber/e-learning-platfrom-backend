# WebSocket Integration Guide

This guide explains how to use the WebSocket functionality in the e-learning platform backend for real-time features like notifications, discussions, and live sessions.

## Overview

The WebSocket implementation provides:

- Real-time notifications
- Discussion features
- Live session events
- User presence tracking
- Typing indicators
- Private messaging

## Architecture

### Core Components

1. **WebSocketGatewayService** (`src/websocket/websocket.gateway.ts`)
   - Handles WebSocket connections and disconnections
   - Manages user authentication
   - Provides methods for sending notifications

2. **WebSocketService** (`src/websocket/websocket.service.ts`)
   - High-level service for WebSocket operations
   - Handles discussion messages, live sessions, course updates
   - Provides typing indicators and user presence

3. **NotificationService** (updated)
   - Integrated with WebSocket for real-time notifications
   - Supports bulk notifications and room-based notifications

## Setup

### Environment Variables

Add these to your `.env` file:

```env
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-jwt-secret-key
```

### Dependencies

The following packages are already installed:

- `@nestjs/websockets`
- `@nestjs/platform-socket.io`
- `socket.io`

## Client-Side Connection

### JavaScript/TypeScript Client

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token',
  },
});

// Connection events
socket.on('connected', (data) => {
  console.log('Connected:', data);
});

socket.on('notification', (notification) => {
  console.log('New notification:', notification);
});

// Join a room (e.g., course discussion)
socket.emit('join_room', {
  room: 'course:123',
  type: 'discussion',
});

// Send typing indicator
socket.emit('typing_start', {
  room: 'course:123',
  discussionId: 'discussion-456',
});

socket.emit('typing_stop', {
  room: 'course:123',
  discussionId: 'discussion-456',
});
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWebSocket = (token: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3001', {
      auth: { token },
    });

    newSocket.on('connected', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  return { socket, isConnected };
};
```

## Server-Side Usage

### Sending Notifications

```typescript
import { NotificationService } from './notifications/notification.service';

// Single user notification
await notificationService.createNotification({
  userId: 'user-123',
  type: 'COURSE_UPDATE',
  title: 'New Lesson Available',
  message: 'A new lesson has been added to your course',
  data: { courseId: 'course-456' },
});

// Bulk notifications
await notificationService.createBulkNotifications([
  {
    userId: 'user-1',
    type: 'ANNOUNCEMENT',
    title: 'System Maintenance',
    message: 'Scheduled maintenance tonight',
  },
  {
    userId: 'user-2',
    type: 'ANNOUNCEMENT',
    title: 'System Maintenance',
    message: 'Scheduled maintenance tonight',
  },
]);

// Room notification (course announcement)
await notificationService.createRoomNotification('course:123', {
  type: 'COURSE_ANNOUNCEMENT',
  title: 'Important Update',
  message: 'Please check the new assignment',
});
```

### Discussion Features

```typescript
import { WebSocketService } from './websocket/websocket.service';

// Send discussion message
await webSocketService.sendDiscussionMessage('course:123', {
  id: 'msg-456',
  discussionId: 'discussion-789',
  userId: 'user-123',
  content: 'Great question!',
  timestamp: new Date(),
});

// Send reaction
await webSocketService.sendDiscussionReaction(
  'course:123',
  'discussion-789',
  'user-123',
  '👍',
);
```

### Live Session Events

```typescript
// User joined live session
await webSocketService.sendLiveSessionEvent('live-session:456', {
  sessionId: 'live-session-456',
  type: 'user_joined',
  userId: 'user-123',
  data: { userName: 'John Doe' },
});

// Screen sharing started
await webSocketService.sendLiveSessionEvent('live-session:456', {
  sessionId: 'live-session-456',
  type: 'screen_share',
  userId: 'instructor-789',
  data: { isSharing: true },
});
```

### Course Updates

```typescript
// Course announcement
await webSocketService.sendCourseAnnouncement('course-123', {
  title: 'New Assignment Posted',
  message: 'Check out the new assignment in Module 3',
  instructorId: 'instructor-456',
});

// Course update
await webSocketService.sendCourseUpdate('course-123', {
  type: 'new_lesson',
  title: 'New Lesson Available',
  message: 'Module 4: Advanced Topics is now available',
  data: { lessonId: 'lesson-789' },
});
```

## Event Types

### Client Events (emit)

- `join_room` - Join a specific room
- `leave_room` - Leave a room
- `typing_start` - Start typing indicator
- `typing_stop` - Stop typing indicator

### Server Events (listen)

- `connected` - Connection established
- `notification` - New notification received
- `discussion_message` - New discussion message
- `discussion_reaction` - Discussion reaction
- `live_session_event` - Live session update
- `course_announcement` - Course announcement
- `course_update` - Course update
- `user_presence` - User presence change
- `typing_indicator` - Typing indicator
- `private_message` - Private message
- `system_announcement` - System-wide announcement

## Room Management

### Room Naming Convention

- User rooms: `user:{userId}`
- Course rooms: `course:{courseId}`
- Discussion rooms: `discussion:{discussionId}`
- Live session rooms: `live-session:{sessionId}`
- Private chat rooms: `private:{userId1}:{userId2}`

### Joining Rooms

```typescript
// Join course discussion
socket.emit('join_room', {
  room: 'course:123',
  type: 'discussion',
});

// Join live session
socket.emit('join_room', {
  room: 'live-session:456',
  type: 'live_session',
});
```

## Authentication

The WebSocket connection uses JWT authentication. The token should be provided in the connection handshake:

```typescript
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

## Error Handling

```typescript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

## Best Practices

1. **Room Management**: Always join/leave rooms appropriately
2. **Error Handling**: Handle connection errors gracefully
3. **Authentication**: Ensure valid JWT tokens
4. **Rate Limiting**: Implement client-side rate limiting for typing indicators
5. **Reconnection**: Implement automatic reconnection logic
6. **Memory Management**: Clean up event listeners on component unmount

## Future Features

The WebSocket implementation is designed to support:

- **Real-time Discussions**: Course and lesson discussions
- **Live Sessions**: Interactive live classes
- **Collaborative Features**: Shared whiteboards, group projects
- **Gamification**: Real-time leaderboards, achievements
- **Analytics**: Real-time learning progress tracking

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check CORS settings and JWT token
2. **Authentication Error**: Verify JWT secret and token validity
3. **Room Not Found**: Ensure room exists and user has access
4. **Memory Leaks**: Clean up event listeners and connections

### Debug Mode

Enable debug logging by setting the environment variable:

```env
DEBUG=socket.io:*
```

This will provide detailed logs of WebSocket connections and events.
