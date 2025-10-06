import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notifications/notification.service';

@Injectable()
export class InstructorFollowService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Follow an instructor
   */
  async followInstructor(studentId: string, instructorId: string) {
    // Check if instructor exists and is actually an instructor
    const instructor = await this.prisma.user.findFirst({
      where: {
        id: instructorId,
        role: 'INSTRUCTOR',
        isActive: true,
      },
    });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    // Check if student exists
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        isActive: true,
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Check if already following
    const existingFollow = await this.prisma.instructorFollow.findUnique({
      where: {
        instructorId_studentId: {
          instructorId,
          studentId,
        },
      },
    });

    if (existingFollow) {
      if (existingFollow.isActive) {
        throw new BadRequestException('Already following this instructor');
      } else {
        // Reactivate the follow
        const reactivatedFollow = await this.prisma.instructorFollow.update({
          where: {
            instructorId_studentId: {
              instructorId,
              studentId,
            },
          },
          data: {
            isActive: true,
            updatedAt: new Date(),
          },
        });

        // Send notification to instructor
        await this.notificationService.createNotification({
          userId: instructorId,
          type: 'NEW_FOLLOWER',
          title: 'New Follower',
          message: `${student.firstName || student.username || 'A student'} started following you`,
          data: {
            studentId,
            studentName: student.firstName || student.username,
            followId: reactivatedFollow.id,
          },
        });

        return reactivatedFollow;
      }
    }

    // Create new follow
    const follow = await this.prisma.instructorFollow.create({
      data: {
        instructorId,
        studentId,
        isActive: true,
      },
    });

    // Send notification to instructor
    await this.notificationService.createNotification({
      userId: instructorId,
      type: 'NEW_FOLLOWER',
      title: 'New Follower',
      message: `${student.firstName || student.username || 'A student'} started following you`,
      data: {
        studentId,
        studentName: student.firstName || student.username,
        followId: follow.id,
      },
    });

    return follow;
  }

  /**
   * Unfollow an instructor
   */
  async unfollowInstructor(studentId: string, instructorId: string) {
    const follow = await this.prisma.instructorFollow.findUnique({
      where: {
        instructorId_studentId: {
          instructorId,
          studentId,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    if (!follow.isActive) {
      throw new BadRequestException('Not following this instructor');
    }

    // Deactivate the follow instead of deleting
    const unfollowed = await this.prisma.instructorFollow.update({
      where: {
        instructorId_studentId: {
          instructorId,
          studentId,
        },
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Get student info for notification
    const student = await this.prisma.user.findUnique({
      where: { id: studentId },
    });

    // Send notification to instructor
    await this.notificationService.createNotification({
      userId: instructorId,
      type: 'UNFOLLOWED',
      title: 'Follower Removed',
      message: `${student?.firstName || student?.username || 'A student'} stopped following you`,
      data: {
        studentId,
        studentName: student?.firstName || student?.username,
        followId: unfollowed.id,
      },
    });

    return unfollowed;
  }

  /**
   * Get followers of an instructor
   */
  async getInstructorFollowers(instructorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.instructorFollow.findMany({
        where: {
          instructorId,
          isActive: true,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              profileImage: true,
              bio: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.instructorFollow.count({
        where: {
          instructorId,
          isActive: true,
        },
      }),
    ]);

    return {
      followers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get instructors that a student is following
   */
  async getStudentFollowing(studentId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.instructorFollow.findMany({
        where: {
          studentId,
          isActive: true,
        },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              profileImage: true,
              bio: true,
              instructorBio: true,
              expertise: true,
              teachingRating: true,
              totalStudents: true,
              totalCourses: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.instructorFollow.count({
        where: {
          studentId,
          isActive: true,
        },
      }),
    ]);

    return {
      following,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if student is following instructor
   */
  async isFollowing(studentId: string, instructorId: string): Promise<boolean> {
    const follow = await this.prisma.instructorFollow.findUnique({
      where: {
        instructorId_studentId: {
          instructorId,
          studentId,
        },
      },
    });

    return follow?.isActive || false;
  }

  /**
   * Get follow statistics for an instructor
   */
  async getInstructorFollowStats(instructorId: string) {
    const [totalFollowers, newFollowersThisWeek, newFollowersThisMonth] =
      await Promise.all([
        this.prisma.instructorFollow.count({
          where: {
            instructorId,
            isActive: true,
          },
        }),
        this.prisma.instructorFollow.count({
          where: {
            instructorId,
            isActive: true,
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            },
          },
        }),
        this.prisma.instructorFollow.count({
          where: {
            instructorId,
            isActive: true,
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
            },
          },
        }),
      ]);

    return {
      totalFollowers,
      newFollowersThisWeek,
      newFollowersThisMonth,
    };
  }
}
