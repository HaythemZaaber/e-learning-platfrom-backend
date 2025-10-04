import { Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { AuthGuard } from './auth.guard';
import { RestAuthGuard } from './rest-auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import { OptionalAuthGuard } from './optional-auth.guard';
@Module({
  imports: [],
  providers: [
    ClerkService,
    AuthGuard,
    RestAuthGuard,
    RolesGuard,
    PrismaService,
    OptionalAuthGuard,
  ],
  exports: [
    ClerkService,
    AuthGuard,
    RestAuthGuard,
    RolesGuard,
    PrismaService,
    OptionalAuthGuard,
  ],
})
export class AuthModule {}
