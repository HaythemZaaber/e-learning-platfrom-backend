import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface CreateNotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority?: string;
  actionUrl?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async createNotification(data: CreateNotificationData) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type as any,
        title: data.title,
        message: data.message,
        data: data.data || {},
        priority: (data.priority as any) || 'NORMAL',
        actionUrl: data.actionUrl,
      },
    });

    // Emit event for WebSocket notification
    try {
      this.eventEmitter.emit('notification.created', {
        userId: data.userId,
        notification: {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          isRead: notification.isRead,
          createdAt: notification.createdAt,
        },
      });
    } catch (error) {
      console.error('Failed to emit notification event:', error);
      // Don't throw error - notification was still created in database
    }

    return notification;
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  // Send notification to multiple users
  async createBulkNotifications(notifications: CreateNotificationData[]) {
    // Create notifications individually to get their IDs and timestamps
    const createdNotifications: any[] = [];

    for (const notificationData of notifications) {
      const createdNotification =
        await this.createNotification(notificationData);
      createdNotifications.push(createdNotification);
    }

    return { count: createdNotifications.length };
  }

  // Send notification to all users in a room (for course announcements, etc.)
  async createRoomNotification(
    room: string,
    notification: Omit<CreateNotificationData, 'userId'>,
  ) {
    // This would typically get all users in a course/room from your database
    // For now, we'll just emit a room notification event
    try {
      this.eventEmitter.emit('notification.room', {
        room,
        notification: {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          isRoomNotification: true,
        },
      });
    } catch (error) {
      console.error('Failed to emit room notification event:', error);
    }
  }

  // Send system-wide announcement
  async createSystemAnnouncement(
    notification: Omit<CreateNotificationData, 'userId'>,
  ) {
    try {
      this.eventEmitter.emit('notification.system', {
        notification: {
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          priority: notification.priority,
          actionUrl: notification.actionUrl,
          isSystemAnnouncement: true,
        },
      });
    } catch (error) {
      console.error('Failed to emit system announcement event:', error);
    }
  }
}
