import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config } from 'dotenv';
import { GraphQLAwareValidationPipe } from './common/pipes/graphql-aware-validation.pipe';
config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });



  // Configure payload size limits
  app.use(require('express').json({ limit: '10mb' ,verify: (req, res, buf) => {
    req.rawBody = buf;
  }}));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
    credentials: true,
  });

  // Global validation pipe (GraphQL-aware)
  app.useGlobalPipes(new GraphQLAwareValidationPipe());

  // Serve static files from uploads directory
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(3001);
}
bootstrap();
