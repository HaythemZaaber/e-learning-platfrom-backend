import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { SessionNotificationListener } from './session-notification.listener';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

export const APP_NOTIFICATION_SERVICE = Symbol('APP_NOTIFICATION_SERVICE');

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [NotificationController],
  providers: [
    NotificationService,
    SessionNotificationListener,
    {
      provide: APP_NOTIFICATION_SERVICE,
      useExisting: NotificationService,
    },
  ],
  exports: [NotificationService, APP_NOTIFICATION_SERVICE],
})
export class NotificationModule {}
