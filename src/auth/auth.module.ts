import { Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { AuthGuard } from './auth.guard';
import { RestAuthGuard } from './rest-auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [],
  providers: [ClerkService, AuthGuard, RestAuthGuard, RolesGuard, PrismaService],
  exports: [ClerkService, AuthGuard, RestAuthGuard, RolesGuard, PrismaService],
})
export class AuthModule {}
