import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateInstructorRatingDto,
  UpdateInstructorRatingDto,
  InstructorRatingResponseDto,
  InstructorRatingStatsDto,
  RatingEligibilityDto,
} from './dto/instructor-rating.dto';

@Injectable()
export class InstructorRatingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Check if a student is eligible to rate an instructor
   */
  async checkRatingEligibility(
    instructorId: string,
    studentId: string,
  ): Promise<RatingEligibilityDto> {
    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Check if student exists
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check for course enrollments
    const courseEnrollments = await this.prisma.enrollment.findMany({
      where: {
        userId: studentId,
        course: {
          instructorId: instructorId,
        },
        status: 'ACTIVE',
      },
      select: {
        courseId: true,
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    // Check for completed live sessions
    const completedSessions = await this.prisma.sessionReservation.findMany({
      where: {
        learnerId: studentId,
        session: {
          instructorId: instructorId,
          status: 'COMPLETED',
        },
        attendance: 'PRESENT',
      },
      select: {
        sessionId: true,
        session: {
          select: {
            title: true,
          },
        },
      },
    });

    const hasCourseEnrollments = courseEnrollments.length > 0;
    const hasCompletedSessions = completedSessions.length > 0;
    const isEligible = hasCourseEnrollments || hasCompletedSessions;

    let reason = '';
    if (isEligible) {
      const reasons: string[] = [];
      if (hasCourseEnrollments) {
        reasons.push(`enrolled in ${courseEnrollments.length} course(s)`);
      }
      if (hasCompletedSessions) {
        reasons.push(`completed ${completedSessions.length} live session(s)`);
      }
      reason = `You have ${reasons.join(' and ')} with this instructor.`;
    } else {
      reason =
        'You can only rate instructors after enrolling in their courses or completing live sessions with them.';
    }

    return {
      isEligible,
      reason,
      courseEnrollments: courseEnrollments.map((e) => e.courseId),
      completedSessions: completedSessions.map((s) => s.sessionId),
    };
  }

  /**
   * Create a new instructor rating
   */
  async createInstructorRating(
    createDto: CreateInstructorRatingDto,
    studentId: string,
  ): Promise<InstructorRatingResponseDto> {
    // Check eligibility first
    const eligibility = await this.checkRatingEligibility(
      createDto.instructorId,
      studentId,
    );

    if (!eligibility.isEligible) {
      throw new ForbiddenException(eligibility.reason);
    }

    // Check if rating already exists
    const existingRating = await this.prisma.instructorRating.findUnique({
      where: {
        instructorId_studentId: {
          instructorId: createDto.instructorId,
          studentId: studentId,
        },
      },
    });

    if (existingRating) {
      throw new BadRequestException(
        'You have already rated this instructor. You can update your existing rating instead.',
      );
    }

    // Create the rating
    const rating = await this.prisma.instructorRating.create({
      data: {
        instructorId: createDto.instructorId,
        studentId: studentId,
        rating: createDto.rating,
        comment: createDto.comment,
        isPublic: createDto.isPublic !== false, // Default to true
        isVerified: true, // Auto-verify since we checked eligibility
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    // Update instructor's overall rating
    await this.updateInstructorOverallRating(createDto.instructorId);

    return {
      ...rating,
      comment: rating.comment || undefined,
      student: rating.student
        ? {
            ...rating.student,
            firstName: rating.student.firstName || '',
            lastName: rating.student.lastName || '',
            profileImage: rating.student.profileImage || undefined,
          }
        : undefined,
    };
  }

  /**
   * Update an existing instructor rating
   */
  async updateInstructorRating(
    ratingId: string,
    updateDto: UpdateInstructorRatingDto,
    studentId: string,
  ): Promise<InstructorRatingResponseDto> {
    // Check if rating exists and belongs to student
    const existingRating = await this.prisma.instructorRating.findUnique({
      where: { id: ratingId },
    });

    if (!existingRating) {
      throw new NotFoundException('Rating not found');
    }

    if (existingRating.studentId !== studentId) {
      throw new ForbiddenException('You can only update your own ratings.');
    }

    // Update the rating
    const updatedRating = await this.prisma.instructorRating.update({
      where: { id: ratingId },
      data: {
        ...(updateDto.rating !== undefined && { rating: updateDto.rating }),
        ...(updateDto.comment !== undefined && { comment: updateDto.comment }),
        ...(updateDto.isPublic !== undefined && {
          isPublic: updateDto.isPublic,
        }),
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    // Update instructor's overall rating
    await this.updateInstructorOverallRating(existingRating.instructorId);

    return {
      ...updatedRating,
      comment: updatedRating.comment || undefined,
      student: updatedRating.student
        ? {
            ...updatedRating.student,
            firstName: updatedRating.student.firstName || '',
            lastName: updatedRating.student.lastName || '',
            profileImage: updatedRating.student.profileImage || undefined,
          }
        : undefined,
    };
  }

  /**
   * Delete an instructor rating
   */
  async deleteInstructorRating(
    ratingId: string,
    studentId: string,
  ): Promise<{ success: boolean; message: string }> {
    // Check if rating exists and belongs to student
    const existingRating = await this.prisma.instructorRating.findUnique({
      where: { id: ratingId },
    });

    if (!existingRating) {
      throw new NotFoundException('Rating not found');
    }

    if (existingRating.studentId !== studentId) {
      throw new ForbiddenException('You can only delete your own ratings.');
    }

    // Delete the rating
    await this.prisma.instructorRating.delete({
      where: { id: ratingId },
    });

    // Update instructor's overall rating
    await this.updateInstructorOverallRating(existingRating.instructorId);

    return {
      success: true,
      message: 'Rating deleted successfully',
    };
  }

  /**
   * Get instructor ratings with pagination
   */
  async getInstructorRatings(
    instructorId: string,
    options: {
      page?: number;
      limit?: number;
      minRating?: number;
      maxRating?: number;
      includePrivate?: boolean;
    } = {},
  ): Promise<{
    ratings: InstructorRatingResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      minRating,
      maxRating,
      includePrivate = false,
    } = options;
    const skip = (page - 1) * limit;

    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const where: any = {
      instructorId,
    };

    if (!includePrivate) {
      where.isPublic = true;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) where.rating.gte = minRating;
      if (maxRating !== undefined) where.rating.lte = maxRating;
    }

    const [ratings, total] = await Promise.all([
      this.prisma.instructorRating.findMany({
        where,
        skip,
        take: limit,
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.instructorRating.count({ where }),
    ]);

    return {
      ratings: ratings.map((rating) => ({
        ...rating,
        comment: rating.comment || undefined,
        student: rating.student
          ? {
              ...rating.student,
              firstName: rating.student.firstName || '',
              lastName: rating.student.lastName || '',
              profileImage: rating.student.profileImage || undefined,
            }
          : undefined,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get instructor rating statistics
   */
  async getInstructorRatingStats(
    instructorId: string,
  ): Promise<InstructorRatingStatsDto> {
    // Check if instructor exists
    const instructor = await this.prisma.user.findUnique({
      where: { id: instructorId },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    const ratings = await this.prisma.instructorRating.findMany({
      where: {
        instructorId,
        isPublic: true,
      },
      select: {
        rating: true,
      },
    });

    if (ratings.length === 0) {
      return {
        totalRatings: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      };
    }

    // Calculate averages
    const totalRatings = ratings.length;
    const averageRating =
      ratings.reduce((sum, r) => sum + r.rating, 0) / totalRatings;

    // Calculate rating distribution (round to nearest integer for distribution)
    const ratingDistribution = {
      1: ratings.filter((r) => Math.round(r.rating) === 1).length,
      2: ratings.filter((r) => Math.round(r.rating) === 2).length,
      3: ratings.filter((r) => Math.round(r.rating) === 3).length,
      4: ratings.filter((r) => Math.round(r.rating) === 4).length,
      5: ratings.filter((r) => Math.round(r.rating) === 5).length,
    };

    return {
      totalRatings,
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
    };
  }

  /**
   * Get a specific rating by ID
   */
  async getRatingById(
    ratingId: string,
    includePrivate = false,
  ): Promise<InstructorRatingResponseDto> {
    const where: any = { id: ratingId };
    if (!includePrivate) {
      where.isPublic = true;
    }

    const rating = await this.prisma.instructorRating.findUnique({
      where,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    return {
      ...rating,
      comment: rating.comment || undefined,
      student: rating.student
        ? {
            ...rating.student,
            firstName: rating.student.firstName || '',
            lastName: rating.student.lastName || '',
            profileImage: rating.student.profileImage || undefined,
          }
        : undefined,
    };
  }

  /**
   * Get a student's rating for a specific instructor
   */
  async getStudentRatingForInstructor(
    instructorId: string,
    studentId: string,
  ): Promise<InstructorRatingResponseDto | null> {
    const rating = await this.prisma.instructorRating.findUnique({
      where: {
        instructorId_studentId: {
          instructorId,
          studentId,
        },
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
          },
        },
      },
    });

    return rating
      ? {
          ...rating,
          comment: rating.comment || undefined,
          student: rating.student
            ? {
                ...rating.student,
                firstName: rating.student.firstName || '',
                lastName: rating.student.lastName || '',
                profileImage: rating.student.profileImage || undefined,
              }
            : undefined,
        }
      : null;
  }

  /**
   * Private helper to update instructor's overall rating
   */
  private async updateInstructorOverallRating(
    instructorId: string,
  ): Promise<void> {
    const stats = await this.getInstructorRatingStats(instructorId);

    await this.prisma.user.update({
      where: { id: instructorId },
      data: {
        teachingRating: stats.averageRating,
      },
    });
  }
}
