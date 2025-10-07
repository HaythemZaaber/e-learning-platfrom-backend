import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  ParseFilePipeBuilder,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { GetUser } from '../auth/get-user.decorator';
import { StoriesReelsService } from './stories-reels.service';
import {
  CreateStoryReelDto,
  LikeStoryReelDto,
  GetStoriesReelsDto,
  StoryReelResponseDto,
  PaginatedResponseDto,
} from './dto/stories-reels.dto';
import { RestAuthGuard } from '../auth/rest-auth.guard';

@Controller('stories-reels')
@UseGuards(RestAuthGuard, RolesGuard)
export class StoriesReelsController {
  constructor(private readonly storiesReelsService: StoriesReelsService) {}

  // ============================================
  // STORIES ENDPOINTS
  // ============================================

  @Post('story')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async createStory(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^(image\/jpeg|image\/png|image\/gif|image\/webp|video\/mp4|video\/webm)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 50, // 50MB max for stories
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body() dto: CreateStoryReelDto,
    @GetUser() user: any,
  ): Promise<StoryReelResponseDto> {
    if (!file) {
      throw new BadRequestException('Media file is required');
    }

    const story = await this.storiesReelsService.createStory(user.id, {
      ...dto,
      file,
    });

    return {
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption || undefined,
      duration: story.duration || undefined,
      views: story.views,
      likesCount: story.likesCount,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      instructor: {
        id: story.instructor.id,
        firstName: story.instructor.firstName || undefined,
        lastName: story.instructor.lastName || undefined,
        username: story.instructor.username || undefined,
        profileImage: story.instructor.profileImage || undefined,
      },
    };
  }

  @Get('stories')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getStories(
    @Query('instructorId') instructorId?: string,
  ): Promise<StoryReelResponseDto[]> {
    const stories =
      await this.storiesReelsService.getActiveStories(instructorId);

    return stories.map((story) => ({
      id: story.id,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      caption: story.caption || undefined,
      duration: story.duration || undefined,
      views: story.views,
      likesCount: story._count?.likes || story.likesCount,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      instructor: {
        id: story.instructor.id,
        firstName: story.instructor.firstName || undefined,
        lastName: story.instructor.lastName || undefined,
        username: story.instructor.username || undefined,
        profileImage: story.instructor.profileImage || undefined,
      },
    }));
  }

  @Post('story/:storyId/like')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async likeStory(
    @Param('storyId') storyId: string,
    @GetUser() user: any,
  ): Promise<{ liked: boolean }> {
    return this.storiesReelsService.likeStory(storyId, user.id);
  }

  @Post('story/:storyId/view')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async viewStory(
    @Param('storyId') storyId: string,
    @GetUser() user: any,
  ): Promise<{ viewed: boolean }> {
    return this.storiesReelsService.trackStoryView(storyId, user.id);
  }

  @Delete('story/:storyId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStory(
    @Param('storyId') storyId: string,
    @GetUser() user: any,
  ): Promise<void> {
    await this.storiesReelsService.deleteStory(storyId, user.id);
  }

  // ============================================
  // REELS ENDPOINTS
  // ============================================

  @Post('reel')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async createReel(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^(image\/jpeg|image\/png|image\/gif|image\/webp|video\/mp4|video\/webm)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 200, // 200MB max for reels
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body() dto: CreateStoryReelDto,
    @GetUser() user: any,
  ): Promise<StoryReelResponseDto> {
    if (!file) {
      throw new BadRequestException('Media file is required');
    }

    const reel = await this.storiesReelsService.createReel(user.id, {
      ...dto,
      file,
    });

    return {
      id: reel.id,
      mediaUrl: reel.mediaUrl,
      mediaType: reel.mediaType,
      caption: reel.caption || undefined,
      duration: reel.duration,
      views: reel.views,
      likesCount: reel.likesCount,
      createdAt: reel.createdAt,
      instructor: {
        id: reel.instructor.id,
        firstName: reel.instructor.firstName || undefined,
        lastName: reel.instructor.lastName || undefined,
        username: reel.instructor.username || undefined,
        profileImage: reel.instructor.profileImage || undefined,
      },
    };
  }

