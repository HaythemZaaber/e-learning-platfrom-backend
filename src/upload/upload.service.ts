// src/modules/upload/upload.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContentType } from '../../generated/prisma';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private uploadPath = './uploads/';

  constructor(private prisma: PrismaService) {}

  // ============================================
  // TEMPORARY UPLOAD (for course creation)
  // ============================================
  async createTemporaryUpload(
    file: Express.Multer.File,
    userId: string,
    metadata: {
      type: ContentType;
      title: string;
      description?: string;
      tempId?: string; // Frontend-generated temp ID
      lectureId?: string;
      order?: number;
      sectionId?: string;
    }
  ) {
    try {
      const folderPath = `temp/${userId}/${metadata.type.toLowerCase()}`;
      const fileName = `${metadata.tempId || Date.now()}-${this.sanitizeFileName(file.originalname)}`;
      
      const uploadResult = this.uploadFile(file, fileName, folderPath);
      
      const file_url = (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/uploads') + 
                      '/' + uploadResult.path.replace(/\\/g, '/');

      // Store temporary upload record
      const tempUpload = await this.prisma.temporaryUpload.create({
        data: {
          userId,
          originalName: file.originalname,
          fileName: uploadResult.name,
          filePath: uploadResult.path,
          fileUrl: file_url,
          fileSize: file.size,
          mimeType: file.mimetype,
          contentType: metadata.type,
          title: metadata.title,
          description: metadata.description,
          tempId: metadata.tempId,
          sectionId: metadata.sectionId,
          lectureId: metadata.lectureId,
          order: metadata.order,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        }
      });

      return {
        success: true,
        tempUpload,
        file_url,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Temporary upload error:', error);
      throw new Error(`Temporary upload failed: ${error.message}`);
    }
  }

  // ============================================
  // CONVERT TEMP TO PERMANENT
  // ============================================
  async convertTempToPermanent(
    tempUploadId: string,
    courseId: string,
    lessonId?: string,
    order?: number
  ) {
    try {
      const tempUpload = await this.prisma.temporaryUpload.findUnique({
        where: { id: tempUploadId }
      });

      if (!tempUpload) {
        throw new Error('Temporary upload not found');
      }

      // Move file to permanent location
      const newFolderPath = `courses/${courseId}/${tempUpload.contentType.toLowerCase()}`;
      const newFileName = `${Date.now()}-${tempUpload.fileName}`;
      
      // Ensure new directory exists
      const fullNewPath = path.join(this.uploadPath, newFolderPath);
      if (!fs.existsSync(fullNewPath)) {
        fs.mkdirSync(fullNewPath, { recursive: true });
      }

      // Move file
      const oldPath = path.join(this.uploadPath, tempUpload.filePath);
      const newPath = path.join(fullNewPath, newFileName);
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
      }

      const newFileUrl = (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/public') + 
                        '/' + path.join(newFolderPath, newFileName).replace(/\\/g, '/');

      // Create permanent content item
      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: tempUpload.title,
          description: tempUpload.description,
          type: tempUpload.contentType,
          fileUrl: newFileUrl,
          fileName: tempUpload.originalName,
          fileSize: tempUpload.fileSize,
          mimeType: tempUpload.mimeType,
          order: order || 0,
          isPublished: true,
          courseId,
          lessonId,
          contentData: {
            originalTempId: tempUpload.tempId,
            convertedAt: new Date().toISOString(),
          }
        }
      });

      // Delete temporary record
      await this.prisma.temporaryUpload.delete({
        where: { id: tempUploadId }
      });

      return {
        success: true,
        contentItem,
        message: 'File successfully converted to permanent storage'
      };
    } catch (error) {
      throw new Error(`Failed to convert temporary upload: ${error.message}`);
    }
  }

  // ============================================
  // DIRECT PERMANENT UPLOAD (for existing courses)
  // ============================================
  async createPermanentUpload(
    file: Express.Multer.File,
    courseId: string,
    metadata: {
      type: ContentType;
      title: string;
      description?: string;
      lessonId?: string;
      order?: number;
    }
  ) {
    try {
      const folderPath = `courses/${courseId}/${metadata.type.toLowerCase()}`;
      const fileName = `${Date.now()}-${this.sanitizeFileName(file.originalname)}`;
      
      const uploadResult = this.uploadFile(file, fileName, folderPath);
      
      const file_url = (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/public') + 
                      '/' + uploadResult.path.replace(/\\/g, '/');

      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: metadata.title,
          description: metadata.description,
          type: metadata.type,
          fileUrl: file_url,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          order: metadata.order || 0,
          isPublished: true,
          courseId,
          lessonId: metadata.lessonId,
          contentData: {
            uploadedAt: new Date().toISOString(),
          }
        }
      });

      return {
        success: true,
        contentItem,
        fileInfo: {
          file_url,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString(),
        }
      };
    } catch (error) {
      throw new Error(`Permanent upload failed: ${error.message}`);
    }
  }

  // ============================================
  // CLEANUP FUNCTIONS
  // ============================================
  async cleanupExpiredTempUploads() {
    try {
      const expiredUploads = await this.prisma.temporaryUpload.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      for (const upload of expiredUploads) {
        // Delete file
        const filePath = path.join(this.uploadPath, upload.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Delete database records
      await this.prisma.temporaryUpload.deleteMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      console.log(`Cleaned up ${expiredUploads.length} expired temporary uploads`);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  async cleanupUserTempUploads(userId: string) {
    try {
      const userTempUploads = await this.prisma.temporaryUpload.findMany({
        where: { userId }
      });

      for (const upload of userTempUploads) {
        const filePath = path.join(this.uploadPath, upload.filePath);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await this.prisma.temporaryUpload.deleteMany({
        where: { userId }
      });
    } catch (error) {
      console.error('User cleanup error:', error);
    }
  }

  // ============================================
  // EXISTING METHODS (keep as is)
  // ============================================
  uploadFile(file: Express.Multer.File, fileName?: string, folderPath?: string) {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
      }
     

      const fullFolderPath = folderPath
        ? path.join(this.uploadPath, folderPath)
        : this.uploadPath;
      if (!fs.existsSync(fullFolderPath)) {
        fs.mkdirSync(fullFolderPath, { recursive: true });
      }

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileExtName = path.extname(file.originalname);
      const sanitizedOriginalName = this.sanitizeFileName(file.originalname);

      let finalFileName: string;

      if (fileName) {
        const baseFileName = fileName.replace(/\.[^/.]+$/, '');
        finalFileName = `${baseFileName}${fileExtName}`;
      } else {
        finalFileName = `${sanitizedOriginalName}-${uniqueSuffix}${fileExtName}`;
      }

      const relativePath = folderPath
        ? path.join(folderPath, finalFileName)
        : finalFileName;
      const fullFilePath = path.join(this.uploadPath, relativePath);

      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
      }

      fs.writeFileSync(fullFilePath, file.buffer);

      return {
        path: relativePath.replace(/\\/g, '/'),
        name: sanitizedOriginalName,
      };
    } catch (error) {
      throw new Error(`File system operation failed: ${error.message}`);
    }
  }

  private sanitizeFileName(fileName: string): string {
    const nameWithoutExt = path.parse(fileName).name;
    return nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  async deleteFile(fullFilePath: string) {
    try {
      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
        console.log(`File deleted successfully: ${fullFilePath}`);
      }

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        message: `Failed to delete file: ${error.message}`,
      };
    }
  }

  getFileInfo(filePath: string) {
    try {
      const fullPath = path.join(this.uploadPath, filePath);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        return {
          exists: true,
          size: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
        };
      }
      return { exists: false };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }
}