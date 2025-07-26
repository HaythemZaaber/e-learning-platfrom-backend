import { Module } from '@nestjs/common';
import { CourseService } from './course.service';
import { CourseResolver } from './course.resolver';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
// import { AIModule } from '../ai/ai.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, UploadModule, AuthModule],
  providers: [CourseService, CourseResolver],
  exports: [CourseService],
})
export class CourseModule {}
