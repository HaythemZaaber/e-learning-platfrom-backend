import { Module } from '@nestjs/common';
import { InstructorVerificationService } from './instructor-verification.service';
import { InstructorVerificationResolver } from './instructor-verification.resolver';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { InstructorModule } from '../instructor/instructor.module';

@Module({
  imports: [PrismaModule, AuthModule, InstructorModule],

  providers: [InstructorVerificationService, InstructorVerificationResolver],
  exports: [InstructorVerificationService],
})
export class InstructorVerificationModule {}
