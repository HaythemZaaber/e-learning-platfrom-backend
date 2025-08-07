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
  // DIRECT UPLOAD - FILE STORAGE ONLY
  // ============================================
  async createDirectUpload(
    file: Express.Multer.File,
    metadata: {
      type: ContentType;
    },
  ) {
    try {
      // Create organized folder structure: Uploads/{contentType}/
      const contentTypeFolder = metadata.type.toLowerCase();
      const folderPath = `${contentTypeFolder}`;
      const fileName = `${Date.now()}-${this.sanitizeFileName(file.originalname)}`;

      const uploadResult = this.uploadFile(file, fileName, folderPath);

      const file_url =
        (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/uploads') +
        '/' +
        uploadResult.path.replace(/\\/g, '/');

      return {
        success: true,
        fileInfo: {
          file_url,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString(),
          filePath: uploadResult.path,
        },
      };
    } catch (error) {
      throw new Error(`Direct upload failed: ${error.message}`);
    }
  }

  // ============================================
  // CONTENT ITEM DELETION
  // ============================================
  async deleteContentItem(contentItemId: string, userId: string) {
    try {
      // Find the content item and verify ownership
      const contentItem = await this.prisma.contentItem.findFirst({
        where: {
          id: contentItemId,
          course: {
            instructorId: userId,
          },
        },
        include: {
          course: true,
        },
      });

      if (!contentItem) {
        throw new Error('Content item not found or access denied');
      }

      // Delete the physical file
      if (
        contentItem.contentData &&
        typeof contentItem.contentData === 'object' &&
        'filePath' in contentItem.contentData
      ) {
        const filePath = path.join(
          this.uploadPath,
          contentItem.contentData.filePath as string,
        );
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File deleted: ${filePath}`);
        }
      }

      // Delete the database record
      await this.prisma.contentItem.delete({
        where: { id: contentItemId },
      });

      return {
        success: true,
        message: 'Content item deleted successfully',
        deletedItem: {
          id: contentItem.id,
          title: contentItem.title,
          fileName: contentItem.fileName,
        },
      };
    } catch (error) {
      console.error('Delete content item error:', error);
      throw new Error(`Failed to delete content item: ${error.message}`);
    }
  }

  // ============================================
  // FILE DELETION (for orphaned files)
  // ============================================
  // how will be the filePath should i send all the url file

  async deleteFile(fileUrl: string, userId: string) {
    try {
      const urlParts = fileUrl.split('/uploads/');
      console.log('urlParts', urlParts);
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL format');
      }

      const filePath = urlParts[1];
      // Verify the file exists and user has access
      const fullPath = path.join(this.uploadPath, filePath);
      if (!fs.existsSync(fullPath)) {
        throw new Error('File not found');
      }

      // Get file size before deleting
      const fileSize = fs.statSync(fullPath).size;

      // Check if file is associated with any content item
      const contentItems = await this.prisma.contentItem.findMany({
        where: {
          course: {
            instructorId: userId,
          },
        },
      });

      const contentItem = contentItems.find((item) => item.fileUrl === fileUrl);

      if (contentItem) {
        await this.prisma.contentItem.delete({
          where: { id: contentItem.id },
        });
      }

      // Delete the file
      fs.unlinkSync(fullPath);
      console.log(`File deleted: ${fullPath}`);

      return {
        success: true,
        message: 'File deleted successfully',
        deletedFile: {
          path: filePath,
          size: fileSize,
        },
      };
    } catch (error) {
      console.error('Delete file error:', error);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  // ============================================
  // GET USER'S CONTENT ITEMS
  // ============================================
  async getUserContentItems(userId: string) {
    try {
      const contentItems = await this.prisma.contentItem.findMany({
        where: {
          course: {
            instructorId: userId,
          },
        },
        include: {
          course: {
            select: {
              id: true,
              title: true,
            },
          },
          lecture: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return {
        success: true,
        contentItems,
        count: contentItems.length,
      };
    } catch (error) {
      console.error('Get user content items error:', error);
      throw new Error(`Failed to get user content items: ${error.message}`);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================
  uploadFile(
    file: Express.Multer.File,
    fileName?: string,
    folderPath?: string,
  ) {
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

  // ============================================
  // COURSE THUMBNAIL DELETION
  // ============================================
  async deleteCourseThumbnail(
    thumbnailUrl: string,
    userId: string,
    options: {
      courseId?: string;
      isDraft?: boolean;
      isUnsaved?: boolean;
    } = {},
  ) {
    try {
      // Extract file path from URL
      const urlParts = thumbnailUrl.split('/uploads/');
      if (urlParts.length < 2) {
        throw new Error('Invalid thumbnail URL format');
      }

      const filePath = urlParts[1];
      const fullPath = path.join(this.uploadPath, filePath);

      // Verify file exists
      if (!fs.existsSync(fullPath)) {
        console.log(`File not found: ${fullPath}`);
        // Return success even if file doesn't exist (might have been deleted already)
        return {
          success: true,
          message: 'Thumbnail deleted successfully (file was already removed)',
          deletedFile: {
            path: filePath,
            url: thumbnailUrl,
          },
        };
      }

      // For unsaved files (not associated with any course), just delete the file
      if (options.isUnsaved) {
        fs.unlinkSync(fullPath);
        console.log(`Unsaved thumbnail deleted: ${fullPath}`);

        return {
          success: true,
          message: 'Unsaved thumbnail deleted successfully',
          deletedFile: {
            path: filePath,
            url: thumbnailUrl,
          },
        };
      }

      // For draft files, check if it's associated with a draft course
      if (options.isDraft && options.courseId) {
        const draftCourse = await this.prisma.course.findFirst({
          where: {
            id: options.courseId,
            instructorId: userId,
            status: 'DRAFT',
          },
        });

        if (!draftCourse) {
          throw new Error('Draft course not found or access denied');
        }

        // Update the courseDraft table to set thumbnail to null in draftData
        const courseDrafts = await this.prisma.courseDraft.findMany({
          where: {
            instructorId: userId,
          },
        });

        // Update each draft to remove thumbnail from draftData
        for (const draft of courseDrafts) {
          const draftData = draft.draftData as any;
          if (draftData && typeof draftData === 'object') {
            // Remove thumbnail from draftData
            delete draftData.thumbnail;

            await this.prisma.courseDraft.update({
              where: { id: draft.id },
              data: {
                draftData: draftData,
              },
            });
          }
        }

        // Delete the file
        fs.unlinkSync(fullPath);
        console.log(`Draft thumbnail deleted: ${fullPath}`);

        // Update the course to remove thumbnail reference
        await this.prisma.course.update({
          where: { id: options.courseId },
          data: { thumbnail: null },
        });

        return {
          success: true,
          message: 'Draft course thumbnail deleted successfully',
          deletedFile: {
            path: filePath,
            url: thumbnailUrl,
          },
        };
      }

      // For published courses, verify ownership and check if thumbnail is still in use
      if (options.courseId) {
        const course = await this.prisma.course.findFirst({
          where: {
            id: options.courseId,
            instructorId: userId,
          },
        });

        if (!course) {
          throw new Error('Course not found or access denied');
        }

        // Check if this thumbnail is still being used by the course
        if (course.thumbnail === thumbnailUrl) {
          // Update the course to remove thumbnail reference
          await this.prisma.course.update({
            where: { id: options.courseId },
            data: { thumbnail: null },
          });
        }

        // Delete the file
        fs.unlinkSync(fullPath);
        console.log(`Published course thumbnail deleted: ${fullPath}`);

        return {
          success: true,
          message: 'Course thumbnail deleted successfully',
          deletedFile: {
            path: filePath,
            url: thumbnailUrl,
          },
        };
      }

      // If no specific scenario is provided, just delete the file
      fs.unlinkSync(fullPath);
      console.log(`Thumbnail deleted: ${fullPath}`);

      return {
        success: true,
        message: 'Thumbnail deleted successfully',
        deletedFile: {
          path: filePath,
          url: thumbnailUrl,
        },
      };
    } catch (error) {
      console.error('Delete course thumbnail error:', error);
      throw new Error(`Failed to delete course thumbnail: ${error.message}`);
    }
  }

  // ============================================
  // BULK THUMBNAIL CLEANUP (for orphaned files)
  // ============================================
  async cleanupOrphanedThumbnails(userId: string) {
    try {
      // Get all courses for this user
      const userCourses = await this.prisma.course.findMany({
        where: { instructorId: userId },
        select: { id: true, thumbnail: true },
      });

      // Create a set of valid thumbnail URLs
      const validThumbnails = new Set(
        userCourses.map((course) => course.thumbnail).filter(Boolean),
      );

      // Scan uploads directory for orphaned thumbnail files
      const thumbnailFiles: string[] = [];

      const scanDirectory = (dir: string) => {
        if (!fs.existsSync(dir)) return;

        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            scanDirectory(fullPath);
          } else if (stat.isFile()) {
            // Check if it's an image file (potential thumbnail)
            const ext = path.extname(item).toLowerCase();
            if (
              ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(ext)
            ) {
              const relativePath = path.relative(this.uploadPath, fullPath);
              const fileUrl =
                (process.env.BACKEND_ASSETS_LINK ||
                  'http://localhost:3001/uploads') +
                '/' +
                relativePath.replace(/\\/g, '/');

              // If this file URL is not in valid thumbnails, it's orphaned
              if (!validThumbnails.has(fileUrl)) {
                thumbnailFiles.push(fullPath);
              }
            }
          }
        }
      };

      scanDirectory(this.uploadPath);

      // Delete orphaned files
      const deletedFiles: string[] = [];
      for (const filePath of thumbnailFiles) {
        try {
          fs.unlinkSync(filePath);
          deletedFiles.push(filePath);
          console.log(`Orphaned thumbnail deleted: ${filePath}`);
        } catch (error) {
          console.error(`Failed to delete orphaned file: ${filePath}`, error);
        }
      }

      return {
        success: true,
        message: `Cleanup completed. Deleted ${deletedFiles.length} orphaned thumbnail files.`,
        deletedFiles,
        totalFound: thumbnailFiles.length,
      };
    } catch (error) {
      console.error('Cleanup orphaned thumbnails error:', error);
      throw new Error(
        `Failed to cleanup orphaned thumbnails: ${error.message}`,
      );
    }
  }
}
