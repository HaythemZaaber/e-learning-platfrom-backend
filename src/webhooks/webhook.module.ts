import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { UserWebhookController } from './user.webhook.controller';
import { WebhookService } from './webhook.service';

@Module({
  imports: [UserModule, ConfigModule],
  controllers: [UserWebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
