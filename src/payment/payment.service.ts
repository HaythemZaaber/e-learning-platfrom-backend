import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentSessionDto } from './dto/create-payment-session.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import {
  CreateEnrollmentDto,
  EnrollmentType,
  EnrollmentSource,
} from './dto/create-enrollment.dto';
import {
  PaymentSessionResponse,
  CouponValidationResponse,
  EnrollmentResponse,
} from './interfaces/payment.interface';
import { PayPalService } from './paypal.service';
import { CreateStripeConnectAccountDto } from './dto/stripe-connect.dto';

@Injectable()
export class PaymentService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly paypalService: PayPalService,
  ) {
    const stripeKey = this.configService.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2025-07-30.basil',
    });
  }

  async createPaymentSession(
    dto: CreatePaymentSessionDto,
    userId: string,
  ): Promise<PaymentSessionResponse> {
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
        throw new BadRequestException(
          'User is already enrolled in this course',
        );
      }

      // Check if course is free
      const isFreeCourse =
        course.enrollmentType === 'FREE' || course.price === 0;

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

      // Determine payment provider
      const provider = dto.provider || 'STRIPE';

      // Convert to cents
      const amountInCents = Math.round(amount * 100);
      const discountInCents = Math.round(discountAmount * 100);

      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const defaultCancelUrl = `${frontendUrl}/payment/cancel`;

      let redirectUrl: string | undefined;
      let paymentProviderId: string | undefined;

      if (provider === 'PAYPAL') {
        // PayPal doesn't support placeholders in return URL
        // PayPal will redirect with ?token=ORDER_ID in the URL
        const paypalReturnUrl =
          dto.returnUrl || `${frontendUrl}/payment/success?provider=PAYPAL`;

        // Create PayPal order
        const paypalOrder = await this.paypalService.createOrder(
          amountInCents,
          course.currency,
          course.title,
          paypalReturnUrl,
          dto.cancelUrl || defaultCancelUrl,
          {
            courseId: dto.courseId,
            userId,
            couponCode: dto.couponCode,
          },
        );

        if (!paypalOrder) {
          throw new BadRequestException('Failed to create PayPal order');
        }

        paymentProviderId = paypalOrder.id;
        redirectUrl =
          this.paypalService.getApprovalUrl(paypalOrder.links) || undefined;

        if (!redirectUrl) {
          throw new BadRequestException('Failed to get PayPal approval URL');
        }
      } else {
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
          success_url:
            dto.returnUrl ||
            `${frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&provider=STRIPE`,
          cancel_url: dto.cancelUrl || defaultCancelUrl,
          metadata: {
            courseId: dto.courseId,
            userId,
            couponCode: dto.couponCode ?? '',
            originalPrice: course.price.toString(),
            discountAmount: discountAmount.toString(),
          },
          expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes
        });

        paymentProviderId = session.id;
        redirectUrl = session.url ?? undefined;
      }

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
          provider: provider,
          stripeSessionId:
            provider === 'STRIPE' ? paymentProviderId : undefined,
          paypalOrderId: provider === 'PAYPAL' ? paymentProviderId : undefined,
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

      this.logger.log(
        `Payment session created: ${paymentSession.id} for course: ${dto.courseId} with provider: ${provider}`,
      );

      return {
        success: true,
        session: paymentSession,
        redirectUrl: redirectUrl,
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

  async validateCoupon(
    dto: ValidateCouponDto,
  ): Promise<CouponValidationResponse> {
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
      if (
        coupon.applicableCourses.length > 0 &&
        !coupon.applicableCourses.includes(dto.courseId)
      ) {
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

  async createEnrollment(
    dto: CreateEnrollmentDto,
    userId: string,
  ): Promise<EnrollmentResponse> {
    try {
      // Log the incoming data for debugging
      this.logger.log(
        `Creating enrollment for user: ${userId}, courseId: ${dto.courseId}, dto: ${JSON.stringify(dto)}`,
      );

      // Validate required fields
      if (!dto.courseId) {
        throw new BadRequestException('Course ID is required for enrollment');
      }

      if (!userId) {
        throw new BadRequestException('User ID is required for enrollment');
      }

      // Check if user is already enrolled (idempotent: return existing enrollment)
      const existingEnrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId: dto.courseId,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              shortDescription: true,
              price: true,
              currency: true,
              status: true,
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

      if (existingEnrollment) {
        return {
          success: true,
          enrollment: existingEnrollment,
        };
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
      const isFreeCourse =
        course.enrollmentType === 'FREE' || course.price === 0;

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
          throw new BadRequestException(
            'Payment session does not belong to user',
          );
        }

        if (paymentSession.status !== 'COMPLETED') {
          throw new BadRequestException('Payment session is not completed');
        }
      } else if (!isFreeCourse) {
        // For paid courses, payment session is required
        throw new BadRequestException(
          'Payment session is required for paid courses',
        );
      }

      // Create enrollment
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId: dto.courseId,
          status: 'ACTIVE',
          type:
            dto.type ||
            (isFreeCourse ? EnrollmentType.FREE : EnrollmentType.PAID),
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

      this.logger.log(
        `Enrollment created: ${enrollment.id} for user: ${userId}, course: ${dto.courseId}`,
      );

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

  async getPaymentSessionByPayPalOrderId(paypalOrderId: string) {
    try {
      const paymentSession = await this.prisma.paymentSession.findFirst({
        where: {
          paypalOrderId,
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

      if (!paymentSession) {
        throw new NotFoundException('Payment session not found');
      }

      return {
        type: 'course_enrollment',
        session: paymentSession,
        paypalOrderId: paymentSession.paypalOrderId,
        status: paymentSession.status,
        amount: paymentSession.amount,
        currency: paymentSession.currency,
        course: paymentSession.course,
        user: paymentSession.user,
        createdAt: paymentSession.createdAt,
        updatedAt: paymentSession.updatedAt,
      };
    } catch (error) {
      this.logger.error(
        'Error getting payment session by PayPal order ID:',
        error,
      );
      throw error;
    }
  }

  async handlePayPalWebhook(event: any) {
    try {
      this.logger.log('PayPal webhook received:', event.event_type);

      // Handle different webhook event types
      if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        // Payment was captured
        const orderId =
          event.resource?.supplementary_data?.related_ids?.order_id;
        if (orderId) {
          // Find payment session
          const paymentSession = await this.prisma.paymentSession.findFirst({
            where: { paypalOrderId: orderId },
          });

          if (paymentSession && paymentSession.status !== 'COMPLETED') {
            await this.capturePayPalOrder(orderId, paymentSession.userId);
          }
        }
      }

      return { success: true };
    } catch (error) {
      this.logger.error('Error handling PayPal webhook:', error);
      throw error;
    }
  }

  async capturePayPalOrder(orderId: string, userId: string) {
    try {
      // Find payment session
      const paymentSession = await this.prisma.paymentSession.findFirst({
        where: {
          paypalOrderId: orderId,
          userId,
        },
        include: {
          course: true,
        },
      });

      if (!paymentSession) {
        throw new NotFoundException('Payment session not found');
      }

      if (paymentSession.status === 'COMPLETED') {
        return {
          success: true,
          session: paymentSession,
          message: 'Payment already completed',
        };
      }

      // Capture PayPal order
      const captureResult = await this.paypalService.captureOrder(orderId);

      if (!captureResult) {
        throw new BadRequestException('Failed to capture PayPal order');
      }

      const capture =
        captureResult.purchase_units?.[0]?.payments?.captures?.[0];

      // Update payment session
      const updatedSession = await this.prisma.paymentSession.update({
        where: { id: paymentSession.id },
        data: {
          status: 'COMPLETED',
          paypalPaymentId: capture?.id,
          paymentIntentId: capture?.id, // Reuse paymentIntentId field for PayPal payment ID
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              price: true,
              currency: true,
              shortDescription: true,
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

      // Create enrollment
      const enrollmentResult = await this.createEnrollment(
        {
          courseId: paymentSession.courseId,
          type: EnrollmentType.PAID,
          source: EnrollmentSource.DIRECT,
          paymentSessionId: paymentSession.id,
        },
        userId,
      );

      this.logger.log(
        `PayPal order captured: ${orderId} for payment session: ${paymentSession.id}`,
      );

      return {
        success: true,
        session: updatedSession,
        enrollment: enrollmentResult.enrollment,
      };
    } catch (error) {
      this.logger.error('Error capturing PayPal order:', error);
      throw error;
    }
  }

  async getPaymentSessionByStripeId(stripeSessionId: string) {
    try {
      // First, try to find a PaymentSession (for course enrollments)
      const paymentSession = await this.prisma.paymentSession.findFirst({
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

      if (paymentSession) {
        return {
          type: 'course_enrollment',
          session: paymentSession,
          stripeSessionId: paymentSession.stripeSessionId,
          status: paymentSession.status,
          amount: paymentSession.amount,
          currency: paymentSession.currency,
          course: paymentSession.course,
          user: paymentSession.user,
          createdAt: paymentSession.createdAt,
          updatedAt: paymentSession.updatedAt,
        };
      }

      // If not found, try to find a BookingRequest (for live sessions)
      const bookingRequest = await this.prisma.bookingRequest.findFirst({
        where: {
          stripeSessionId,
        },
        include: {
          offering: {
            include: {
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          },
          student: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          timeSlot: {
            include: {
              availability: true,
            },
          },
          liveSession: {
            select: {
              id: true,
              title: true,
              status: true,
              scheduledStart: true,
              scheduledEnd: true,
              meetingLink: true,
            },
          },
        },
      });

      if (bookingRequest) {
        return {
          type: 'live_session_booking',
          session: bookingRequest,
          stripeSessionId: bookingRequest.stripeSessionId,
          status: bookingRequest.status,
          paymentStatus: bookingRequest.paymentStatus,
          amount: bookingRequest.finalPrice,
          currency: bookingRequest.currency,
          offering: bookingRequest.offering,
          student: bookingRequest.student,
          timeSlot: bookingRequest.timeSlot,
          liveSession: bookingRequest.liveSession,
          createdAt: bookingRequest.createdAt,
          updatedAt: bookingRequest.updatedAt,
        };
      }

      // If neither found, throw error
      throw new NotFoundException('Payment session not found');
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

  async getEnrollmentByUserAndCourse(userId: string, courseId: string) {
    try {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              shortDescription: true,
              price: true,
              currency: true,
              status: true,
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

      return enrollment;
    } catch (error) {
      this.logger.error(
        `Error getting enrollment for user ${userId} and course ${courseId}:`,
        error,
      );
      throw error;
    }
  }

  async handleWebhook(event: Stripe.Event) {
    try {
      switch (event.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutSessionCompleted(
            event.data.object as Stripe.Checkout.Session,
          );
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(
            event.data.object as Stripe.PaymentIntent,
          );
          break;
        default:
          this.logger.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handleCheckoutSessionCompleted(
    session: Stripe.Checkout.Session,
  ) {
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

  private async handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent,
  ) {
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

  private async handlePaymentIntentCanceled(
    paymentIntent: Stripe.PaymentIntent,
  ) {
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

      // Ensure payload is in the correct format (Buffer or string)
      let bodyToVerify = payload;
      if (Buffer.isBuffer(payload)) {
        bodyToVerify = payload.toString('utf8');
      }

      this.logger.debug('Verifying webhook signature...');
      this.logger.debug(`Signature: ${signature.substring(0, 20)}...`);
      this.logger.debug(`Payload type: ${typeof bodyToVerify}`);
      this.logger.debug(
        `Payload length: ${bodyToVerify?.length || 'undefined'}`,
      );

      return this.stripe.webhooks.constructEvent(
        bodyToVerify,
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
          OR: [{ validUntil: null }, { validUntil: { gt: new Date() } }],
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
      const isFreeCourse =
        course.enrollmentType === 'FREE' || course.price === 0;

      if (!isFreeCourse) {
        return {
          canEnroll: false,
          error:
            'This course is not free. Please use the payment enrollment process.',
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

      return {
        success: true,
        message: 'Payment session canceled successfully',
      };
    } catch (error) {
      this.logger.error('Error canceling payment session:', error);
      throw error;
    }
  }

  // Session Booking Payment Methods
  async createSessionBookingPayment(
    bookingRequestId: string,
    offeringId: string,
    studentId: string,
    instructorId: string,
    amount: number,
    currency: string,
    returnUrl: string,
    cancelUrl: string,
  ) {
    try {
      // Get offering details
      const offering = await this.prisma.sessionOffering.findUnique({
        where: { id: offeringId },
        include: {
          instructor: true,
        },
      });

      if (!offering) {
        throw new NotFoundException('Session offering not found');
      }

      if (!offering.isActive) {
        throw new BadRequestException('Session offering is not active');
      }

      // Get student details
      const student = await this.prisma.user.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        throw new NotFoundException('Student not found');
      }

      // Check if instructor has Stripe Connect account
      if (!(offering.instructor as any).stripeAccountId) {
        throw new BadRequestException(
          'Instructor has not set up payment processing',
        );
      }

      // Verify instructor's Stripe account capabilities
      try {
        const instructorAccount = await this.stripe.accounts.retrieve(
          (offering.instructor as any).stripeAccountId,
        );

        if (
          !instructorAccount.charges_enabled ||
          !instructorAccount.payouts_enabled
        ) {
          throw new BadRequestException(
            'Instructor account is not ready for payments. Please complete the onboarding process first.',
          );
        }
      } catch (error) {
        if (error.message.includes('not ready for payments')) {
          throw error;
        }
        throw new BadRequestException(
          'Unable to verify instructor payment setup. Please try again.',
        );
      }

      // Convert to cents for Stripe
      const amountInCents = Math.round(amount * 100);
      const platformFeeInCents = Math.round(amount * 0.2 * 100); // 20% platform fee

      // Create Stripe Checkout Session with PaymentIntent
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        payment_intent_data: {
          capture_method: 'manual',
          application_fee_amount: platformFeeInCents,
          transfer_data: {
            destination: (offering.instructor as any).stripeAccountId,
          },
          metadata: {
            bookingRequestId,
            offeringId,
            studentId,
            instructorId,
            sessionType: 'LIVE_SESSION',
          },
          description: `Live session booking: ${offering.title}`,
          receipt_email: student.email,
        },
        success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&booking_id=${bookingRequestId}`,
        cancel_url: cancelUrl,
        customer_email: student.email,
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: offering.title,
                description: offering.description,
                images: offering.instructor.profileImage
                  ? [offering.instructor.profileImage]
                  : [],
              },
              unit_amount: amountInCents,
            },
            quantity: 1,
          },
        ],
        metadata: {
          bookingRequestId,
          offeringId,
          studentId,
          instructorId,
        },
      });

      return {
        success: true,
        paymentIntent: {
          id: null, // Will be created by checkout session
          clientSecret: null,
          amount: amountInCents,
          currency: currency.toLowerCase(),
          status: 'requires_payment_method', // Will change when payment is completed
        },
        checkoutSession: {
          id: session.id,
          url: session.url,
        },
      };
    } catch (error) {
      this.logger.error('Error creating session booking payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async captureSessionPayment(paymentIntentId: string) {
    try {
      // First, retrieve the payment intent to check its status
      const paymentIntent =
        await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'requires_capture') {
        throw new BadRequestException(
          `PaymentIntent cannot be captured. Current status: ${paymentIntent.status}. Expected status: requires_capture`,
        );
      }

      const capturedPayment =
        await this.stripe.paymentIntents.capture(paymentIntentId);
      return {
        success: true,
        paymentIntent: capturedPayment,
      };
    } catch (error) {
      this.logger.error('Error capturing session payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentIntentFromCheckoutSession(checkoutSessionId: string) {
    try {
      const session =
        await this.stripe.checkout.sessions.retrieve(checkoutSessionId);

      if (!session.payment_intent) {
        throw new BadRequestException(
          'No PaymentIntent found for this checkout session',
        );
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        session.payment_intent as string,
      );

      return {
        success: true,
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          client_secret: paymentIntent.client_secret,
        },
      };
    } catch (error) {
      this.logger.error(
        'Error retrieving PaymentIntent from checkout session:',
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async verifyAndUpdatePaymentSessionStatus(
    stripeSessionId: string,
    userId: string,
  ) {
    try {
      // Find the payment session
      const paymentSession = await this.prisma.paymentSession.findFirst({
        where: {
          stripeSessionId,
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

      if (!paymentSession) {
        throw new NotFoundException('Payment session not found');
      }

      // If already completed, return it
      if (paymentSession.status === 'COMPLETED') {
        return {
          success: true,
          session: paymentSession,
          updated: false,
        };
      }

      // Verify with Stripe
      const stripeSession =
        await this.stripe.checkout.sessions.retrieve(stripeSessionId);

      // Check if payment is completed
      if (stripeSession.payment_status === 'paid') {
        // Update payment session status
        const updatedSession = await this.prisma.paymentSession.update({
          where: { id: paymentSession.id },
          data: {
            status: 'COMPLETED',
            paymentIntentId:
              (stripeSession.payment_intent as string) ||
              paymentSession.paymentIntentId,
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

        this.logger.log(
          `Payment session ${paymentSession.id} status updated to COMPLETED`,
        );

        return {
          success: true,
          session: updatedSession,
          updated: true,
        };
      }

      // Payment not completed yet
      return {
        success: false,
        session: paymentSession,
        error: `Payment status is ${stripeSession.payment_status}, not paid`,
      };
    } catch (error) {
      this.logger.error('Error verifying payment session status:', error);
      throw error;
    }
  }

  async refundSessionPayment(
    paymentIntentId: string,
    reason: string = 'requested_by_customer',
  ) {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: reason as any,
      });
      return {
        success: true,
        refund,
      };
    } catch (error) {
      this.logger.error('Error refunding session payment:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // =============================================================================
  // STRIPE CONNECT ACCOUNT MANAGEMENT
  // =============================================================================

  async createStripeConnectAccount(
    instructorId: string,
    accountData: CreateStripeConnectAccountDto, // Type it properly
  ) {
    try {
      // Check if instructor already has a Stripe account
      const existingInstructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!existingInstructor) {
        throw new NotFoundException('Instructor not found');
      }

      // If instructor already has a Stripe account ID, verify it exists in Stripe
      if ((existingInstructor as any).stripeAccountId) {
        try {
          // Try to retrieve the account from Stripe
          const existingAccount = await this.stripe.accounts.retrieve(
            (existingInstructor as any).stripeAccountId,
          );

          this.logger.log(
            `Instructor already has Stripe account: ${existingAccount.id}`,
          );

          // Account exists in Stripe, create a new onboarding link
          const frontendUrl =
            this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
          const baseUrl = frontendUrl.startsWith('http')
            ? frontendUrl
            : `http://${frontendUrl}`;

          const accountLink = await this.stripe.accountLinks.create({
            account: existingAccount.id,
            refresh_url: `${baseUrl}/instructor/connect/refresh`,
            return_url: `${baseUrl}/instructor/connect/return`,
            type: 'account_onboarding',
          });

          return {
            success: true,
            accountId: existingAccount.id,
            accountLink: accountLink.url,
            account: {
              id: existingAccount.id,
              object: existingAccount.object,
              business_type: existingAccount.business_type,
              country: existingAccount.country,
              email: existingAccount.email,
              requirements: existingAccount.requirements,
              charges_enabled: existingAccount.charges_enabled,
              payouts_enabled: existingAccount.payouts_enabled,
              details_submitted: existingAccount.details_submitted,
            },
            message:
              'Account already exists. New onboarding link created for completion.',
          };
        } catch (stripeError: any) {
          // Log the specific error for debugging
          this.logger.warn(
            `Error retrieving Stripe account ${(existingInstructor as any).stripeAccountId}: ${stripeError.message}`,
          );
          this.logger.warn(`Stripe error code: ${stripeError.code}`);
          this.logger.warn(`Stripe error type: ${stripeError.type}`);

          // Handle different error scenarios
          const shouldClearAccount =
            stripeError.code === 'account_invalid' || // Account doesn't exist
            stripeError.code === 'resource_missing' || // Account not found
            stripeError.type === 'StripePermissionError' || // No access to account
            stripeError.message?.includes('does not have access') || // API key mismatch
            stripeError.message?.includes('does not exist'); // Account deleted

          if (shouldClearAccount) {
            this.logger.warn(
              `Clearing invalid Stripe account ID ${(existingInstructor as any).stripeAccountId} from database. Reason: ${stripeError.message}`,
            );

            // Clear the invalid account ID from database
            await this.prisma.user.update({
              where: { id: instructorId },
              data: { stripeAccountId: null },
            });

            this.logger.log(
              'Invalid Stripe account ID cleared. Will create a new account.',
            );
            // Continue to create new account below
          } else {
            // For other errors, throw them up
            throw stripeError;
          }
        }
      }

      // Create new Stripe Connect account
      this.logger.log(
        `Creating new Stripe Connect account for instructor: ${instructorId}`,
      );
      this.logger.log(
        'Account data received:',
        JSON.stringify(accountData, null, 2),
      );

      // Convert DTO (camelCase) to Stripe format (snake_case)
      const stripeAccountParams: any = {
        type: 'express',
        country: accountData.country,
        email: accountData.email,
        business_type: accountData.businessType, // CHANGED: Convert camelCase to snake_case
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
      };

      // Only include individual or company based on businessType
      if (accountData.businessType === 'individual' && accountData.individual) {
        stripeAccountParams.individual = {
          first_name: accountData.individual.firstName, // CHANGED
          last_name: accountData.individual.lastName, // CHANGED
          email: accountData.individual.email,
        };

        // Add optional fields if present
        if (accountData.individual.phone) {
          stripeAccountParams.individual.phone = accountData.individual.phone;
        }

        if (accountData.individual.address) {
          stripeAccountParams.individual.address = {
            line1: accountData.individual.address.line1,
            city: accountData.individual.address.city,
            state: accountData.individual.address.state,
            postal_code: accountData.individual.address.postalCode, // CHANGED
            country: accountData.individual.address.country,
          };
        }

        if (accountData.individual.dob) {
          stripeAccountParams.individual.dob = {
            day: accountData.individual.dob.day,
            month: accountData.individual.dob.month,
            year: accountData.individual.dob.year,
          };
        }
      } else if (
        accountData.businessType === 'company' &&
        accountData.company
      ) {
        stripeAccountParams.company = {
          name: accountData.company.name,
        };

        // Add optional fields if present
        if (accountData.company.phone) {
          stripeAccountParams.company.phone = accountData.company.phone;
        }

        if (accountData.company.address) {
          stripeAccountParams.company.address = {
            line1: accountData.company.address.line1,
            city: accountData.company.address.city,
            state: accountData.company.address.state,
            postal_code: accountData.company.address.postalCode, // CHANGED
            country: accountData.company.address.country,
          };
        }
      }

      this.logger.log(
        'Stripe account params:',
        JSON.stringify(stripeAccountParams, null, 2),
      );

      const account = await this.stripe.accounts.create(stripeAccountParams);

      this.logger.log(`Stripe account created: ${account.id}`);

      // Update instructor with Stripe account ID
      await this.prisma.user.update({
        where: { id: instructorId },
        data: {
          stripeAccountId: account.id,
        },
      });

      this.logger.log(`Database updated with Stripe account ID: ${account.id}`);

      // Create account link for onboarding
      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

      // Ensure the URL has a protocol
      const baseUrl = frontendUrl.startsWith('http')
        ? frontendUrl
        : `http://${frontendUrl}`;

      const accountLink = await this.stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${baseUrl}/instructor/connect/refresh`,
        return_url: `${baseUrl}/instructor/connect/return`,
        type: 'account_onboarding',
      });

      this.logger.log(`Account link created: ${accountLink.url}`);

      return {
        success: true,
        accountId: account.id,
        accountLink: accountLink.url,
        account: {
          id: account.id,
          object: account.object,
          business_type: account.business_type,
          country: account.country,
          email: account.email,
          requirements: account.requirements,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        },
      };
    } catch (error) {
      this.logger.error('Error creating Stripe Connect account:', error);
      this.logger.error('Error details:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
      });
      return {
        success: false,
        error: error.message,
        errorCode: error.code,
        errorType: error.type,
      };
    }
  }

  async getStripeConnectAccount(instructorId: string) {
    try {
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }

      if (!(instructor as any).stripeAccountId) {
        throw new BadRequestException(
          'Instructor has not set up Stripe Connect account',
        );
      }

      const account = await this.stripe.accounts.retrieve(
        (instructor as any).stripeAccountId,
      );

      return {
        success: true,
        account: {
          id: account.id,
          object: account.object,
          business_type: account.business_type,
          country: account.country,
          email: account.email,
          requirements: account.requirements,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          details_submitted: account.details_submitted,
        },
      };
    } catch (error) {
      this.logger.error('Error retrieving Stripe Connect account:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async createStripeConnectAccountLink(instructorId: string) {
    try {
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }

      if (!(instructor as any).stripeAccountId) {
        throw new BadRequestException(
          'Instructor has not set up Stripe Connect account',
        );
      }

      const frontendUrl =
        this.configService.get('FRONTEND_URL') || 'http://localhost:3000';

      // Ensure the URL has a protocol
      const baseUrl = frontendUrl.startsWith('http')
        ? frontendUrl
        : `http://${frontendUrl}`;

      const accountLink = await this.stripe.accountLinks.create({
        account: (instructor as any).stripeAccountId,
        refresh_url: `${baseUrl}/instructor/connect/refresh`,
        return_url: `${baseUrl}/instructor/connect/return`,
        type: 'account_onboarding',
      });

      return {
        success: true,
        accountLink: accountLink.url,
      };
    } catch (error) {
      this.logger.error('Error creating Stripe Connect account link:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async updateStripeConnectAccountCapabilities(instructorId: string) {
    try {
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }

      if (!(instructor as any).stripeAccountId) {
        throw new BadRequestException(
          'Instructor has not set up Stripe Connect account',
        );
      }

      // Update account to request additional capabilities
      const updatedAccount = await this.stripe.accounts.update(
        (instructor as any).stripeAccountId,
        {
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
            legacy_payments: { requested: true },
          },
        },
      );

      return {
        success: true,
        account: {
          id: updatedAccount.id,
          charges_enabled: updatedAccount.charges_enabled,
          payouts_enabled: updatedAccount.payouts_enabled,
          requirements: updatedAccount.requirements,
        },
      };
    } catch (error) {
      this.logger.error(
        'Error updating Stripe Connect account capabilities:',
        error,
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async handleStripeConnectWebhook(event: any) {
    const { type, data } = event;

    switch (type) {
      case 'account.updated':
        await this.handleAccountUpdated(data.object);
        break;
      case 'account.application.authorized':
        await this.handleAccountAuthorized(data.object);
        break;
      case 'account.application.deauthorized':
        await this.handleAccountDeauthorized(data.object);
        break;
      default:
        this.logger.log(`Unhandled Stripe Connect event: ${type}`);
    }
  }

  private async handleAccountUpdated(account: any) {
    this.logger.log(`Stripe Connect account updated: ${account.id}`);
    // You can add additional logic here to update instructor status
  }

  private async handleAccountAuthorized(account: any) {
    this.logger.log(`Stripe Connect account authorized: ${account.id}`);
    // You can add additional logic here to enable instructor payments
  }

  private async handleAccountDeauthorized(account: any) {
    this.logger.log(`Stripe Connect account deauthorized: ${account.id}`);
    // You can add additional logic here to disable instructor payments
  }

  async resetStripeConnectAccount(instructorId: string) {
    try {
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor) {
        throw new NotFoundException('Instructor not found');
      }

      const oldAccountId = (instructor as any).stripeAccountId;

      if (!oldAccountId) {
        return {
          success: true,
          message: 'No Stripe account to reset',
        };
      }

      // Clear the Stripe account ID from database
      await this.prisma.user.update({
        where: { id: instructorId },
        data: { stripeAccountId: null },
      });

      this.logger.log(
        `Stripe account ID ${oldAccountId} cleared for instructor ${instructorId}`,
      );

      return {
        success: true,
        message:
          'Stripe Connect account reset successfully. You can now create a new account.',
        clearedAccountId: oldAccountId,
      };
    } catch (error) {
      this.logger.error('Error resetting Stripe Connect account:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // =============================================================================
  // INSTRUCTOR PAYOUT PROCESSING
  // =============================================================================

  async processInstructorPayout(instructorId: string, sessionIds: string[]) {
    try {
      // Get instructor's Stripe Connect account
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (!instructor || !(instructor as any).stripeAccountId) {
        throw new BadRequestException(
          'Instructor has not set up payment processing',
        );
      }

      // Get completed sessions that need payout
      const sessions = await this.prisma.liveSession.findMany({
        where: {
          id: { in: sessionIds },
          instructorId,
          status: 'COMPLETED',
          payoutStatus: 'PENDING',
        },
        include: {
          bookingRequest: true,
        },
      });

      if (sessions.length === 0) {
        throw new BadRequestException('No completed sessions found for payout');
      }

      // Calculate total payout amount
      let totalPayoutAmount = 0;
      const payoutSessions: Array<{
        sessionId: string;
        sessionAmount: number;
        platformFee: number;
        netAmount: number;
      }> = [];

      for (const session of sessions) {
        const instructorPayout =
          session.instructorPayout || (session.totalPrice || 0) * 0.8;
        totalPayoutAmount += instructorPayout;

        payoutSessions.push({
          sessionId: session.id,
          sessionAmount: session.totalPrice || 0,
          platformFee: session.platformFee,
          netAmount: instructorPayout,
        });
      }

      // Create Stripe transfer to instructor's Connect account
      const transfer = await this.stripe.transfers.create({
        amount: Math.round(totalPayoutAmount * 100), // Convert to cents
        currency: sessions[0].currency.toLowerCase(),
        destination: (instructor as any).stripeAccountId,
        description: `Payout for ${sessions.length} completed session(s)`,
        metadata: {
          instructorId,
          sessionCount: sessions.length.toString(),
          sessionIds: sessionIds.join(','),
        },
      });

      // Create payout record
      const payout = await this.prisma.instructorPayout.create({
        data: {
          instructorId,
          amount: totalPayoutAmount,
          platformFee: sessions.reduce(
            (sum, session) => sum + session.platformFee,
            0,
          ),
          netAmount: totalPayoutAmount,
          currency: sessions[0].currency,
          status: 'PROCESSING',
          payoutMethod: 'stripe_transfer',
          scheduledDate: new Date(),
          stripePayoutId: transfer.id,
        },
      });

      // Create payout session records
      for (const payoutSession of payoutSessions) {
        await this.prisma.payoutSession.create({
          data: {
            payoutId: payout.id,
            sessionId: payoutSession.sessionId,
            sessionAmount: payoutSession.sessionAmount,
            platformFee: payoutSession.platformFee,
            netAmount: payoutSession.netAmount,
          },
        });
      }

      // Update session payout status
      await this.prisma.liveSession.updateMany({
        where: {
          id: { in: sessionIds },
        },
        data: {
          payoutStatus: 'PROCESSING',
        },
      });

      return {
        success: true,
        payout: {
          id: payout.id,
          amount: payout.amount,
          currency: payout.currency,
          status: payout.status,
          stripeTransferId: transfer.id,
        },
        sessionsProcessed: sessions.length,
      };
    } catch (error) {
      this.logger.error('Error processing instructor payout:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
