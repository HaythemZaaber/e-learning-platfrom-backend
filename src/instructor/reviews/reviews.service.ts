import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async getInstructorReviews(instructorId: string, options: {
    page?: number;
    limit?: number;
    rating?: number;
  }) {
    const { page = 1, limit = 10, rating } = options;
    const skip = (page - 1) * limit;

    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId }
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const where: any = {
      session: {
        instructorId
      },
      isPublic: true,
    };

    if (rating) {
      where.overallRating = rating;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.sessionReview.findMany({
        where,
        skip,
        take: limit,
        include: {
          reviewer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            }
          },
          session: {
            select: {
              id: true,
              title: true,
              sessionType: true,
              scheduledStart: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.sessionReview.count({ where })
    ]);

    // Calculate review statistics
    const allReviews = await this.prisma.sessionReview.findMany({
      where: {
        session: {
          instructorId
        },
        isPublic: true,
      },
      select: {
        overallRating: true,
        contentQuality: true,
        instructorRating: true,
        technicalQuality: true,
        valueForMoney: true,
      }
    });

    const stats = {
      totalReviews: allReviews.length,
      averageOverallRating: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length
        : 0,
      averageContentQuality: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r.contentQuality || 0), 0) / allReviews.length
        : 0,
      averageInstructorRating: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r.instructorRating || 0), 0) / allReviews.length
        : 0,
      averageTechnicalQuality: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r.technicalQuality || 0), 0) / allReviews.length
        : 0,
      averageValueForMoney: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r.valueForMoney || 0), 0) / allReviews.length
        : 0,
      ratingDistribution: {
        1: allReviews.filter(r => r.overallRating === 1).length,
        2: allReviews.filter(r => r.overallRating === 2).length,
        3: allReviews.filter(r => r.overallRating === 3).length,
        4: allReviews.filter(r => r.overallRating === 4).length,
        5: allReviews.filter(r => r.overallRating === 5).length,
      }
    };

    return {
      reviews,
      stats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async getReviewStats(instructorId: string) {
    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId }
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const allReviews = await this.prisma.sessionReview.findMany({
      where: {
        session: {
          instructorId
        },
        isPublic: true,
      },
      select: {
        overallRating: true,
        contentQuality: true,
        instructorRating: true,
        technicalQuality: true,
        valueForMoney: true,
        createdAt: true,
      }
    });

    const stats = {
      totalReviews: allReviews.length,
      averageOverallRating: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length
        : 0,
      averageContentQuality: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r.contentQuality || 0), 0) / allReviews.length
        : 0,
      averageInstructorRating: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r.instructorRating || 0), 0) / allReviews.length
        : 0,
      averageTechnicalQuality: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r.technicalQuality || 0), 0) / allReviews.length
        : 0,
      averageValueForMoney: allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + (r.valueForMoney || 0), 0) / allReviews.length
        : 0,
      ratingDistribution: {
        1: allReviews.filter(r => r.overallRating === 1).length,
        2: allReviews.filter(r => r.overallRating === 2).length,
        3: allReviews.filter(r => r.overallRating === 3).length,
        4: allReviews.filter(r => r.overallRating === 4).length,
        5: allReviews.filter(r => r.overallRating === 5).length,
      },
      recentReviews: allReviews.length > 0
        ? allReviews
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5)
        : []
    };

    return stats;
  }
}
