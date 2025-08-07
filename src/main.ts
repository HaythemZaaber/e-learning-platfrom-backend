import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { config } from 'dotenv';
config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configure payload size limits
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:3000', 'https://your-frontend-domain.com'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Serve static files from uploads directory
  // the join function is used to join the path of the uploads directory with the path of the current file
  // the __dirname is the path of the current file
  // the .. is the parent directory of the current file
  // the uploads is the name of the directory that contains the uploaded files
  // the prefix is the prefix of the url that will be used to serve the files
  // the useStaticAssets function is used to serve static files from the uploads directory
  // the app.useStaticAssets function is used to serve static files from the uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  
  await app.listen(3001);
}
bootstrap();
