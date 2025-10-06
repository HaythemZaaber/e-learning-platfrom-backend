import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { RestAuthGuard } from '../auth/rest-auth.guard';
import { SendMessageDto } from './dto/send-message.dto';
import { GetConversationsDto } from './dto/get-conversations.dto';
import { MarkMessagesReadDto } from './dto/mark-read.dto';

@Controller('chat')
@UseGuards(RestAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  /**
   * Send a message to another user
   * POST /chat/messages
   */
  @Post('messages')
  async sendMessage(@Request() req: any, @Body() dto: SendMessageDto) {
    const userId = req.user.id;
    return this.chatService.sendMessage(userId, dto);
  }

  /**
   * Get all conversations for the current user
   * GET /chat/conversations
   */
  @Get('conversations')
  async getConversations(
    @Request() req: any,
    @Query() query: GetConversationsDto,
  ) {
    const userId = req.user.id;
    return this.chatService.getUserConversations(
      userId,
      query.page,
      query.limit,
    );
  }

  /**
   * Get messages in a specific conversation
   * GET /chat/conversations/:conversationId/messages
   */
  @Get('conversations/:conversationId/messages')
  async getMessages(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const userId = req.user.id;
    return this.chatService.getConversationMessages(
      userId,
      conversationId,
      page || 1,
      limit || 50,
    );
  }

  /**
   * Mark all messages in a conversation as read
   * POST /chat/conversations/:conversationId/read
   */
  @Post('conversations/:conversationId/read')
  async markAsRead(
    @Request() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    const userId = req.user.id;
    return this.chatService.markMessagesAsRead(userId, conversationId);
  }

  /**
   * Get unread messages count
   * GET /chat/unread-count
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.id;
    return this.chatService.getUnreadCount(userId);
  }

  /**
   * Delete a message
   * DELETE /chat/messages/:messageId
   */
  @Delete('messages/:messageId')
  async deleteMessage(
    @Request() req: any,
    @Param('messageId') messageId: string,
  ) {
    const userId = req.user.id;
    return this.chatService.deleteMessage(userId, messageId);
  }

  /**
   * Get or create conversation with a specific user
   * POST /chat/conversations/with/:userId
   */
  @Post('conversations/with/:userId')
  async getOrCreateConversation(
    @Request() req: any,
    @Param('userId') otherUserId: string,
  ) {
    const userId = req.user.id;
    return this.chatService.getOrCreateConversation(userId, otherUserId);
  }
}
