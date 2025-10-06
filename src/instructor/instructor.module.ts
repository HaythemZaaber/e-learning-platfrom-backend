import { Module } from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { InstructorResolver } from './instructor.resolver';
import { InstructorProfileService } from './instructor-profile.service';
import { InstructorProfileController } from './instructor-profile.controller';
import { InstructorRatingService } from './instructor-rating.service';
import { InstructorRatingController } from './instructor-rating.controller';
import { InstructorFollowService } from './instructor-follow.service';
import { InstructorFollowController } from './instructor-follow.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ReviewsModule } from './reviews/reviews.module';
import { NotificationModule } from '../notifications/notification.module';

@Module({
  imports: [PrismaModule, AuthModule, ReviewsModule, NotificationModule],
  controllers: [
    InstructorProfileController,
    InstructorRatingController,
    InstructorFollowController,
  ],
  providers: [
    InstructorService,
    InstructorResolver,
    InstructorProfileService,
    InstructorRatingService,
    InstructorFollowService,
  ],
  exports: [
    InstructorService,
    InstructorProfileService,
    InstructorRatingService,
    InstructorFollowService,
  ],
})
export class InstructorModule {}
