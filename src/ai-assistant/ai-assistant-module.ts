import { Module } from '@nestjs/common';
import { AIAssistantController } from './ai-assistant.controller';
import { AIAssistantService } from './ai-assistant.service';
import { AIChatController } from './ai-chat.controller';
import { AIChatService } from './ai-chat.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),
  ],
  controllers: [AIAssistantController, AIChatController],
  providers: [AIAssistantService, AIChatService],
  exports: [AIAssistantService, AIChatService],
})
export class AIAssistantModule {}
