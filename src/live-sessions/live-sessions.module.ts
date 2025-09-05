import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';

// Controllers
import { AvailabilityController } from './controllers/availability.controller';
import { SessionTopicController } from './controllers/session-topic.controller';
import { SessionOfferingController } from './controllers/session-offering.controller';
import { BookingRequestController } from './controllers/booking-request.controller';
import { LiveSessionController } from './controllers/live-session.controller';
import { PaymentController } from './controllers/payment.controller';
import { NotificationController } from './controllers/notification.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { SessionBookingController } from './controllers/session-booking.controller';
import { PayoutController } from './controllers/payout.controller';

// Services
import { AvailabilityService } from './services/availability.service';
import { SessionTopicService } from './services/session-topic.service';
import { SessionOfferingService } from './services/session-offering.service';
import { BookingRequestService } from './services/booking-request.service';
import { LiveSessionService } from './services/live-session.service';
import { PaymentService } from './services/payment.service';
import { NotificationService } from './services/notification.service';
import { AnalyticsService } from './services/analytics.service';
import { TimeSlotService } from './services/time-slot.service';
import { SessionBookingService } from './services/session-booking.service';
import { PayoutService } from './services/payout.service';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    PaymentModule,
    AuthModule
  ],
  controllers: [
    AvailabilityController,
    SessionTopicController,
    SessionOfferingController,
    BookingRequestController,
    LiveSessionController,
    PaymentController,
    NotificationController,
    AnalyticsController,
    SessionBookingController,
    PayoutController,
  ],
  providers: [
    AvailabilityService,
    SessionTopicService,
    SessionOfferingService,
    BookingRequestService,
    LiveSessionService,
    PaymentService,
    NotificationService,
    AnalyticsService,
    TimeSlotService,
    SessionBookingService,
    PayoutService,
  ],
  exports: [
    AvailabilityService,
    SessionTopicService,
    SessionOfferingService,
    BookingRequestService,
    LiveSessionService,
    PaymentService,
    NotificationService,
    AnalyticsService,
    TimeSlotService,
    SessionBookingService,
    PayoutService,
  ],
})
export class LiveSessionsModule {}