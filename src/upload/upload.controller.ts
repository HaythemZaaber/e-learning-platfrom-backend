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
import { UserRole, ContentType } from '../../generated/prisma';
import { UploadService } from './upload.service';
import { GetUser } from '../auth/get-user.decorator';

@Controller('upload')
@UseGuards(AuthGuard, RolesGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  // ============================================
  // TEMPORARY UPLOADS (for course creation)
  // ============================================

  @Post('temp/video')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTempVideo(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(video\/mp4|video\/webm|video\/quicktime|video\/x-msvideo)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 500, // 500MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('tempId') tempId?: string,
    @Body('lectureId') lectureId?: string,
    @Body('order') order?: number,
    @Body('sectionId') sectionId?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

 

    return this.uploadService.createTemporaryUpload(file, user.id, {
      type: ContentType.VIDEO,
      title,
      description,
      tempId,
      lectureId,
      order,
      sectionId,
    });
  }

  @Post('temp/document')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTempDocument(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(application\/pdf|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/plain)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 50, // 50MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('tempId') tempId?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createTemporaryUpload(file, user.id, {
      type: ContentType.DOCUMENT,
      title,
      description,
      tempId,
    });
  }

  @Post('temp/image')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTempImage(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(image\/jpeg|image\/png|image\/gif|image\/webp|image\/bmp)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 10, // 10MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('tempId') tempId?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createTemporaryUpload(file, user.id, {
      type: ContentType.IMAGE,
      title,
      description,
      tempId,
    });
  }

  @Post('temp/audio')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTempAudio(
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
    @Body('description') description?: string,
    @Body('tempId') tempId?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createTemporaryUpload(file, user.id, {
      type: ContentType.AUDIO,
      title,
      description,
      tempId,
    });
  }

  @Post('temp/archive')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTempArchive(
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(application\/zip|application\/x-rar-compressed|application\/x-7z-compressed|application\/x-tar|application\/gzip)$/i,
        })
        .addMaxSizeValidator({
          maxSize: 1024 * 1024 * 100, // 100MB
        })
        .build(),
    )
    file: Express.Multer.File,
    @Body('title') title: string,
    @Body('description') description?: string,
    @Body('tempId') tempId?: string,
    @GetUser() user?: any,
  ) {
    if (!title) {
      throw new BadRequestException('Title is required');
    }

    return this.uploadService.createTemporaryUpload(file, user.id, {
      type: ContentType.ARCHIVE,
      title,
      description,
      tempId,
    });
  }

  // ============================================
  // BATCH TEMPORARY UPLOAD (unified endpoint)
  // ============================================

  @Post('temp/batch')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadTempBatch(
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
    @Body('description') description?: string,
    @Body('tempId') tempId?: string,
    @GetUser() user?: any,
  ) {
    if (!title || !contentType) {
      throw new BadRequestException('Title and contentType are required');
    }

    if (!Object.values(ContentType).includes(contentType as ContentType)) {
      throw new BadRequestException('Invalid content type');
    }

    return this.uploadService.createTemporaryUpload(file, user.id, {
      type: contentType as ContentType,
      title,
      description,
      tempId,
    });
  }

  // ============================================
  // PERMANENT UPLOADS (for existing courses)
  // ============================================

  @Post('course/:courseId/permanent')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPermanent(
    @Param('courseId') courseId: string,
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
    @Body('description') description?: string,
    @Body('lessonId') lessonId?: string,
    @Body('order') order?: string,
    @GetUser() user?: any,
  ) {
    if (!title || !contentType) {
      throw new BadRequestException('Title and contentType are required');
    }

    if (!Object.values(ContentType).includes(contentType as ContentType)) {
      throw new BadRequestException('Invalid content type');
    }

    return this.uploadService.createPermanentUpload(file, courseId, {
      type: contentType as ContentType,
      title,
      description,
      lessonId,
      order: order ? parseInt(order) : undefined,
    });
  }

  // ============================================
  // TEMP TO PERMANENT CONVERSION
  // ============================================

  @Post('convert/:tempUploadId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async convertTempToPermanent(
    @Param('tempUploadId') tempUploadId: string,
    @Body('courseId') courseId: string,
    @Body('lessonId') lessonId?: string,
    @Body('order') order?: number,
  ) {
    if (!courseId) {
      throw new BadRequestException('Course ID is required');
    }

    return this.uploadService.convertTempToPermanent(
      tempUploadId,
      courseId,
      lessonId,
      order,
    );
  }

  // ============================================
  // MANAGEMENT ENDPOINTS
  // ============================================

  @Get('temp/my-uploads')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getMyTempUploads(@GetUser() user: any) {
    // Implementation would fetch user's temp uploads from database
    // This would be useful for resuming course creation
    return { message: 'Get temp uploads endpoint - implement in service' };
  }

  @Delete('temp/cleanup')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async cleanupMyTempUploads(@GetUser() user: any) {
    await this.uploadService.cleanupUserTempUploads(user.id);
    return { success: true, message: 'Temporary uploads cleaned up' };
  }

  @Delete('temp/:tempUploadId')
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async deleteTempUpload(
    @Param('tempUploadId') tempUploadId: string,
    @GetUser() user: any,
  ) {
    // Implementation would delete specific temp upload
    return { message: 'Delete temp upload endpoint - implement in service' };
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
    const uploadResult = this.uploadService.uploadFile(file, fileName, folderPath);
    
    const file_url = (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/public') +
                    '/' + uploadResult.path.replace(/\\/g, '/');

    return {
      file_url,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
    };
  }
}