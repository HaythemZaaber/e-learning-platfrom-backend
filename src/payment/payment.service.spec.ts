import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PaymentService } from './payment.service';
import { PrismaService } from '../prisma/prisma.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaService: PrismaService;
  let configService: ConfigService;

  const mockPrismaService = {
    course: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
    },
    paymentSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    coupon: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      update: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<PaymentService>(PaymentService);
    prismaService = module.get<PrismaService>(PrismaService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateCoupon', () => {
    it('should return invalid for non-existent coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue(null);

      const result = await service.validateCoupon({
        code: 'INVALID',
        courseId: 'course_123',
        amount: 1000,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Invalid coupon code');
    });

    it('should return invalid for inactive coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coupon_123',
        code: 'TEST10',
        isActive: false,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        currentUses: 0,
        maxUses: 100,
        applicableCourses: [],
      });

      const result = await service.validateCoupon({
        code: 'TEST10',
        courseId: 'course_123',
        amount: 1000,
      });

      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Coupon is not active');
    });

    it('should return valid for active percentage coupon', async () => {
      mockPrismaService.coupon.findUnique.mockResolvedValue({
        id: 'coupon_123',
        code: 'TEST10',
        isActive: true,
        discountType: 'PERCENTAGE',
        discountValue: 10,
        currentUses: 0,
        maxUses: 100,
        applicableCourses: [],
        validFrom: null,
        validUntil: null,
        minimumAmount: null,
        maximumDiscount: null,
      });

      const result = await service.validateCoupon({
        code: 'TEST10',
        courseId: 'course_123',
        amount: 1000,
      });

      expect(result.isValid).toBe(true);
      expect(result.discountAmount).toBe(100); // 10% of 1000
      expect(result.finalAmount).toBe(900); // 1000 - 100
    });
  });

  describe('getActiveCoupons', () => {
    it('should return active coupons', async () => {
      const mockCoupons = [
        {
          id: 'coupon_1',
          code: 'WELCOME10',
          name: 'Welcome Discount',
          description: '10% off for new users',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          currency: 'USD',
          validFrom: null,
          validUntil: null,
          minimumAmount: null,
          maximumDiscount: null,
        },
      ];

      mockPrismaService.coupon.findMany.mockResolvedValue(mockCoupons);

      const result = await service.getActiveCoupons();

      expect(result).toEqual(mockCoupons);
      expect(mockPrismaService.coupon.findMany).toHaveBeenCalledWith({
        where: {
          isActive: true,
          OR: [
            { validUntil: null },
            { validUntil: { gt: expect.any(Date) } },
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
    });
  });

  describe('getUserEnrollments', () => {
    it('should return user enrollments', async () => {
      const mockEnrollments = [
        {
          id: 'enrollment_1',
          courseId: 'course_123',
          userId: 'user_123',
          status: 'ACTIVE',
          course: {
            id: 'course_123',
            title: 'Test Course',
            thumbnail: 'test.jpg',
            description: 'Test description',
            category: 'Programming',
            level: 'BEGINNER',
            instructor: {
              id: 'instructor_1',
              firstName: 'John',
              lastName: 'Doe',
              profileImage: 'profile.jpg',
            },
          },
        },
      ];

      mockPrismaService.enrollment.findMany.mockResolvedValue(mockEnrollments);

      const result = await service.getUserEnrollments('user_123');

      expect(result).toEqual(mockEnrollments);
      expect(mockPrismaService.enrollment.findMany).toHaveBeenCalledWith({
        where: { userId: 'user_123' },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              thumbnail: true,
              description: true,
              category: true,
              level: true,
              instructor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  profileImage: true,
                },
              },
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
      });
    });
  });
});
