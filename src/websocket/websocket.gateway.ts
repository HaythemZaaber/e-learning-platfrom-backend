import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ClerkService } from '../auth/clerk.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string; // Database user ID
  clerkId?: string; // Clerk user ID
  user?: any;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  namespace: '/',
  transports: ['websocket', 'polling'],
})
export class WebSocketGatewayService
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGatewayService.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private clerkService: ClerkService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client attempting to connect: ${client.id}`);

    try {
      // Extract token from handshake
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      this.logger.log(`Token received: ${token ? 'Yes' : 'No'}`);

      if (!token) {
        this.logger.warn('No token provided for WebSocket connection');
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      // Verify Clerk token
      try {
        const payload = await this.clerkService.verifyToken(token);
        client.clerkId = payload.sub;
        client.user = payload;

        this.logger.log(`Token verified for Clerk user: ${client.clerkId}`);

        // Get Clerk user details and sync to database
        const clerkUser = await this.clerkService.getUser(client.clerkId);
        if (!clerkUser) {
          this.logger.error('Clerk user not found');
          client.emit('error', { message: 'User not found' });
          client.disconnect();
          return;
        }

        // Sync user to database and get database user ID
        const dbUser = await this.syncUserToDatabase(clerkUser);
        client.userId = dbUser.id;

        this.logger.log(
          `Database user ID: ${client.userId}, Clerk user ID: ${client.clerkId}`,
        );
      } catch (verifyError) {
        this.logger.error('Token verification failed:', verifyError.message);
        client.emit('error', { message: 'Invalid token' });
        client.disconnect();
        return;
      }

      // IMPORTANT: Store user connection BEFORE joining rooms or sending notifications
      if (client.userId) {
        this.connectedUsers.set(client.userId, client.id);
        this.logger.log(
          `Stored socket mapping: ${client.userId} -> ${client.id}`,
        );
        this.logger.log(
          `Current connected users: ${Array.from(this.connectedUsers.keys()).join(', ')}`,
        );

        // Join user to their personal room
        const userRoom = `user:${client.userId}`;
        await client.join(userRoom);
        this.logger.log(`User ${client.userId} joined room: ${userRoom}`);

        // Send connection confirmation
        client.emit('connected', {
          message: 'Connected successfully',
          userId: client.userId,
          socketId: client.id,
        });

        this.logger.log(
          `✅ User ${client.userId} fully connected with socket ${client.id}`,
        );
      }
    } catch (error) {
      this.logger.error('WebSocket authentication failed:', error);
      client.emit('error', { message: 'Authentication failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);
      this.logger.log(
        `User ${client.userId} disconnected and removed from map`,
      );
    } else {
      this.logger.log(`Client ${client.id} disconnected (unauthenticated)`);
    }
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room: ${room}`);
    client.emit('joined_room', { room });
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(
    @MessageBody() room: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    client.leave(room);
    this.logger.log(`Socket ${client.id} left room: ${room}`);
    client.emit('left_room', { room });
  }

  // Method to send notification to specific user
  async sendNotificationToUser(userId: string, notification: any) {
    const socketId = this.connectedUsers.get(userId);
    const userRoom = `user:${userId}`;

    let sentCount = 0;

    // Method 1: Send to specific socket (most reliable if user has one connection)
    if (socketId) {
      this.server.to(socketId).emit('notification', notification);
      sentCount++;
      this.logger.log(`   ✅ Sent to socket ${socketId}`);
    } else {
      this.logger.warn(`   ⚠️  No socket ID found for user ${userId}`);
    }

    // Method 2: Send to user room (works even if socketId is outdated)
    this.server.to(userRoom).emit('notification', notification);
    sentCount++;
    this.logger.log(`   ✅ Sent to room ${userRoom}`);

    if (sentCount === 0) {
      this.logger.error(
        `   ❌ Failed to send notification - user not connected`,
      );
    } else {
      this.logger.log(`   📨 Notification sent via ${sentCount} method(s)`);
    }

    return sentCount > 0;
  }

  // Enhanced method to send notification to multiple users
  async sendNotificationToUsers(userIds: string[], notification: any) {
    this.logger.log(`📤 Sending notification to ${userIds.length} users`);

    let successCount = 0;
    const results: { userId: string; success: boolean }[] = [];

    for (const userId of userIds) {
      const result = await this.sendNotificationToUser(userId, notification);
      results.push({ userId, success: result });
      if (result) successCount++;
    }

    this.logger.log(
      `📨 Sent to ${successCount}/${userIds.length} users successfully`,
    );
    return { successCount, totalUsers: userIds.length, results };
  }

  // Method to send notification to all connected users
  async sendNotificationToAllConnected(notification: any) {
    const connectedUserIds = Array.from(this.connectedUsers.keys());
    this.logger.log(
      `📤 Broadcasting to all ${connectedUserIds.length} connected users`,
    );

    return this.sendNotificationToUsers(connectedUserIds, notification);
  }

  // Method to send notification to all users in a room
  async sendNotificationToRoom(room: string, notification: any) {
    this.server.to(room).emit('notification', notification);
    this.logger.log(`Notification sent to room ${room}`);
  }

  // Method to broadcast to all connected users
  async broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
    this.logger.log(`Broadcasted ${event} to all users`);
  }

  // Method to check if user is connected
  isUserConnected(userId: string): boolean {
    const isConnected = this.connectedUsers.has(userId);
    this.logger.log(`Checking if user ${userId} is connected: ${isConnected}`);
    return isConnected;
  }

  // Method to get user's socket ID
  getUserSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }

  // Method to get connected users count
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Debug method to list all connected users
  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  // Method to get detailed connection status
  getConnectionStatus() {
    const connectedUsers = Array.from(this.connectedUsers.entries()).map(
      ([userId, socketId]) => ({
        userId,
        socketId,
        isOnline: true,
      }),
    );

    return {
      totalConnected: this.connectedUsers.size,
      connectedUsers,
      timestamp: new Date().toISOString(),
    };
  }

  // Method to check if multiple users are connected
  areUsersConnected(userIds: string[]): { [userId: string]: boolean } {
    const status: { [userId: string]: boolean } = {};

    for (const userId of userIds) {
      status[userId] = this.connectedUsers.has(userId);
    }

    this.logger.log(`Multi-user connection check: ${JSON.stringify(status)}`);
    return status;
  }

  // Event listener for notification creation
  @OnEvent('notification.created')
  async handleNotificationCreated(payload: {
    userId: string;
    notification: any;
  }) {
    this.logger.log(
      `📨 Received notification event for user: ${payload.userId}`,
    );
    await this.sendNotificationToUser(payload.userId, payload.notification);
  }

  // Event listener for room notifications
  @OnEvent('notification.room')
  async handleRoomNotification(payload: { room: string; notification: any }) {
    this.logger.log(
      `📨 Received room notification event for room: ${payload.room}`,
    );
    await this.sendNotificationToRoom(payload.room, payload.notification);
  }

  // Event listener for system announcements
  @OnEvent('notification.system')
  async handleSystemAnnouncement(payload: { notification: any }) {
    this.logger.log(`📨 Received system announcement event`);
    await this.broadcastToAll('system_announcement', payload.notification);
  }

  // =============================================================================
  // CHAT EVENTS
  // =============================================================================

  // Event listener for new messages
  @OnEvent('message.sent')
  async handleMessageSent(payload: { message: any; conversationId: string }) {
    this.logger.log(
      `💬 New message in conversation ${payload.conversationId} from ${payload.message.senderId} to ${payload.message.receiverId}`,
    );

    // Send message to receiver via WebSocket
    const receiverId = payload.message.receiverId;
    const socketId = this.connectedUsers.get(receiverId);

    if (socketId) {
      this.server.to(socketId).emit('new_message', {
        message: payload.message,
        conversationId: payload.conversationId,
      });
      this.logger.log(`   ✅ Message delivered to user ${receiverId}`);
    } else {
      this.logger.warn(`   ⚠️  Receiver ${receiverId} is not online`);
    }

    // Also send to sender for confirmation (if they're on a different device)
    const senderId = payload.message.senderId;
    const senderSocketId = this.connectedUsers.get(senderId);

    if (senderSocketId && senderSocketId !== socketId) {
      this.server.to(senderSocketId).emit('message_sent', {
        message: payload.message,
        conversationId: payload.conversationId,
      });
    }
  }

  // Event listener for messages read
  @OnEvent('messages.read')
  async handleMessagesRead(payload: {
    conversationId: string;
    userId: string;
    count: number;
  }) {
    this.logger.log(
      `👁️ User ${payload.userId} read ${payload.count} messages in conversation ${payload.conversationId}`,
    );

    // Notify the other user that their messages were read
    // We need to find the other participant in the conversation
    // For now, we can emit to all users in a conversation room
    this.server
      .to(`conversation:${payload.conversationId}`)
      .emit('messages_read', {
        conversationId: payload.conversationId,
        readBy: payload.userId,
        count: payload.count,
      });
  }

  // Subscribe to join a conversation room
  @SubscribeMessage('join_conversation')
  handleJoinConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = `conversation:${conversationId}`;
    client.join(roomName);
    this.logger.log(
      `User ${client.userId} joined conversation room: ${roomName}`,
    );
    client.emit('joined_conversation', { conversationId });
  }

  // Subscribe to leave a conversation room
  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(
    @MessageBody() conversationId: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const roomName = `conversation:${conversationId}`;
    client.leave(roomName);
    this.logger.log(
      `User ${client.userId} left conversation room: ${roomName}`,
    );
    client.emit('left_conversation', { conversationId });
  }

  // Subscribe to typing indicator
  @SubscribeMessage('typing_start')
  handleTypingStart(
    @MessageBody() data: { conversationId: string; receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('user_typing', {
        conversationId: data.conversationId,
        userId: client.userId,
      });
    }
  }

  // Subscribe to stop typing indicator
  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @MessageBody() data: { conversationId: string; receiverId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('user_stopped_typing', {
        conversationId: data.conversationId,
        userId: client.userId,
      });
    }
  }

  // Helper method to sync Clerk user to database
  private async syncUserToDatabase(clerkUser: any) {
    // Check if user exists
    let dbUser = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await this.prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: clerkUser.publicMetadata?.role || 'STUDENT',
          instructorStatus:
            clerkUser.publicMetadata?.instructorStatus || 'NOT_APPLIED',
          isEmailVerified: true,
          isActive: true,
        },
      });
    }

    return dbUser;
  }
}
