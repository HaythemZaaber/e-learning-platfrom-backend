import { Module } from '@nestjs/common';
import { WebSocketGatewayService } from './websocket.gateway';
import { WebSocketController } from './websocket.controller';
import { NotificationModule } from '../notifications/notification.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [NotificationModule, AuthModule, PrismaModule],
  controllers: [WebSocketController],
  providers: [WebSocketGatewayService],
  exports: [WebSocketGatewayService],
})
export class WebSocketModule {}
