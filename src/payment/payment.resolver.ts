import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PaymentService } from './payment.service';
import { Enrollment } from '../course/entities/course.entity';

@Resolver(() => Enrollment)
@UseGuards(AuthGuard, RolesGuard)
export class PaymentResolver {
  constructor(private readonly paymentService: PaymentService) {}

  @Query(() => [Enrollment], { name: 'myEnrollments' })
  async getMyEnrollments(@Context() context: any): Promise<any[]> {
    const userId = context.req.user.id;
    const enrollments = await this.paymentService.getUserEnrollments(userId);
    
    // Return the data as-is for now, GraphQL will handle the mapping
    return enrollments;
  }

  @Query(() => Enrollment, { name: 'myEnrollment', nullable: true })
  async getMyEnrollment(
    @Args('courseId') courseId: string,
    @Context() context: any,
  ): Promise<any | null> {
    const userId = context.req.user.id;
    const enrollments = await this.paymentService.getUserEnrollments(userId);
    const enrollment = enrollments.find(e => e.courseId === courseId);
    
    return enrollment || null;
  }
}
