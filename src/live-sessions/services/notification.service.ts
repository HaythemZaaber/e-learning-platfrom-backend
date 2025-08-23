import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { 
  CreateNotificationDto,
  UpdateNotificationDto,
  MarkAllAsReadDto,
  NotificationFilterDto,
  BulkCreateNotificationDto
} from '../dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async getNotifications(filter: NotificationFilterDto) {
    const {
      userId,
      isRead,
      type,
      deliveryStatus,
      sessionId,
      bookingRequestId,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = filter;

    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead;
    }

    if (type) {
      where.type = type;
    }

    if (deliveryStatus) {
      where.deliveryStatus = deliveryStatus;
    }

    if (sessionId) {
      where.sessionId = sessionId;
    }

    if (bookingRequestId) {
      where.bookingRequestId = bookingRequestId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const notifications = await this.prisma.sessionNotification.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        session: {
          select: {
            id: true,
            title: true,
            scheduledStart: true,
            status: true
          }
        },
        bookingRequest: {
          select: {
            id: true,
            status: true,
            offering: {
              select: {
                title: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get total count for pagination
    const total = await this.prisma.sessionNotification.count({ where });

    return {
      notifications,
      total,
      hasMore: offset + limit < total
    };
  }

  async createNotification(createDto: CreateNotificationDto) {
    // Validate user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createDto.userId }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate session if provided
    if (createDto.sessionId) {
      const session = await this.prisma.liveSession.findUnique({
        where: { id: createDto.sessionId }
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }
    }

    // Validate booking request if provided
    if (createDto.bookingRequestId) {
      const bookingRequest = await this.prisma.bookingRequest.findUnique({
        where: { id: createDto.bookingRequestId }
      });

      if (!bookingRequest) {
        throw new NotFoundException('Booking request not found');
      }
    }

    const notification = await this.prisma.sessionNotification.create({
      data: {
        userId: createDto.userId,
        type: createDto.type,
        title: createDto.title,
        message: createDto.message,
        data: createDto.data || {},
        isRead: false,
        isEmail: createDto.isEmail || false,
        isPush: createDto.isPush || false,
        isSMS: createDto.isSMS || false,
        deliveryStatus: 'QUEUED',
        sessionId: createDto.sessionId,
        bookingRequestId: createDto.bookingRequestId,
        scheduledFor: createDto.scheduledFor || new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Here you would typically trigger the actual notification delivery
    // For email, push, SMS etc.
    await this.scheduleNotificationDelivery(notification);

    return notification;
  }

  async updateNotification(id: string, updateDto: UpdateNotificationDto) {
    const notification = await this.prisma.sessionNotification.findUnique({
      where: { id }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.sessionNotification.update({
      where: { id },
      data: {
        ...updateDto,
        data: updateDto.data !== undefined ? updateDto.data : undefined,
      }
    });
  }

  async markNotificationAsRead(id: string) {
    const notification = await this.prisma.sessionNotification.findUnique({
      where: { id }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.prisma.sessionNotification.update({
      where: { id },
      data: { 
        isRead: true
      }
    });
  }

  async markAllNotificationsAsRead(markAllDto: MarkAllAsReadDto) {
    const { userId, type, beforeDate } = markAllDto;

    const where: any = { 
      userId,
      isRead: false
    };

    if (type) {
      where.type = type;
    }

    if (beforeDate) {
      where.createdAt = { lte: beforeDate };
    }

    const result = await this.prisma.sessionNotification.updateMany({
      where,
      data: { 
        isRead: true 
      }
    });

    return {
      updatedCount: result.count,
      message: `${result.count} notifications marked as read`
    };
  }

  async deleteNotification(id: string) {
    const notification = await this.prisma.sessionNotification.findUnique({
      where: { id }
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.sessionNotification.delete({
      where: { id }
    });

    return { success: true };
  }

  async bulkCreateNotifications(bulkCreateDto: BulkCreateNotificationDto) {
    const { userIds, ...notificationData } = bulkCreateDto;

    // Validate all users exist
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } }
    });

    if (users.length !== userIds.length) {
      throw new NotFoundException('Some users not found');
    }

    // Create notifications for all users
    const notifications = await Promise.all(
      userIds.map(userId =>
        this.prisma.sessionNotification.create({
          data: {
            userId,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data || {},
            isRead: false,
            isEmail: notificationData.isEmail || false,
            isPush: notificationData.isPush || false,
            isSMS: notificationData.isSMS || false,
            deliveryStatus: 'QUEUED',
            scheduledFor: notificationData.scheduledFor || new Date()
          }
        })
      )
    );

    // Schedule delivery for all notifications
    await Promise.all(
      notifications.map(notification => this.scheduleNotificationDelivery(notification))
    );

    return {
      created: notifications.length,
      notifications
    };
  }

  async getUnreadCount(userId: string, type?: string) {
    const where: any = {
      userId,
      isRead: false
    };

    if (type) {
      where.type = type;
    }

    const count = await this.prisma.sessionNotification.count({ where });
    
    return { unreadCount: count };
  }

  async getNotificationPreferences(userId: string) {
    // This would typically come from a user preferences table
    // For now, return default preferences
    return {
      userId,
      email: true,
      push: true,
      sms: false,
      types: {
        BOOKING_RECEIVED: { email: true, push: true, sms: false },
        BOOKING_ACCEPTED: { email: true, push: true, sms: true },
        BOOKING_REJECTED: { email: true, push: false, sms: false },
        SESSION_REMINDER: { email: true, push: true, sms: true },
        SESSION_STARTING: { email: false, push: true, sms: false },
        SESSION_COMPLETED: { email: true, push: false, sms: false },
        PAYMENT_RECEIVED: { email: true, push: true, sms: false },
        PAYOUT_PROCESSED: { email: true, push: false, sms: false }
      }
    };
  }

  async updateNotificationPreferences(userId: string, preferences: any) {
    // This would typically update a user preferences table
    // For now, just return the preferences
    return {
      userId,
      ...preferences,
      updatedAt: new Date()
    };
  }

  async getNotificationStats(userId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [
      totalNotifications,
      readNotifications,
      unreadNotifications,
      byType,
      recentActivity
    ] = await Promise.all([
      this.prisma.sessionNotification.count({
        where: {
          userId,
          createdAt: { gte: startDate }
        }
      }),
      this.prisma.sessionNotification.count({
        where: {
          userId,
          createdAt: { gte: startDate },
          isRead: true
        }
      }),
      this.prisma.sessionNotification.count({
        where: {
          userId,
          isRead: false
        }
      }),
      this.prisma.sessionNotification.groupBy({
        by: ['type'],
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        _count: { type: true }
      }),
      this.prisma.sessionNotification.findMany({
        where: {
          userId,
          createdAt: { gte: startDate }
        },
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    ]);

    return {
      totalNotifications,
      readNotifications,
      unreadNotifications,
      readRate: totalNotifications > 0 ? (readNotifications / totalNotifications) * 100 : 0,
      notificationsByType: byType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {}),
      recentActivity
    };
  }

  private async scheduleNotificationDelivery(notification: any) {
    // Here you would integrate with your notification delivery system
    // For example: email service, push notification service, SMS service
    
    try {
      // Mock delivery logic
      const deliveryMethods: string[] = [];
      
      if (notification.isEmail) {
        deliveryMethods.push('email');
      }
      
      if (notification.isPush) {
        deliveryMethods.push('push');
      }
      
      if (notification.isSMS) {
        deliveryMethods.push('sms');
      }

      // Update delivery status
      await this.prisma.sessionNotification.update({
        where: { id: notification.id },
        data: {
          deliveryStatus: 'SENT',
          sentAt: new Date()
        }
      });

      console.log(`Notification ${notification.id} scheduled for delivery via: ${deliveryMethods.join(', ')}`);
    } catch (error) {
      // Mark as failed
      await this.prisma.sessionNotification.update({
        where: { id: notification.id },
        data: {
          deliveryStatus: 'FAILED'
        }
      });
      
      console.error('Failed to schedule notification delivery:', error);
    }
  }

  async retryFailedNotifications(limit: number = 100) {
    const failedNotifications = await this.prisma.sessionNotification.findMany({
      where: {
        deliveryStatus: 'FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Only retry within last 24 hours
        }
      },
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    let retriedCount = 0;
    for (const notification of failedNotifications) {
      await this.prisma.sessionNotification.update({
        where: { id: notification.id },
        data: { deliveryStatus: 'RETRYING' }
      });
      
      await this.scheduleNotificationDelivery(notification);
      retriedCount++;
    }

    return {
      retriedCount,
      message: `${retriedCount} notifications retried`
    };
  }
}