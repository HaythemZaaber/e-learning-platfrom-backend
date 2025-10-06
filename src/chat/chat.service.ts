import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private notificationService: NotificationService,
  ) {}

  /**
   * Get or create a conversation between two users
   */
  async getOrCreateConversation(userId1: string, userId2: string) {
    // Ensure consistent ordering for unique constraint
    const [participant1Id, participant2Id] =
      userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    let conversation = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          { participant1Id: userId1, participant2Id: userId2 },
          { participant1Id: userId2, participant2Id: userId1 },
        ],
      },
      include: {
        participant1: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            role: true,
          },
        },
        participant2: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          participant1Id,
          participant2Id,
        },
        include: {
          participant1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
          participant2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
        },
      });
    }

    return conversation;
  }

  /**
   * Send a message in a conversation
   */
  async sendMessage(senderId: string, dto: SendMessageDto) {
    const { receiverId, content, messageType, attachments } = dto;

    // Validate that sender and receiver are different
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send message to yourself');
    }

    // Verify receiver exists
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });

    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Get or create conversation
    const conversation = await this.getOrCreateConversation(
      senderId,
      receiverId,
    );

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId,
        receiverId,
        content,
        messageType: messageType || 'TEXT',
        attachments: attachments || [],
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });

    // Update conversation's last message
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        lastMessagePreview: content.substring(0, 100),
      },
    });

    // Emit event for real-time delivery via WebSocket
    this.eventEmitter.emit('message.sent', {
      message,
      conversationId: conversation.id,
    });

    // Create notification for the receiver
    await this.notificationService.createNotification({
      userId: receiverId,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: `${message.sender.firstName || 'Someone'} sent you a message: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
      data: {
        conversationId: conversation.id,
        messageId: message.id,
        senderId: message.senderId,
        senderName:
          `${message.sender.firstName} ${message.sender.lastName}`.trim(),
      },
      priority: 'NORMAL',
      actionUrl: `/chat/${conversation.id}`,
    });

    return message;
  }

  /**
   * Get all conversations for a user
   */
  async getUserConversations(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [conversations, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
          isActive: true,
        },
        include: {
          participant1: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
          participant2: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              profileImage: true,
              role: true,
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              content: true,
              createdAt: true,
              isRead: true,
              senderId: true,
            },
          },
          _count: {
            select: {
              messages: {
                where: {
                  receiverId: userId,
                  isRead: false,
                },
              },
            },
          },
        },
        orderBy: {
          lastMessageAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.conversation.count({
        where: {
          OR: [{ participant1Id: userId }, { participant2Id: userId }],
          isActive: true,
        },
      }),
    ]);

    return {
      conversations: conversations.map((conv) => ({
        ...conv,
        otherUser:
          conv.participant1.id === userId
            ? conv.participant2
            : conv.participant1,
        lastMessage: conv.messages[0] || null,
        unreadCount: conv._count.messages,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get messages in a conversation
   */
  async getConversationMessages(
    userId: string,
    conversationId: string,
    page: number = 1,
    limit: number = 50,
  ) {
    // Verify user is part of conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          conversationId,
          isDeleted: false,
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.message.count({
        where: {
          conversationId,
          isDeleted: false,
        },
      }),
    ]);

    return {
      messages: messages.reverse(), // Show oldest first
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(userId: string, conversationId: string) {
    // Verify user is part of conversation
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [{ participant1Id: userId }, { participant2Id: userId }],
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    // Mark all unread messages from other user as read
    const result = await this.prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Emit event to notify sender
    this.eventEmitter.emit('messages.read', {
      conversationId,
      userId,
      count: result.count,
    });

    return {
      success: true,
      markedCount: result.count,
    };
  }

  /**
   * Get unread messages count for a user
   */
  async getUnreadCount(userId: string) {
    const count = await this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
        isDeleted: false,
      },
    });

    return { unreadCount: count };
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(userId: string, messageId: string) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new BadRequestException('You can only delete your own messages');
    }

    const deletedMessage = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return deletedMessage;
  }
}
