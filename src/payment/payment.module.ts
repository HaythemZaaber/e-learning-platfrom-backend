import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { PaymentResolver } from './payment.resolver';
import { PayPalService } from './paypal.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, AuthModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentResolver, PayPalService],
  exports: [PaymentService, PayPalService],
})
export class PaymentModule {}
