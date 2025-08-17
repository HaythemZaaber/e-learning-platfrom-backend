// src/modules/upload/upload.controller.ts
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
  Get,
  Delete,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, ContentType } from '@prisma/client';
import { UploadService } from './upload.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('upload')
@UseGuards(AuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ============================================
  // DIRECT UPLOADS (for course content)
  // ============================================

  @Post('video')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadVideo(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^(video\/mp4|video\/webm|video\/quicktime|video\/x-msvideo)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 500, // 500MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createDirectUpload(file, {
      type: ContentType.VIDEO,
    });
  }

  @Post('image')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^(image\/jpeg|image\/png|image\/gif|image\/webp|image\/bmp)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 10, // 10MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createDirectUpload(file, {
      type: ContentType.IMAGE,
    });
  }

  @Post('document')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/plain)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 50, // 50MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createDirectUpload(file, {
      type: ContentType.DOCUMENT,
    });
  }

  @Post('audio')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadAudio(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(audio\/mpeg|audio\/wav|audio\/ogg)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 100, // 100MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createDirectUpload(file, {
      type: ContentType.AUDIO,
    });
  }

  @Post('archive')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadArchive(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType:
            /^(application\/zip|application\/x-rar-compressed|application\/x-7z-compressed|application\/x-tar|application\/gzip)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 100, // 100MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createDirectUpload(file, {
      type: ContentType.ARCHIVE,
    });
  }

  @Post('batch')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  @UseInterceptors(FileInterceptor('file'))
  async uploadBatch(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp(
            /^(image\/jpeg|image\/png|image\/gif|image\/bmp|image\/webp|application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation|video\/mp4|video\/webm|video\/quicktime|video\/x-msvideo|audio\/mpeg|audio\/wav|text\/csv|application\/msword|text\/plain|application\/zip|application\/x-rar-compressed)$/i,
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
  ) {
    if (!title || !contentType) {
      throw new BadRequestException('Title and contentType are required');
    }

    if (!Object.values(ContentType).includes(contentType as ContentType)) {
      throw new BadRequestException('Invalid content type');
    }

    return this.uploadService.createDirectUpload(file, {
      type: contentType as ContentType,
    });
  }

  // ============================================
  // DELETION ENDPOINTS
  // ============================================

  @Delete('content/:contentItemId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  async deleteContentItem(
    @Param('contentItemId') contentItemId: string,
    @GetUser() user: any,
  ) {
    if (!contentItemId) {
      throw new BadRequestException('Content item ID is required');
    }

    return this.uploadService.deleteContentItem(contentItemId, user.id);
  }

  @Delete('file')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  async deleteFile(
    @Body('data') data: { fileUrl: string },
    @GetUser() user: any,
  ) {
    console.log('data', data);
    if (!data.fileUrl) {
      throw new BadRequestException('File URL is required');
    }

    // Decode the base64 encoded file URL
    //  const fileUrl = Buffer.from(encodedFileUrl, 'base64').toString('utf-8');
    console.log('user.id', user.id);

    return this.uploadService.deleteFile(data.fileUrl, user.id);
  }

  // ============================================
  // COURSE THUMBNAIL DELETION ENDPOINTS
  // ============================================

  @Delete('thumbnail/unsaved')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  async deleteUnsavedThumbnail(
    @Body('thumbnailUrl') thumbnailUrl: string,
    @GetUser() user: any,
  ) {
    if (!thumbnailUrl) {
      throw new BadRequestException('Thumbnail URL is required');
    }

    return this.uploadService.deleteCourseThumbnail(thumbnailUrl, user.id, {
      isUnsaved: true,
    });
  }

  @Delete('thumbnail/draft/:courseId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  async deleteDraftThumbnail(
    @Param('courseId') courseId: string,
    @Body('thumbnailUrl') thumbnailUrl: string,
    @GetUser() user: any,
  ) {
    if (!thumbnailUrl) {
      throw new BadRequestException('Thumbnail URL is required');
    }

    if (!courseId) {
      throw new BadRequestException('Course ID is required');
    }

    return this.uploadService.deleteCourseThumbnail(thumbnailUrl, user.id, {
      courseId,
      isDraft: true,
    });
  }

  @Delete('thumbnail/course/:courseId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  async deleteCourseThumbnail(
    @Param('courseId') courseId: string,
    @Body('thumbnailUrl') thumbnailUrl: string,
    @GetUser() user: any,
  ) {
    if (!thumbnailUrl) {
      throw new BadRequestException('Thumbnail URL is required');
    }

    if (!courseId) {
      throw new BadRequestException('Course ID is required');
    }

    return this.uploadService.deleteCourseThumbnail(thumbnailUrl, user.id, {
      courseId,
    });
  }

  @Delete('thumbnail/cleanup')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  async cleanupOrphanedThumbnails(@GetUser() user: any) {
    return this.uploadService.cleanupOrphanedThumbnails(user.id);
  }

  // ============================================
  // MANAGEMENT ENDPOINTS
  // ============================================

  @Get('my-content')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.STUDENT)
  async getMyContentItems(@GetUser() user: any) {
    return this.uploadService.getUserContentItems(user.id);
  }

  // ============================================
  // LEGACY ENDPOINTS (keep for backward compatibility)
  // ============================================

  @Post('file')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: new RegExp(
            /^(image\/jpeg|image\/png|image\/gif|image\/bmp|image\/webp|application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation|video\/mp4|video\/webm|video\/quicktime|video\/x-msvideo|audio\/mpeg|audio\/wav|text\/csv|application\/msword|text\/plain|application\/zip|application\/x-rar-compressed)$/i,
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
    const uploadResult = this.uploadService.uploadFile(
      file,
      fileName,
      folderPath,
    );

    const file_url =
      (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/public') +
      '/' +
      uploadResult.path.replace(/\\/g, '/');

    return {
      file_url,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };
  }
}
