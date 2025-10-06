import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { NotificationService } from './notification.service';
import { RestAuthGuard } from '../auth/rest-auth.guard';

@Controller('notifications')
@UseGuards(RestAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  /**
   * Get user notifications
   */
  @Get()
  async getUserNotifications(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const userId = req.user.id;
    return this.notificationService.getUserNotifications(userId, page, limit);
  }

  /**
   * Mark notification as read
   */
  @Post(':notificationId/read')
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.notificationService.markAsRead(notificationId, userId);
  }

  /**
   * Mark all notifications as read
   */
  @Post('mark-all-read')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id;
    return this.notificationService.markAllAsRead(userId);
  }

  /**
   * Get unread notification count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.id;
    const count = await this.notificationService.getUnreadCount(userId);
    return { unreadCount: count };
  }
}
