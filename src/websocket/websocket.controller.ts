import { Controller, Post, UseGuards, Request } from '@nestjs/common';
import { NotificationService } from '../notifications/notification.service';
import { WebSocketGatewayService } from './websocket.gateway';
import { RestAuthGuard } from '../auth/rest-auth.guard';

@Controller('websocket')
@UseGuards(RestAuthGuard)
export class WebSocketController {
  constructor(
    private notificationService: NotificationService,
    private websocketGateway: WebSocketGatewayService,
  ) {}

  /**
   * Send a test notification to the current user
   */
  @Post('test-notification')
  async sendTestNotification(@Request() req: any) {
    const userId = req.user.id;

    await this.notificationService.createNotification({
      userId,
      type: 'TEST',
      title: 'WebSocket Test',
      message: 'This is a test notification sent via WebSocket',
      data: { test: true },
    });

    return { message: 'Test notification sent' };
  }

  /**
   * Get WebSocket connection status
   */
  @Post('status')
  async getConnectionStatus(@Request() req: any) {
    const userId = req.user.id;
    const isOnline = this.websocketGateway.isUserConnected(userId);
    const totalOnline = this.websocketGateway.getConnectedUsersCount();

    return {
      userId,
      isOnline,
      totalOnlineUsers: totalOnline,
    };
  }

  /**
   * Get detailed connection status for all users
   */
  @Post('status/all')
  async getAllConnectionStatus(@Request() req: any) {
    return this.websocketGateway.getConnectionStatus();
  }

  /**
   * Test multi-user notification (for testing follow scenarios)
   */
  @Post('test-multi-user')
  async testMultiUserNotification(@Request() req: any) {
    const currentUserId = req.user.id;
    const allConnectedUsers = this.websocketGateway.getConnectedUsers();

    // Send notification to all connected users except the current user
    const otherUsers = allConnectedUsers.filter((id) => id !== currentUserId);

    if (otherUsers.length === 0) {
      return { message: 'No other users connected to test with' };
    }

    const notification = {
      id: `multi_test_${Date.now()}`,
      type: 'MULTI_USER_TEST',
      title: 'Multi-User Test Notification',
      message: `This is a test notification sent to ${otherUsers.length} other users`,
      priority: 'NORMAL',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const result = await this.websocketGateway.sendNotificationToUsers(
      otherUsers,
      notification,
    );

    return {
      message: `Test notification sent to ${result.successCount}/${result.totalUsers} users`,
      targetUsers: otherUsers,
      results: result.results,
    };
  }
}
