// src/modules/scheduler/cleanup.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly uploadService: UploadService) {}

  // Run cleanup every hour
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredTempUploads() {
    this.logger.log('Starting cleanup of expired temporary uploads...');
    
    try {
      await this.uploadService.cleanupExpiredTempUploads();
      this.logger.log('Successfully cleaned up expired temporary uploads');
    } catch (error) {
      this.logger.error('Failed to cleanup expired temporary uploads', error);
    }
  }

  // Run deep cleanup every day at 2 AM
  @Cron('0 2 * * *')
  async handleDailyCleanup() {
    this.logger.log('Starting daily cleanup...');
    
    try {
      // Clean up orphaned files, old logs, etc.
      await this.performDeepCleanup();
      this.logger.log('Successfully completed daily cleanup');
    } catch (error) {
      this.logger.error('Failed to complete daily cleanup', error);
    }
  }

  private async performDeepCleanup() {
    // Add additional cleanup tasks here
    // - Remove orphaned files
    // - Clean up old logs
    // - Optimize database
    // etc.
  }
}