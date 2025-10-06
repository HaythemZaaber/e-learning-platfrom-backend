import { Module } from '@nestjs/common';
import { InstructorService } from './instructor.service';
import { InstructorResolver } from './instructor.resolver';
import { InstructorProfileService } from './instructor-profile.service';
import { InstructorProfileController } from './instructor-profile.controller';
import { InstructorRatingService } from './instructor-rating.service';
import { InstructorRatingController } from './instructor-rating.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [PrismaModule, AuthModule, ReviewsModule],
  controllers: [InstructorProfileController, InstructorRatingController],
  providers: [InstructorService, InstructorResolver, InstructorProfileService, InstructorRatingService],
  exports: [InstructorService, InstructorProfileService, InstructorRatingService],
})
export class InstructorModule {}
