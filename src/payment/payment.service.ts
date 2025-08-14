import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CreateEnrollmentDto, EnrollmentType, EnrollmentSource } from './dto/create-enrollment.dto';
import { PaymentSessionResponse, CouponValidationResponse, EnrollmentResponse } from './interfaces/payment.interface';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-07-30.basil',
    });
  }

  async createPaymentSession(dto: CreatePaymentSessionDto, userId: string): Promise<PaymentSessionResponse> {
    try {
      // Get course details
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
        select: {
          id: true,
          title: true,
          description: true,
          shortDescription: true,
          price: true,
          currency: true,
          thumbnail: true,
          status: true,
          enrollmentType: true,
        },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      if (course.status !== 'PUBLISHED') {
        throw new BadRequestException('Course is not available for enrollment');
      }

      // Check if user is already enrolled
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: dto.courseId,
          },
        },
      });

      if (existingEnrollment) {
        throw new BadRequestException('User is already enrolled in this course');
      }

      // Check if course is free
      const isFreeCourse = course.enrollmentType === 'FREE' || course.price === 0;

      if (isFreeCourse) {
        // For free courses, create enrollment directly without payment session
        // This unlocks the course content for the user
        const enrollmentResult = await this.createEnrollment(
          {
            courseId: dto.courseId,
            type: EnrollmentType.FREE,
            source: EnrollmentSource.DIRECT,
            notes: dto.metadata?.notes || 'Free course enrollment',
          },
          userId,
        );

        if (!enrollmentResult.success) {
          throw new BadRequestException(enrollmentResult.error);
        }

        return {
          success: true,
          session: null,
          redirectUrl: undefined,
          enrollment: enrollmentResult.enrollment,
          isFreeCourse: true,
        };
      }

      // Calculate amount and apply coupon
      let amount = course.price;
      let discountAmount = 0;
      let coupon: any = null;

      if (dto.couponCode) {
        const couponValidation = await this.validateCoupon({
          code: dto.couponCode,
          courseId: dto.courseId,
          amount: course.price,
        });
        
        if (couponValidation.isValid) {
          discountAmount = couponValidation.discountAmount;
          amount = couponValidation.finalAmount;
          coupon = couponValidation.coupon;
        }
      }

      // Convert to cents for Stripe
      const amountInCents = Math.round(amount * 100);
      const discountInCents = Math.round(discountAmount * 100);

      // Create Stripe Checkout Session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: course.currency.toLowerCase(),
              product_data: {
                name: course.title,
                description: course.shortDescription || course.description,
                images: course.thumbnail ? [course.thumbnail] : [],
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: dto.returnUrl || `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: dto.cancelUrl || `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/payment/cancel`,
        metadata: {
          courseId: dto.courseId,
          userId,
          couponCode: dto.couponCode ?? '',
          originalPrice: course.price.toString(),
          discountAmount: discountAmount.toString(),
        },
        expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
      });

      // Create payment session record
      const paymentSession = await this.prisma.paymentSession.create({
        data: {
          id: `ps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          courseId: dto.courseId,
          userId,
          status: 'PENDING',
          amount: course.price,
          currency: course.currency,
          discountAmount: discountAmount,
          finalAmount: amount,
          couponCode: dto.couponCode ?? undefined,
          stripeSessionId: session.id,
          metadata: dto.metadata ?? {},
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      });

      // Update coupon usage if applied
      if (coupon) {
        await this.prisma.coupon.update({
          where: { id: coupon.id },
          data: { currentUses: { increment: 1 } },
        });
      }

      this.logger.log(`Payment session created: ${paymentSession.id} for course: ${dto.courseId}`);

      return {
        success: true,
        session: paymentSession,
        redirectUrl: session.url ?? undefined,
        isFreeCourse: false,
      };
    } catch (error) {
      this.logger.error('Error creating payment session:', error);
      return {
        success: false,
        session: null,
        error: error.message,
        isFreeCourse: false,
      };
    }
  }

  async validateCoupon(dto: ValidateCouponDto): Promise<CouponValidationResponse> {
    try {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.code },
      });

    

      if (!coupon) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: dto.amount,
          error: 'Invalid coupon code',
        };
      }

   

      // Check if coupon is active
      if (!coupon.isActive) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: dto.amount,
          error: 'Coupon is not active',
        };
      }

      // Check validity period
      const now = new Date();
      if (coupon.validFrom && now < coupon.validFrom) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: dto.amount,
          error: 'Coupon is not yet valid',
        };
      }

      if (coupon.validUntil && now > coupon.validUntil) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: dto.amount,
          error: 'Coupon has expired',
        };
      }

      // Check usage limits
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: dto.amount,
          error: 'Coupon usage limit exceeded',
        };
      }

      // Check minimum amount
      if (coupon.minimumAmount && dto.amount < coupon.minimumAmount) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: dto.amount,
          error: `Minimum amount required: $${(coupon.minimumAmount / 100).toFixed(2)}`,
        };
      }

      // Check if coupon applies to this course
      if (coupon.applicableCourses.length > 0 && !coupon.applicableCourses.includes(dto.courseId)) {
        return {
          isValid: false,
          discountAmount: 0,
          finalAmount: dto.amount,
          error: 'Coupon does not apply to this course',
        };
      }

      // Calculate discount
      let discountAmount = 0;
      if (coupon.discountType === 'PERCENTAGE') {
        discountAmount = (dto.amount * coupon.discountValue) / 100;
      } else {
        discountAmount = coupon.discountValue;
      }

      // Apply maximum discount limit
      if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
        discountAmount = coupon.maximumDiscount;
      }

      const finalAmount = Math.max(0, dto.amount - discountAmount);

     

      return {
        isValid: true,
        coupon,
        discountAmount,
        finalAmount,
      };
    } catch (error) {
      this.logger.error('Error validating coupon:', error);
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: dto.amount,
        error: 'Error validating coupon',
      };
    }
  }

  async createEnrollment(dto: CreateEnrollmentDto, userId: string): Promise<EnrollmentResponse> {
    try {
      // Check if user is already enrolled
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: dto.courseId,
          },
        },
      });

      if (existingEnrollment) {
        throw new BadRequestException('User is already enrolled in this course');
      }

      // Get course details
      const course = await this.prisma.course.findUnique({
        where: { id: dto.courseId },
        select: {
          id: true,
          title: true,
          price: true,
          currency: true,
          enrollmentType: true,
          status: true,
        },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      if (course.status !== 'PUBLISHED') {
        throw new BadRequestException('Course is not available for enrollment');
      }

      // Check if course is free
      const isFreeCourse = course.enrollmentType === 'FREE' || course.price === 0;

      // Get payment session if provided (only required for paid courses)
      let paymentSession: any = null;
      if (dto.paymentSessionId) {
        paymentSession = await this.prisma.paymentSession.findUnique({
          where: { id: dto.paymentSessionId },
        });

        if (!paymentSession) {
          throw new NotFoundException('Payment session not found');
        }

        if (paymentSession.userId !== userId) {
          throw new BadRequestException('Payment session does not belong to user');
        }

        if (paymentSession.status !== 'COMPLETED') {
          throw new BadRequestException('Payment session is not completed');
        }
      } else if (!isFreeCourse) {
        // For paid courses, payment session is required
        throw new BadRequestException('Payment session is required for paid courses');
      }

      // Create enrollment
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId: dto.courseId,
          status: 'ACTIVE',
          type: dto.type || (isFreeCourse ? EnrollmentType.FREE : EnrollmentType.PAID),
          source: dto.source || EnrollmentSource.DIRECT,
          paymentStatus: paymentSession ? 'PAID' : 'FREE',
          paymentId: paymentSession?.id,
          amountPaid: paymentSession ? paymentSession.finalAmount : 0,
          discountApplied: paymentSession?.discountAmount || 0,
          amount: paymentSession ? paymentSession.finalAmount : 0,
          currency: course.currency,
          paidAt: paymentSession ? new Date() : null,
          notes: dto.notes,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update payment session with enrollment ID
      if (paymentSession) {
        await this.prisma.paymentSession.update({
          where: { id: dto.paymentSessionId },
          data: { enrollmentId: enrollment.id },
        });
      }

      // Update course enrollment count
      await this.prisma.course.update({
        where: { id: dto.courseId },
        data: { currentEnrollments: { increment: 1 } },
      });

      // Update user enrollment count
      await this.prisma.user.update({
        where: { id: userId },
        data: { totalCoursesEnrolled: { increment: 1 } },
      });

      this.logger.log(`Enrollment created: ${enrollment.id} for user: ${userId}, course: ${dto.courseId}`);

      return {
        success: true,
        enrollment,
      };
    } catch (error) {
      this.logger.error('Error creating enrollment:', error);
      return {
        success: false,
        enrollment: null,
        error: error.message,
      };
    }
  }

  async getPaymentSession(sessionId: string, userId: string) {
    try {
      const session = await this.prisma.paymentSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
              currency: true,
            },
          },
        },
      });

      if (!session) {
        throw new NotFoundException('Payment session not found');
      }

      return session;
    } catch (error) {
      this.logger.error('Error getting payment session:', error);
      throw error;
    }
  }

  async getPaymentSessionByStripeId(stripeSessionId: string) {
    try {
      const session = await this.prisma.paymentSession.findFirst({
        where: {
          stripeSessionId,
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
              currency: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!session) {
        throw new NotFoundException('Payment session not found');
      }

      return session;
    } catch (error) {
      this.logger.error('Error getting payment session by Stripe ID:', error);
      throw error;
    }
  }

  async getUserEnrollments(userId: string) {
    try {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        include: {
          
          course: {
            select: {
              // Basic Course Info
              id: true,
              title: true,
              description: true,
              shortDescription: true,
              thumbnail: true,
              trailer: true,
              galleryImages: true,
              
              // Categorization
              category: true,
              subcategory: true,
              level: true,
              status: true,
              
              // Pricing
              price: true,
              originalPrice: true,
              currency: true,
              discountPercent: true,
              discountValidUntil: true,
              
              // Analytics & Performance
              views: true,
              uniqueViews: true,
              completionRate: true,
              avgRating: true,
              totalRatings: true,
              
              // Content Counts
              totalSections: true,
              totalLectures: true,
              totalQuizzes: true,
              totalAssignments: true,
              totalContentItems: true,
              totalDiscussions: true,
              totalAnnouncements: true,
              
              // Course Settings & Features
              isFeatured: true,
              isBestseller: true,
              isTrending: true,
              
              // Instructor
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                  title: true,
                  bio: true,
                  expertise: true,
                  rating: true,
                  totalStudents: true,
                  totalCourses: true,
                },
              },
              instructorId: true,
              
              // Content Structure
              sections: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  order: true,
                  lectures: {
                    select: {
                      id: true,
                      title: true,
                      description: true,
                      type: true,
                      duration: true,
                      order: true,
                      isPreview: true,
                    },
                    orderBy: { order: 'asc' },
                  },
                },
                orderBy: { order: 'asc' },
              },
              
              // Requirements & Outcomes
              requirements: true,
              whatYouLearn: true,
              objectives: true,
              prerequisites: true,
              
              // Course Details
              language: true,
              subtitleLanguages: true,
              
              // Advanced Features
              hasLiveSessions: true,
              hasRecordings: true,
              hasDiscussions: true,
              hasAssignments: true,
              hasQuizzes: true,
              downloadableResources: true,
              offlineAccess: true,
              mobileOptimized: true,
              
              // Scheduling
              enrollmentStartDate: true,
              enrollmentEndDate: true,
              courseStartDate: true,
              courseEndDate: true,
              
              // Capacity
              maxStudents: true,
              currentEnrollments: true,
              waitlistEnabled: true,
              
              // Reviews
              reviews: {
                select: {
                  id: true,
                  rating: true,
                  comment: true,
                  user: {
                    select: {
                      id: true,
                      username: true,
                      lastName: true,
                    },
                  },
                },
                take: 5, // Limit to 5 recent reviews
                orderBy: { createdAt: 'desc' },
              },
              
              // SEO & Marketing
              seoTitle: true,
              seoDescription: true,
              seoTags: true,
              marketingTags: true,
              targetAudience: true,
              
              // Duration & Difficulty
              estimatedHours: true,
              estimatedMinutes: true,
              difficulty: true,
              intensityLevel: true,
              
              // Certificates & Completion
              certificate: true,
              certificateTemplate: true,
              passingGrade: true,
              allowRetakes: true,
              maxAttempts: true,
              
              // Course Settings
              enrollmentType: true,
              isPublic: true,
              version: true,
              
              // Timestamps
              createdAt: true,
              updatedAt: true,
              publishedAt: true,
              archivedAt: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });

      return enrollments;
    } catch (error) {
      this.logger.error('Error getting user enrollments:', error);
      throw error;
    }
  }

  async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
    const paymentSession = await this.prisma.paymentSession.findFirst({
      where: { stripeSessionId: session.id },
    });

    if (paymentSession) {
      await this.prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: {
          status: 'COMPLETED',
          paymentIntentId: session.payment_intent as string,
        },
      });

      // Create enrollment automatically
      await this.createEnrollment(
        {
          courseId: paymentSession.courseId,
          paymentSessionId: paymentSession.id,
          type: EnrollmentType.PAID,
          source: EnrollmentSource.DIRECT,
        },
        paymentSession.userId,
      );

      this.logger.log(`Payment completed for session: ${paymentSession.id}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    const paymentSession = await this.prisma.paymentSession.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (paymentSession) {
      await this.prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: { status: 'COMPLETED' },
      });
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    const paymentSession = await this.prisma.paymentSession.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (paymentSession) {
      await this.prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: { status: 'FAILED' },
      });
    }
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
    const paymentSession = await this.prisma.paymentSession.findFirst({
      where: { paymentIntentId: paymentIntent.id },
    });

    if (paymentSession) {
      await this.prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: { status: 'CANCELED' },
      });
    }
  }

  constructWebhookEvent(payload: any, signature: string): Stripe.Event {
    try {
      const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
      if (!webhookSecret) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
      }
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret,
      );
    } catch (error) {
      this.logger.error('Webhook signature verification failed:', error);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  async getActiveCoupons() {
    try {
      const coupons = await this.prisma.coupon.findMany({
        where: {
          isActive: true,
          OR: [
            { validUntil: null },
            { validUntil: { gt: new Date() } },
          ],
        },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          discountType: true,
          discountValue: true,
          currency: true,
          validFrom: true,
          validUntil: true,
          minimumAmount: true,
          maximumDiscount: true,
        },
      });

      return coupons;
    } catch (error) {
      this.logger.error('Error getting active coupons:', error);
      throw error;
    }
  }

  async validateFreeCourseEnrollment(courseId: string, userId: string) {
    try {
      // Check if user is already enrolled
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (existingEnrollment) {
        return {
          canEnroll: false,
          error: 'User is already enrolled in this course',
        };
      }

      // Get course details
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          title: true,
          price: true,
          enrollmentType: true,
          status: true,
        },
      });

      if (!course) {
        return {
          canEnroll: false,
          error: 'Course not found',
        };
      }

      if (course.status !== 'PUBLISHED') {
        return {
          canEnroll: false,
          error: 'Course is not available for enrollment',
        };
      }

      // Check if course is free
      const isFreeCourse = course.enrollmentType === 'FREE' || course.price === 0;

      if (!isFreeCourse) {
        return {
          canEnroll: false,
          error: 'This course is not free. Please use the payment enrollment process.',
        };
      }

      // For free courses, user can enroll to unlock content
      return {
        canEnroll: true,
        course,
      };

      return {
        canEnroll: true,
        course,
      };
    } catch (error) {
      this.logger.error('Error validating free course enrollment:', error);
      return {
        canEnroll: false,
        error: 'Error validating enrollment',
      };
    }
  }

  async cancelPaymentSession(sessionId: string, userId: string) {
    try {
      const session = await this.prisma.paymentSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        throw new NotFoundException('Payment session not found');
      }

      if (session.status !== 'PENDING') {
        throw new BadRequestException('Payment session cannot be canceled');
      }

      // Cancel Stripe session if exists
      if (session.stripeSessionId) {
        await this.stripe.checkout.sessions.expire(session.stripeSessionId);
      }

      // Update session status
      await this.prisma.paymentSession.update({
        where: { id: sessionId },
        data: { status: 'CANCELED' },
      });

      return { success: true, message: 'Payment session canceled successfully' };
    } catch (error) {
      this.logger.error('Error canceling payment session:', error);
      throw error;
    }
  }
}
