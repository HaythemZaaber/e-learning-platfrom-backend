import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { VideoProcessingService } from '../video-processing/video-processing.service';
import { UploadService } from '../upload/upload.service';
import { NotificationService } from '../notifications/notification.service';
import { MediaType, Story, Reel, Prisma } from '@prisma/client';

export interface CreateStoryReelDto {
  caption?: string;
  duration?: number;
  isPublic?: boolean;
  file: Express.Multer.File;
}

export type StoryWithInstructor = Prisma.StoryGetPayload<{
  include: {
    instructor: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        username: true;
        profileImage: true;
      };
    };
  };
}>;

export type ReelWithInstructor = Prisma.ReelGetPayload<{
  include: {
    instructor: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        username: true;
        profileImage: true;
      };
    };
  };
}>;

@Injectable()
export class StoriesReelsService {
  constructor(
    private prisma: PrismaService,
    private videoProcessingService: VideoProcessingService,
    private uploadService: UploadService,
    private notificationService: NotificationService,
  ) {}

  // ============================================
  // STORIES METHODS
  // ============================================

  async createStory(
    instructorId: string,
    dto: CreateStoryReelDto,
  ): Promise<StoryWithInstructor> {
    // Verify instructor exists and has proper role
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

    // Upload the file and get media URL
    const uploadResult = await this.uploadService.createDirectUpload(dto.file, {
      type: dto.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    });

    if (!uploadResult.success) {
      throw new BadRequestException('Failed to upload media');
    }

    const mediaUrl = uploadResult.fileInfo.file_url;
    const mediaType = dto.file.mimetype.startsWith('video/')
      ? MediaType.VIDEO
      : MediaType.IMAGE;

    // Get video duration - prefer duration from frontend, fallback to extraction
    let duration: number | undefined = dto.duration;

    if (mediaType === MediaType.VIDEO) {
      // If duration not provided by frontend, try to extract it
      if (duration === undefined) {
        try {
          duration =
            await this.videoProcessingService.getVideoDurationFromBuffer(
              dto.file.buffer,
            );
        } catch (error) {
          // Log error but don't fail the upload if ffmpeg is not available
          console.warn(`Video processing warning: ${error.message}`);
          duration = undefined;
        }
      }

      // Validate duration for stories (max 15 seconds) if duration is available
      if (duration !== undefined && duration > 0) {
        const validation = this.videoProcessingService.validateVideoDuration(
          duration,
          'STORY',
        );
        if (!validation.valid) {
          throw new BadRequestException(validation.message);
        }
      }
    }

    // Create story with 24-hour expiration
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await this.prisma.story.create({
      data: {
        instructorId,
        mediaUrl,
        mediaType,
        caption: dto.caption,
        duration,
        isPublic: dto.isPublic ?? true,
        expiresAt,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    // Notify followers about new story
    await this.notifyFollowersAboutNewStory(instructorId, story.id);

    return story;
  }

  async getActiveStories(instructorId?: string) {
    const whereClause: any = {
      isActive: true,
      expiresAt: {
        gt: new Date(), // Only active stories
      },
    };

    if (instructorId) {
      whereClause.instructorId = instructorId;
    }

    return this.prisma.story.findMany({
      where: whereClause,
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async likeStory(
    storyId: string,
    userId: string,
  ): Promise<{ liked: boolean }> {
    // Check if story exists and is still active
    const story = await this.prisma.story.findFirst({
      where: {
        id: storyId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found or expired');
    }

    // Check if user already liked this story
    const existingLike = await this.prisma.storyLike.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the story
      await this.prisma.storyLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Update likes count
      await this.prisma.story.update({
        where: { id: storyId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      return { liked: false };
    } else {
      // Like the story
      await this.prisma.storyLike.create({
        data: {
          storyId,
          userId,
        },
      });

      // Update likes count
      await this.prisma.story.update({
        where: { id: storyId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      return { liked: true };
    }
  }

  async deleteStory(storyId: string, instructorId: string): Promise<void> {
    const story = await this.prisma.story.findFirst({
      where: {
        id: storyId,
        instructorId,
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found or access denied');
    }

    // Delete the story (cascade will handle likes)
    await this.prisma.story.delete({
      where: { id: storyId },
    });

    // TODO: Delete the media file from storage
  }

  // ============================================
  // REELS METHODS
  // ============================================

  async createReel(
    instructorId: string,
    dto: CreateStoryReelDto,
  ): Promise<ReelWithInstructor> {
    // Verify instructor exists and has proper role
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

    // Upload the file and get media URL
    const uploadResult = await this.uploadService.createDirectUpload(dto.file, {
      type: dto.file.mimetype.startsWith('video/') ? 'VIDEO' : 'IMAGE',
    });

    if (!uploadResult.success) {
      throw new BadRequestException('Failed to upload media');
    }

    const mediaUrl = uploadResult.fileInfo.file_url;
    const mediaType = dto.file.mimetype.startsWith('video/')
      ? MediaType.VIDEO
      : MediaType.IMAGE;

    // Get video duration - prefer duration from frontend, fallback to extraction
    let duration: number = dto.duration ?? 0;

    if (mediaType === MediaType.VIDEO) {
      // If duration not provided by frontend, try to extract it
      if (duration === 0) {
        try {
          const videoDuration =
            await this.videoProcessingService.getVideoDurationFromBuffer(
              dto.file.buffer,
            );

          if (videoDuration !== undefined && videoDuration > 0) {
            duration = videoDuration;
          } else {
            console.warn(
              'Video duration could not be extracted. Using default value.',
            );
          }
        } catch (error) {
          // Log error but don't fail the upload if ffmpeg is not available
          console.warn(`Video processing warning: ${error.message}`);
        }
      }

      // Validate duration for reels (max 90 seconds) if duration is available
      if (duration > 0) {
        const validation = this.videoProcessingService.validateVideoDuration(
          duration,
          'REEL',
        );
        if (!validation.valid) {
          throw new BadRequestException(validation.message);
        }
      }
    } else {
      // For images, set duration to 0
      duration = 0;
    }

    // Create reel
    const reel = await this.prisma.reel.create({
      data: {
        instructorId,
        mediaUrl,
        mediaType,
        caption: dto.caption,
        duration,
        isPublic: dto.isPublic ?? true,
      },
      include: {
        instructor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            profileImage: true,
          },
        },
      },
    });

    // Notify followers about new reel
    await this.notifyFollowersAboutNewReel(instructorId, reel.id);

    return reel;
  }

  async getReels(instructorId?: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isActive: true,
    };

    if (instructorId) {
      whereClause.instructorId = instructorId;
    }

    const [reels, total] = await Promise.all([
      this.prisma.reel.findMany({
        where: whereClause,
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              profileImage: true,
            },
          },
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.reel.count({
        where: whereClause,
      }),
    ]);

    return {
      reels,
      total,
      hasMore: skip + limit < total,
    };
  }

  async likeReel(reelId: string, userId: string): Promise<{ liked: boolean }> {
    // Check if reel exists and is active
    const reel = await this.prisma.reel.findFirst({
      where: {
        id: reelId,
        isActive: true,
      },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    // Check if user already liked this reel
    const existingLike = await this.prisma.reelLike.findUnique({
      where: {
        reelId_userId: {
          reelId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike the reel
      await this.prisma.reelLike.delete({
        where: {
          id: existingLike.id,
        },
      });

      // Update likes count
      await this.prisma.reel.update({
        where: { id: reelId },
        data: {
          likesCount: {
            decrement: 1,
          },
        },
      });

      return { liked: false };
    } else {
      // Like the reel
      await this.prisma.reelLike.create({
        data: {
          reelId,
          userId,
        },
      });

      // Update likes count
      await this.prisma.reel.update({
        where: { id: reelId },
        data: {
          likesCount: {
            increment: 1,
          },
        },
      });

      return { liked: true };
    }
  }

  async deleteReel(reelId: string, instructorId: string): Promise<void> {
    const reel = await this.prisma.reel.findFirst({
      where: {
        id: reelId,
        instructorId,
      },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found or access denied');
    }

    // Delete the reel (cascade will handle likes)
    await this.prisma.reel.delete({
      where: { id: reelId },
    });

    // TODO: Delete the media file from storage
  }

  // ============================================
  // NOTIFICATION METHODS
  // ============================================

  private async notifyFollowersAboutNewStory(
    instructorId: string,
    storyId: string,
  ): Promise<void> {
    try {
      // Get all active followers
      const followers = await this.prisma.instructorFollow.findMany({
        where: {
          instructorId,
          isActive: true,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              username: true,
            },
          },
        },
      });

      // Get instructor info
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      });

      const instructorName =
        instructor?.firstName || instructor?.username || 'An instructor';

      // Create notifications for all followers
      const notifications = followers.map((follower) => ({
        userId: follower.studentId,
        type: 'NEW_STORY' as const,
        title: 'New Story',
        message: `${instructorName} posted a new story`,
        data: {
          instructorId,
          storyId,
          instructorName,
        },
      }));

      // Create notifications in batch
      for (const notificationData of notifications) {
        await this.notificationService.createNotification(notificationData);
      }

      console.log(
        `Sent ${notifications.length} story notifications to followers`,
      );
    } catch (error) {
      console.error('Failed to send story notifications:', error);
      // Don't throw error - story creation should still succeed
    }
  }

  private async notifyFollowersAboutNewReel(
    instructorId: string,
    reelId: string,
  ): Promise<void> {
    try {
      // Get all active followers
      const followers = await this.prisma.instructorFollow.findMany({
        where: {
          instructorId,
          isActive: true,
        },
        include: {
          student: {
            select: {
              id: true,
              firstName: true,
              username: true,
            },
          },
        },
      });

      // Get instructor info
      const instructor = await this.prisma.user.findUnique({
        where: { id: instructorId },
        select: {
          firstName: true,
          lastName: true,
          username: true,
        },
      });

      const instructorName =
        instructor?.firstName || instructor?.username || 'An instructor';

      // Create notifications for all followers
      const notifications = followers.map((follower) => ({
        userId: follower.studentId,
        type: 'NEW_REEL' as const,
        title: 'New Reel',
        message: `${instructorName} posted a new reel`,
        data: {
          instructorId,
          reelId,
          instructorName,
        },
      }));

      // Create notifications in batch
      for (const notificationData of notifications) {
        await this.notificationService.createNotification(notificationData);
      }

      console.log(
        `Sent ${notifications.length} reel notifications to followers`,
      );
    } catch (error) {
      console.error('Failed to send reel notifications:', error);
      // Don't throw error - reel creation should still succeed
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  async getInstructorStoriesAndReels(instructorId: string) {
    const [stories, reels] = await Promise.all([
      this.getActiveStories(instructorId),
      this.prisma.reel.findMany({
        where: {
          instructorId,
          isActive: true,
        },
        include: {
          _count: {
            select: {
              likes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10, // Limit to recent reels
      }),
    ]);

    return { stories, reels };
  }

  async cleanupExpiredStories(): Promise<{ deletedCount: number }> {
    const expiredStories = await this.prisma.story.findMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
        mediaUrl: true,
      },
    });

    // Delete expired stories
    const deleteResult = await this.prisma.story.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    // TODO: Delete media files from storage for expired stories

    return { deletedCount: deleteResult.count };
  }

  // ============================================
  // VIEW TRACKING METHODS
  // ============================================

  async trackStoryView(
    storyId: string,
    userId: string,
  ): Promise<{ viewed: boolean }> {
    // Check if story exists and is still active
    const story = await this.prisma.story.findFirst({
      where: {
        id: storyId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!story) {
      throw new NotFoundException('Story not found or expired');
    }

    // Check if user already viewed this story
    const existingView = await this.prisma.storyView.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existingView) {
      // Already viewed
      return { viewed: false };
    }

    // Record the view
    await this.prisma.storyView.create({
      data: {
        storyId,
        userId,
      },
    });

    // Update view count
    await this.prisma.story.update({
      where: { id: storyId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return { viewed: true };
  }

  async trackReelView(
    reelId: string,
    userId: string,
  ): Promise<{ viewed: boolean }> {
    // Check if reel exists and is active
    const reel = await this.prisma.reel.findFirst({
      where: {
        id: reelId,
        isActive: true,
      },
    });

    if (!reel) {
      throw new NotFoundException('Reel not found');
    }

    // Check if user already viewed this reel
    const existingView = await this.prisma.reelView.findUnique({
      where: {
        reelId_userId: {
          reelId,
          userId,
        },
      },
    });

    if (existingView) {
      // Already viewed
      return { viewed: false };
    }

    // Record the view
    await this.prisma.reelView.create({
      data: {
        reelId,
        userId,
      },
    });

    // Update view count
    await this.prisma.reel.update({
      where: { id: reelId },
      data: {
        views: {
          increment: 1,
        },
      },
    });

    return { viewed: true };
  }
}
