import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    HttpCode,
    Put,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { NotificationService } from '../services/notification.service';
  import { 
    CreateNotificationDto,
    UpdateNotificationDto,
    MarkAllAsReadDto,
    NotificationFilterDto,
    BulkCreateNotificationDto
  } from '../dto/notification.dto';
  import { NotificationType, DeliveryStatus } from '../dto/common.dto';
  import { RestAuthGuard } from '../../auth/rest-auth.guard';
  
  @ApiTags('Session Notifications')
  @ApiBearerAuth()
  @UseGuards(RestAuthGuard)
  @Controller('session-notifications')
  export class NotificationController {
    constructor(private readonly notificationService: NotificationService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get notifications with filters' })
    @ApiResponse({ 
      status: 200, 
      description: 'Notifications retrieved successfully' 
    })
    @ApiQuery({ name: 'userId', required: true, description: 'User ID' })
    @ApiQuery({ name: 'isRead', required: false, description: 'Filter by read status', type: Boolean })
    @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filter by type' })
    @ApiQuery({ name: 'deliveryStatus', required: false, enum: DeliveryStatus, description: 'Filter by delivery status' })
    @ApiQuery({ name: 'sessionId', required: false, description: 'Filter by session ID' })
    @ApiQuery({ name: 'bookingRequestId', required: false, description: 'Filter by booking request ID' })
    @ApiQuery({ name: 'startDate', required: false, description: 'Filter by start date' })
    @ApiQuery({ name: 'endDate', required: false, description: 'Filter by end date' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of notifications to return', type: Number })
    @ApiQuery({ name: 'offset', required: false, description: 'Number of notifications to skip', type: Number })
    async getNotifications(
      @Query('userId') userId: string,
      @Query('isRead') isRead?: boolean,
      @Query('type') type?: NotificationType,
      @Query('deliveryStatus') deliveryStatus?: DeliveryStatus,
      @Query('sessionId') sessionId?: string,
      @Query('bookingRequestId') bookingRequestId?: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
      @Query('limit') limit?: number,
      @Query('offset') offset?: number,
    ) {
      const filter: NotificationFilterDto = {
        userId,
        isRead: isRead !== undefined ? Boolean(isRead) : undefined,
        type,
        deliveryStatus,
        sessionId,
        bookingRequestId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      };
  
      return this.notificationService.getNotifications(filter);
    }
  
    @Post()
    @ApiOperation({ summary: 'Create notification' })
    @ApiResponse({ 
      status: 201, 
      description: 'Notification created successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'User, session, or booking request not found' 
    })
    async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
      return this.notificationService.createNotification(createNotificationDto);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update notification' })
    @ApiResponse({ 
      status: 200, 
      description: 'Notification updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Notification not found' 
    })
    async updateNotification(
      @Param('id') id: string,
      @Body() updateNotificationDto: UpdateNotificationDto
    ) {
      return this.notificationService.updateNotification(id, updateNotificationDto);
    }
  
    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiResponse({ 
      status: 200, 
      description: 'Notification marked as read successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Notification not found' 
    })
    async markNotificationAsRead(@Param('id') id: string) {
      return this.notificationService.markNotificationAsRead(id);
    }
  
    @Patch('mark-all-read')
    @ApiOperation({ summary: 'Mark all notifications as read' })
    @ApiResponse({ 
      status: 200, 
      description: 'All notifications marked as read successfully' 
    })
    async markAllNotificationsAsRead(@Body() markAllAsReadDto: MarkAllAsReadDto) {
      return this.notificationService.markAllNotificationsAsRead(markAllAsReadDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete notification' })
    @ApiResponse({ 
      status: 200, 
      description: 'Notification deleted successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Notification not found' 
    })
    @HttpCode(HttpStatus.OK)
    async deleteNotification(@Param('id') id: string) {
      return this.notificationService.deleteNotification(id);
    }
  
    @Post('bulk-create')
    @ApiOperation({ summary: 'Create notifications for multiple users' })
    @ApiResponse({ 
      status: 201, 
      description: 'Bulk notifications created successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Some users not found' 
    })
    async bulkCreateNotifications(@Body() bulkCreateNotificationDto: BulkCreateNotificationDto) {
      return this.notificationService.bulkCreateNotifications(bulkCreateNotificationDto);
    }
  
    @Get(':userId/unread-count')
    @ApiOperation({ summary: 'Get unread notification count' })
    @ApiResponse({ 
      status: 200, 
      description: 'Unread count retrieved successfully' 
    })
    @ApiQuery({ name: 'type', required: false, enum: NotificationType, description: 'Filter by type' })
    async getUnreadCount(
      @Param('userId') userId: string,
      @Query('type') type?: NotificationType
    ) {
      return this.notificationService.getUnreadCount(userId, type);
    }
  
    @Get(':userId/preferences')
    @ApiOperation({ summary: 'Get notification preferences' })
    @ApiResponse({ 
      status: 200, 
      description: 'Notification preferences retrieved successfully' 
    })
    async getNotificationPreferences(@Param('userId') userId: string) {
      return this.notificationService.getNotificationPreferences(userId);
    }
  
    @Put(':userId/preferences')
    @ApiOperation({ summary: 'Update notification preferences' })
    @ApiResponse({ 
      status: 200, 
      description: 'Notification preferences updated successfully' 
    })
    async updateNotificationPreferences(
      @Param('userId') userId: string,
      @Body() preferences: any
    ) {
      return this.notificationService.updateNotificationPreferences(userId, preferences);
    }
  
    @Get(':userId/stats')
    @ApiOperation({ summary: 'Get notification statistics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Notification statistics retrieved successfully' 
    })
    @ApiQuery({ name: 'days', required: false, description: 'Number of days to analyze', type: Number })
    async getNotificationStats(
      @Param('userId') userId: string,
      @Query('days') days?: number
    ) {
      return this.notificationService.getNotificationStats(
        userId,
        days ? Number(days) : undefined
      );
    }
  
    @Post('retry-failed')
    @ApiOperation({ summary: 'Retry failed notifications' })
    @ApiResponse({ 
      status: 200, 
      description: 'Failed notifications retried successfully' 
    })
    @ApiQuery({ name: 'limit', required: false, description: 'Maximum notifications to retry', type: Number })
    @HttpCode(HttpStatus.OK)
    async retryFailedNotifications(@Query('limit') limit?: number) {
      return this.notificationService.retryFailedNotifications(
        limit ? Number(limit) : undefined
      );
    }
  }