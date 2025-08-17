import { Module } from '@nestjs/common';
import { InstructorVerificationService } from './instructor-verification.service';
import { InstructorVerificationResolver } from './instructor-verification.resolver';

import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],

  providers: [InstructorVerificationService, InstructorVerificationResolver],
  exports: [InstructorVerificationService],
})
export class InstructorVerificationModule {}
