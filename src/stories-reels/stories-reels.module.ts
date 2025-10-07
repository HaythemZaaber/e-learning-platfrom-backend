import { Module } from '@nestjs/common';
import { StoriesReelsController } from './stories-reels.controller';
import { StoriesReelsService } from './stories-reels.service';
import { VideoProcessingService } from '../video-processing/video-processing.service';
import { UploadService } from '../upload/upload.service';
import { NotificationService } from '../notifications/notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StoriesReelsController],
  providers: [
    StoriesReelsService,
    VideoProcessingService,
    UploadService,
    NotificationService,
    PrismaService,
  ],
  exports: [StoriesReelsService, VideoProcessingService],
})
export class StoriesReelsModule {}
