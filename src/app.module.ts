import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLJSON } from 'graphql-type-json';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from './webhooks/webhook.module';
import { CourseModule } from './course/course.module';
import { UploadModule } from './upload/upload.module';
import { PaymentModule } from './payment/payment.module';
import { InstructorVerificationModule } from './instructor-verification/instructor-verification.module';
import { InstructorModule } from './instructor/instructor.module';
import { LiveSessionsModule } from './live-sessions/live-sessions.module';
import { StreamModule } from './stream/stream.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AIAssistantModule } from './ai-assistant/ai-assistant-module';
import { WebSocketModule } from './websocket/websocket.module';
import { NotificationModule } from './notifications/notification.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      context: ({ req, res }) => ({
        req,
        res,
        user: req.user,
      }),
      playground: true,
      // graphiql: true,
      resolvers: {
        JSON: GraphQLJSON,
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // optional if your .env is in the root
    }),
    EventEmitterModule.forRoot(),
    AuthModule,
    UploadModule,
    UserModule,
    CourseModule,
    PrismaModule,
    WebhookModule,
    PaymentModule,
    InstructorVerificationModule,
    InstructorModule,
    LiveSessionsModule,
    StreamModule,
    AIAssistantModule,
    WebSocketModule,
    NotificationModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
