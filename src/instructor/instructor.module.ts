import { Module } from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { InstructorResolver } from './instructor.resolver';
import { InstructorProfileService } from './instructor-profile.service';
import { InstructorProfileController } from './instructor-profile.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [InstructorProfileController],
  providers: [InstructorService, InstructorResolver, InstructorProfileService],
  exports: [InstructorService, InstructorProfileService],
})
export class InstructorModule {}
