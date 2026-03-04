import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config } from 'dotenv';
import { GraphQLAwareValidationPipe } from './common/pipes/graphql-aware-validation.pipe';
import { IoAdapter } from '@nestjs/platform-socket.io';

config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Use Socket.IO adapter (frontend uses socket.io-client - must match)
  app.useWebSocketAdapter(new IoAdapter(app));

  // Configure payload size limits
  // Exclude Stripe webhook routes from JSON parsing to preserve raw body
  app.use(
    require('express').json({
      limit: '10mb',
      verify: (req, res, buf) => {
        // Store raw body for all requests
        req.rawBody = buf;
      },
    }),
  );
  // IMPORTANT: Ensure body parsing is enabled
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS
  app.enableCors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://your-frontend-domain.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Enable validation with transformation
  // app.useGlobalPipes(
  //   new ValidationPipe({
  //     transform: true,
  //     whitelist: true,
  //     forbidNonWhitelisted: true,
  //     transformOptions: {
  //       enableImplicitConversion: true,
  //     },
  //   }),
  // );

  // Global validation pipe (GraphQL-aware)
  app.useGlobalPipes(new GraphQLAwareValidationPipe());

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3001);
}
bootstrap();
