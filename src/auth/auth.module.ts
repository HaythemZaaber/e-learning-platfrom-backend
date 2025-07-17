import { Module } from '@nestjs/common';
import { ClerkService } from './clerk.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';

@Module({
  providers: [ClerkService, AuthGuard, RolesGuard],
  exports: [ClerkService, AuthGuard, RolesGuard],
})
export class AuthModule {}
