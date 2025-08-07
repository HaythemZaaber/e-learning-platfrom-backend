import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from './webhooks/webhook.module';
import { CourseModule } from './course/course.module';
import { UploadModule } from './upload/upload.module';
import { ConfigModule } from '@nestjs/config';

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
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env', // optional if your .env is in the root
    }),
    AuthModule,
    UploadModule,
    UserModule,
    CourseModule,
    PrismaModule,
    WebhookModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
