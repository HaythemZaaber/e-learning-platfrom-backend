import { Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  providers: [ClerkService, AuthGuard, RolesGuard, PrismaService],
  exports: [ClerkService, AuthGuard, RolesGuard, PrismaService],
})
export class AuthModule {}
