import {
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
  Param,
  ParseFilePipeBuilder,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, ContentType } from '../../generated/prisma';
import { UploadService } from './upload.service';
import { CourseService } from '../course/course.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('upload')
@UseGuards(AuthGuard, RolesGuard)
export class UploadController {
  constructor(
    private readonly uploadService: UploadService,
    private readonly courseService: CourseService,
  ) {}

  // ============================================
  // GENERAL FILE UPLOAD
  // ============================================

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp(
            /\.(jpg|jpeg|png|gif|bmp|webp|pdf|docx|xlsx|xlx|pptx|ppt|mp4|webm|mov|mp3|wav|csv|doc|txt|zip|rar)$/i,
          ),
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 500, // 500MB max
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('fileName') fileName?: string,
    @Body('folderPath') folderPath?: string,
  ) {
    return this.uploadService.createFile(file, fileName, folderPath);
  }

  // ============================================
  // COURSE-SPECIFIC UPLOADS
  // ============================================

  @Post('course/:courseId/thumbnail')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCourseThumbnail(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /\.(jpg|jpeg|png|gif|webp)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 10, // 10MB max for images
        })
        .build(),
    )
    file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    return this.courseService.uploadCourseThumbnail(courseId, user.id, file);
  }

  @Post('course/:courseId/trailer')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadCourseTrailer(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /\.(mp4|webm|mov)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 200, // 200MB max for videos
        })
        .build(),
    )
    file: Express.Multer.File,
    @GetUser() user: any,
  ) {
    return this.courseService.uploadCourseTrailer(courseId, user.id, file);
  }

  // ============================================
  // CONTENT UPLOADS
  // ============================================

  @Post('course/:courseId/content/video')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideoContent(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /\.(mp4|webm|mov)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 500, // 500MB max
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('lessonId') lessonId?: string,
    @Body('order') order?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.courseService.uploadContent(
      courseId,
      user.id,
      file,
      ContentType.VIDEO,
      {
        title,
        description,
        lessonId,
        order: order ? parseInt(order) : undefined,
      },
    );
  }

  @Post('course/:courseId/content/audio')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudioContent(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /\.(mp3|wav|ogg)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 100, // 100MB max
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('lessonId') lessonId?: string,
    @Body('order') order?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.courseService.uploadContent(
      courseId,
      user.id,
      file,
      ContentType.AUDIO,
      {
        title,
        description,
        lessonId,
        order: order ? parseInt(order) : undefined,
      },
    );
  }

  @Post('course/:courseId/content/document')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentContent(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /\.(pdf|docx|pptx|xlsx|txt)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 50, // 50MB max
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('lessonId') lessonId?: string,
    @Body('order') order?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.courseService.uploadContent(
      courseId,
      user.id,
      file,
      ContentType.DOCUMENT,
      {
        title,
        description,
        lessonId,
        order: order ? parseInt(order) : undefined,
      },
    );
  }

  @Post('course/:courseId/content/image')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImageContent(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /\.(jpg|jpeg|png|gif|webp|bmp)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 10, // 10MB max
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('lessonId') lessonId?: string,
    @Body('order') order?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.courseService.uploadContent(
      courseId,
      user.id,
      file,
      ContentType.IMAGE,
      {
        title,
        description,
        lessonId,
        order: order ? parseInt(order) : undefined,
      },
    );
  }

  @Post('course/:courseId/content/archive')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadArchiveContent(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /\.(zip|rar|7z|tar|gz)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 100, // 100MB max
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('lessonId') lessonId?: string,
    @Body('order') order?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.courseService.uploadContent(
      courseId,
      user.id,
      file,
      ContentType.ARCHIVE,
      {
        title,
        description,
        lessonId,
        order: order ? parseInt(order) : undefined,
      },
    );
  }

  // ============================================
  // BATCH UPLOAD FOR FRONTEND
  // ============================================

  @Post('course/:courseId/content/batch')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadContentBatch(
    @Param('courseId') courseId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp(
            /\.(jpg|jpeg|png|gif|bmp|webp|pdf|docx|xlsx|xlx|pptx|ppt|mp4|webm|mov|mp3|wav|csv|doc|txt|zip|rar)$/i,
          ),
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 500, // 500MB max
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('contentType') contentType: string,
    @Body('description') description?: string,
    @Body('lessonId') lessonId?: string,
    @Body('order') order?: string,
    @GetUser() user?: any,
  ) {
    if (!title || !contentType) {
      throw new BadRequestException('Title and contentType are required');
    }

    // Validate contentType enum
    if (!Object.values(ContentType).includes(contentType as ContentType)) {
      throw new BadRequestException('Invalid content type');
    }

    return this.courseService.uploadContent(
      courseId,
      user.id,
      file,
      contentType as ContentType,
      {
        title,
        description,
        lessonId,
        order: order ? parseInt(order) : undefined,
      },
    );
  }
}
