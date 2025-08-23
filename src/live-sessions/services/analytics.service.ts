import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getSessionStats(instructorId?: string, studentId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (studentId) {
      where.participants = {
        some: {
          userId: studentId
        }
      };
    }

    if (startDate && endDate) {
      where.scheduledStart = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      totalSessions,
      scheduledSessions,
      completedSessions,
      cancelledSessions,
      inProgressSessions,
      totalRevenue,
      averageRating
    ] = await Promise.all([
      this.prisma.liveSession.count({ where }),
      this.prisma.liveSession.count({ where: { ...where, status: 'SCHEDULED' } }),
      this.prisma.liveSession.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.liveSession.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.liveSession.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.liveSession.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { instructorPayout: true }
      }),
      this.prisma.sessionReview.aggregate({
        where: {
          session: where
        },
        _avg: { overallRating: true }
      })
    ]);

    return {
      totalSessions,
      scheduledSessions,
      completedSessions,
      cancelledSessions,
      inProgressSessions,
      totalRevenue: totalRevenue._sum.instructorPayout || 0,
      averageRating: averageRating._avg.overallRating || 0,
      completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
      cancellationRate: totalSessions > 0 ? (cancelledSessions / totalSessions) * 100 : 0
    };
  }

  async getInstructorAnalytics(instructorId: string, startDate?: Date, endDate?: Date) {
    const where = { instructorId };

    if (startDate && endDate) {
      where['scheduledStart'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      sessionStats,
      bookingStats,
      revenueStats,
      ratingStats,
      topicStats,
      timeSlotStats
    ] = await Promise.all([
      this.getSessionStats(instructorId, undefined, startDate, endDate),
      this.getBookingRequestStats(instructorId, undefined, startDate, endDate),
      this.getRevenueAnalytics(instructorId, startDate, endDate),
      this.getRatingAnalytics(instructorId, startDate, endDate),
      this.getTopicAnalytics(instructorId, startDate, endDate),
      this.getTimeSlotAnalytics(instructorId, startDate, endDate)
    ]);

    return {
      sessionStats,
      bookingStats,
      revenueStats,
      ratingStats,
      topicStats,
      timeSlotStats
    };
  }

  async getStudentAnalytics(studentId: string, startDate?: Date, endDate?: Date) {
    const where = {
      participants: {
        some: {
          userId: studentId
        }
      }
    };

    if (startDate && endDate) {
      where['scheduledStart'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      sessionStats,
      bookingStats,
      spendingStats,
      ratingStats,
      topicStats
    ] = await Promise.all([
      this.getSessionStats(undefined, studentId, startDate, endDate),
      this.getBookingRequestStats(undefined, studentId, startDate, endDate),
      this.getSpendingAnalytics(studentId, startDate, endDate),
      this.getStudentRatingAnalytics(studentId, startDate, endDate),
      this.getStudentTopicAnalytics(studentId, startDate, endDate)
    ]);

    return {
      sessionStats,
      bookingStats,
      spendingStats,
      ratingStats,
      topicStats
    };
  }

  async getBookingRequestStats(instructorId?: string, studentId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (instructorId) {
      where.offering = {
        instructorId
      };
    }

    if (studentId) {
      where.studentId = studentId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      cancelledRequests,
      completedRequests
    ] = await Promise.all([
      this.prisma.bookingRequest.count({ where }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'PENDING' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'ACCEPTED' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'REJECTED' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.bookingRequest.count({ where: { ...where, status: 'COMPLETED' } })
    ]);

    return {
      totalRequests,
      pendingRequests,
      acceptedRequests,
      rejectedRequests,
      cancelledRequests,
      completedRequests,
      acceptanceRate: totalRequests > 0 ? (acceptedRequests / totalRequests) * 100 : 0,
      rejectionRate: totalRequests > 0 ? (rejectedRequests / totalRequests) * 100 : 0,
      completionRate: acceptedRequests > 0 ? (completedRequests / acceptedRequests) * 100 : 0
    };
  }

  async getRevenueAnalytics(instructorId: string, startDate?: Date, endDate?: Date) {
    const where = { instructorId };

    if (startDate && endDate) {
      where['scheduledStart'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      totalRevenue,
      platformFees,
      netRevenue,
      averageSessionRevenue,
      revenueByMonth,
      revenueBySessionType
    ] = await Promise.all([
      this.prisma.liveSession.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { totalRevenue: true }
      }),
      this.prisma.liveSession.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { platformFee: true }
      }),
      this.prisma.liveSession.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _sum: { instructorPayout: true }
      }),
      this.prisma.liveSession.aggregate({
        where: { ...where, status: 'COMPLETED' },
        _avg: { instructorPayout: true }
      }),
      this.getRevenueByMonth(instructorId, startDate, endDate),
      this.getRevenueBySessionType(instructorId, startDate, endDate)
    ]);

    return {
      totalRevenue: totalRevenue._sum.totalRevenue || 0,
      platformFees: platformFees._sum.platformFee || 0,
      netRevenue: netRevenue._sum.instructorPayout || 0,
      averageSessionRevenue: averageSessionRevenue._avg.instructorPayout || 0,
      revenueByMonth,
      revenueBySessionType
    };
  }

  async getRatingAnalytics(instructorId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      session: {
        instructorId
      }
    };

    if (startDate && endDate) {
      where.session = {
        ...where.session,
        scheduledStart: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    const [
      totalReviews,
      averageRating,
      ratingDistribution,
      recentReviews
    ] = await Promise.all([
      this.prisma.sessionReview.count({ where }),
      this.prisma.sessionReview.aggregate({
        where,
        _avg: { overallRating: true }
      }),
      this.getRatingDistribution(instructorId, startDate, endDate),
      this.getRecentReviews(instructorId, 10)
    ]);

    return {
      totalReviews,
      averageRating: averageRating._avg.overallRating || 0,
      ratingDistribution,
      recentReviews
    };
  }

  async getTopicAnalytics(instructorId: string, startDate?: Date, endDate?: Date) {
    const where = { instructorId };

    if (startDate && endDate) {
      where['scheduledStart'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const sessions = await this.prisma.liveSession.findMany({
      where,
      select: {
        finalTopic: true,
        status: true,
        instructorPayout: true,
        participants: {
          select: {
            userId: true
          }
        }
      }
    });

    const topicStats = sessions.reduce((acc, session) => {
      const topic = session.finalTopic || 'Unknown';
      if (!acc[topic]) {
        acc[topic] = {
          totalSessions: 0,
          completedSessions: 0,
          totalRevenue: 0,
          totalParticipants: 0,
          averageRating: 0
        };
      }

      acc[topic].totalSessions++;
      if (session.status === 'COMPLETED') {
        acc[topic].completedSessions++;
        acc[topic].totalRevenue += session.instructorPayout || 0;
      }
      acc[topic].totalParticipants += session.participants.length;

      return acc;
    }, {});

    // Calculate completion rates
    Object.keys(topicStats).forEach(topic => {
      const stats = topicStats[topic];
      stats.completionRate = stats.totalSessions > 0 ? (stats.completedSessions / stats.totalSessions) * 100 : 0;
      stats.averageRevenue = stats.completedSessions > 0 ? stats.totalRevenue / stats.completedSessions : 0;
      stats.averageParticipants = stats.totalSessions > 0 ? stats.totalParticipants / stats.totalSessions : 0;
    });

    return topicStats;
  }

  async getTimeSlotAnalytics(instructorId: string, startDate?: Date, endDate?: Date) {
    const where = {
      availability: {
        instructorId
      }
    };

    if (startDate && endDate) {
      where['date'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const timeSlots = await this.prisma.timeSlot.findMany({
      where,
      select: {
        startTime: true,
        isBooked: true,
        isAvailable: true,
        currentBookings: true,
        maxBookings: true
      }
    });

    const hourlyStats = {};
    const dayOfWeekStats = {};

    timeSlots.forEach(slot => {
      const hour = slot.startTime.getHours();
      const dayOfWeek = slot.startTime.getDay();

      // Initialize hourly stats
      if (!hourlyStats[hour]) {
        hourlyStats[hour] = {
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
          utilizationRate: 0
        };
      }

      // Initialize day of week stats
      if (!dayOfWeekStats[dayOfWeek]) {
        dayOfWeekStats[dayOfWeek] = {
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
          utilizationRate: 0
        };
      }

      // Update hourly stats
      hourlyStats[hour].totalSlots++;
      if (slot.isBooked) {
        hourlyStats[hour].bookedSlots++;
      } else if (slot.isAvailable) {
        hourlyStats[hour].availableSlots++;
      }

      // Update day of week stats
      dayOfWeekStats[dayOfWeek].totalSlots++;
      if (slot.isBooked) {
        dayOfWeekStats[dayOfWeek].bookedSlots++;
      } else if (slot.isAvailable) {
        dayOfWeekStats[dayOfWeek].availableSlots++;
      }
    });

    // Calculate utilization rates
    Object.keys(hourlyStats).forEach(hour => {
      const stats = hourlyStats[hour];
      stats.utilizationRate = stats.totalSlots > 0 ? (stats.bookedSlots / stats.totalSlots) * 100 : 0;
    });

    Object.keys(dayOfWeekStats).forEach(day => {
      const stats = dayOfWeekStats[day];
      stats.utilizationRate = stats.totalSlots > 0 ? (stats.bookedSlots / stats.totalSlots) * 100 : 0;
    });

    return {
      hourlyStats,
      dayOfWeekStats
    };
  }

  async getSpendingAnalytics(studentId: string, startDate?: Date, endDate?: Date) {
    const where = {
      payerId: studentId
    };

    if (startDate && endDate) {
      where['createdAt'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      totalSpent,
      totalSessions,
      averageSpending,
      spendingByMonth
    ] = await Promise.all([
      this.prisma.sessionPayment.aggregate({
        where: { ...where, amount: { gt: 0 } },
        _sum: { amount: true }
      }),
      this.prisma.sessionPayment.count({ where: { ...where, amount: { gt: 0 } } }),
      this.prisma.sessionPayment.aggregate({
        where: { ...where, amount: { gt: 0 } },
        _avg: { amount: true }
      }),
      this.getSpendingByMonth(studentId, startDate, endDate)
    ]);

    return {
      totalSpent: totalSpent._sum.amount || 0,
      totalSessions,
      averageSpending: averageSpending._avg.amount || 0,
      spendingByMonth
    };
  }

  async getStudentRatingAnalytics(studentId: string, startDate?: Date, endDate?: Date) {
    const where = {
      reviewerId: studentId
    };

    if (startDate && endDate) {
      where['createdAt'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const [
      totalReviews,
      averageRating,
      ratingDistribution
    ] = await Promise.all([
      this.prisma.sessionReview.count({ where }),
      this.prisma.sessionReview.aggregate({
        where,
        _avg: { overallRating: true }
      }),
      this.getStudentRatingDistribution(studentId, startDate, endDate)
    ]);

    return {
      totalReviews,
      averageRating: averageRating._avg.overallRating || 0,
      ratingDistribution
    };
  }

  async getStudentTopicAnalytics(studentId: string, startDate?: Date, endDate?: Date) {
    const where = {
      participants: {
        some: {
          userId: studentId
        }
      }
    };

    if (startDate && endDate) {
      where['scheduledStart'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const sessions = await this.prisma.liveSession.findMany({
      where,
      select: {
        finalTopic: true,
        status: true,
        participants: {
          where: {
            userId: studentId
          }
        }
      }
    });

    const topicStats = sessions.reduce((acc, session) => {
      const topic = session.finalTopic || 'Unknown';
      if (!acc[topic]) {
        acc[topic] = {
          totalSessions: 0,
          completedSessions: 0,
          totalHours: 0
        };
      }

      acc[topic].totalSessions++;
      if (session.status === 'COMPLETED') {
        acc[topic].completedSessions++;
        // Calculate hours (assuming duration is in minutes)
        acc[topic].totalHours += 1; // Placeholder - would need actual duration
      }

      return acc;
    }, {});

    return topicStats;
  }

  private async getRevenueByMonth(instructorId: string, startDate?: Date, endDate?: Date) {
    // This would require a more complex query with date grouping
    // For now, returning placeholder data
    return [
      { month: '2024-01', revenue: 1500 },
      { month: '2024-02', revenue: 1800 },
      { month: '2024-03', revenue: 2200 }
    ];
  }

  private async getRevenueBySessionType(instructorId: string, startDate?: Date, endDate?: Date) {
    const where = { instructorId };

    if (startDate && endDate) {
      where['scheduledStart'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const sessions = await this.prisma.liveSession.findMany({
      where: { ...where, status: 'COMPLETED' },
      select: {
        sessionType: true,
        instructorPayout: true
      }
    });

    return sessions.reduce((acc, session) => {
      const type = session.sessionType;
      if (!acc[type]) {
        acc[type] = { revenue: 0, sessions: 0 };
      }
      acc[type].revenue += session.instructorPayout || 0;
      acc[type].sessions++;
      return acc;
    }, {});
  }

  private async getRatingDistribution(instructorId: string, startDate?: Date, endDate?: Date) {
    const where: any = {
      session: {
        instructorId
      }
    };

    if (startDate && endDate) {
      where.session = {
        ...where.session,
        scheduledStart: {
          gte: startDate,
          lte: endDate
        }
      };
    }

    const reviews = await this.prisma.sessionReview.findMany({
      where,
      select: { overallRating: true }
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[review.overallRating]++;
    });

    return distribution;
  }

  private async getRecentReviews(instructorId: string, limit: number) {
    return this.prisma.sessionReview.findMany({
      where: {
        session: {
          instructorId
        }
      },
      include: {
        session: {
          select: {
            id: true,
            title: true,
            scheduledStart: true
          }
        },
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  private async getSpendingByMonth(studentId: string, startDate?: Date, endDate?: Date) {
    // Placeholder implementation
    return [
      { month: '2024-01', spending: 300 },
      { month: '2024-02', spending: 450 },
      { month: '2024-03', spending: 600 }
    ];
  }

  private async getStudentRatingDistribution(studentId: string, startDate?: Date, endDate?: Date) {
    const where = {
      reviewerId: studentId
    };

    if (startDate && endDate) {
      where['createdAt'] = {
        gte: startDate,
        lte: endDate
      };
    }

    const reviews = await this.prisma.sessionReview.findMany({
      where,
      select: { overallRating: true }
    });

    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(review => {
      distribution[review.overallRating]++;
    });

    return distribution;
  }
}