  @Get('reels')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getReels(
    @Query() query: GetStoriesReelsDto,
  ): Promise<PaginatedResponseDto<StoryReelResponseDto>> {
    const result = await this.storiesReelsService.getReels(
      undefined, // Get all reels
      query.page,
      query.limit,
    );

    return {
      data: result.reels.map((reel) => ({
        id: reel.id,
        mediaUrl: reel.mediaUrl,
        mediaType: reel.mediaType,
        caption: reel.caption || undefined,
        duration: reel.duration,
        views: reel.views,
        likesCount: reel._count?.likes || reel.likesCount,
        createdAt: reel.createdAt,
        instructor: {
          id: reel.instructor.id,
          firstName: reel.instructor.firstName || undefined,
          lastName: reel.instructor.lastName || undefined,
          username: reel.instructor.username || undefined,
          profileImage: reel.instructor.profileImage || undefined,
        },
      })),
      total: result.total,
      page: query.page || 1,
      limit: query.limit || 20,
      hasMore: result.hasMore,
    };
  }

  @Get('instructor/:instructorId/reels')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getInstructorReels(
    @Param('instructorId') instructorId: string,
    @Query() query: GetStoriesReelsDto,
  ): Promise<PaginatedResponseDto<StoryReelResponseDto>> {
    const result = await this.storiesReelsService.getReels(
      instructorId,
      query.page,
      query.limit,
    );

    return {
      data: result.reels.map((reel) => ({
        id: reel.id,
        mediaUrl: reel.mediaUrl,
        mediaType: reel.mediaType,
        caption: reel.caption || undefined,
        duration: reel.duration,
        views: reel.views,
        likesCount: reel._count?.likes || reel.likesCount,
        createdAt: reel.createdAt,
        instructor: {
          id: reel.instructor.id,
          firstName: reel.instructor.firstName || undefined,
          lastName: reel.instructor.lastName || undefined,
          username: reel.instructor.username || undefined,
          profileImage: reel.instructor.profileImage || undefined,
        },
      })),
      total: result.total,
      page: query.page || 1,
      limit: query.limit || 20,
      hasMore: result.hasMore,
    };
  }

  @Post('reel/:reelId/like')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async likeReel(
    @Param('reelId') reelId: string,
    @GetUser() user: any,
  ): Promise<{ liked: boolean }> {
    return this.storiesReelsService.likeReel(reelId, user.id);
  }

  @Post('reel/:reelId/view')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.OK)
  async viewReel(
    @Param('reelId') reelId: string,
    @GetUser() user: any,
  ): Promise<{ viewed: boolean }> {
    return this.storiesReelsService.trackReelView(reelId, user.id);
  }

  @Delete('reel/:reelId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReel(
    @Param('reelId') reelId: string,
    @GetUser() user: any,
  ): Promise<void> {
    await this.storiesReelsService.deleteReel(reelId, user.id);
  }

  // ============================================
  // COMBINED ENDPOINTS
  // ============================================

  @Get('instructor/:instructorId/feed')
  @Roles(UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getInstructorFeed(
    @Param('instructorId') instructorId: string,
  ): Promise<{
    stories: StoryReelResponseDto[];
    reels: StoryReelResponseDto[];
  }> {
    const result =
      await this.storiesReelsService.getInstructorStoriesAndReels(instructorId);

    return {
      stories: result.stories.map((story) => ({
        id: story.id,
        mediaUrl: story.mediaUrl,
        mediaType: story.mediaType,
        caption: story.caption || undefined,
        duration: story.duration || undefined,
        views: story.views,
        likesCount: story.likesCount,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        instructor: {
          id: instructorId,
          firstName: undefined,
          lastName: undefined,
          username: undefined,
          profileImage: undefined,
        },
      })),
      reels: result.reels.map((reel) => ({
        id: reel.id,
        mediaUrl: reel.mediaUrl,
        mediaType: reel.mediaType,
        caption: reel.caption || undefined,
        duration: reel.duration,
        views: reel.views,
        likesCount: reel._count?.likes || reel.likesCount,
        createdAt: reel.createdAt,
        instructor: {
          id: instructorId,
          firstName: undefined,
          lastName: undefined,
          username: undefined,
          profileImage: undefined,
        },
      })),
    };
  }

  // ============================================
  // ADMIN ENDPOINTS
  // ============================================

  @Post('admin/cleanup-expired-stories')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cleanupExpiredStories(): Promise<{ deletedCount: number }> {
    return this.storiesReelsService.cleanupExpiredStories();
  }
}
