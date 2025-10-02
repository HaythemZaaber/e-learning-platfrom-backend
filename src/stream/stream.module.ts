import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StreamService } from './services/stream.service.simple';
import { StreamController } from './controllers/stream.controller';
import { StreamWebhookController } from './controllers/stream-webhook.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  providers: [StreamService],
  controllers: [StreamController, StreamWebhookController],
  exports: [StreamService],
})
export class StreamModule {}
