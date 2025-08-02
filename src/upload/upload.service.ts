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
    }
  ) {
    try {
      // Create organized folder structure: Uploads/{contentType}/
      const contentTypeFolder = metadata.type.toLowerCase();
      const folderPath = `${contentTypeFolder}`;
      const fileName = `${Date.now()}-${this.sanitizeFileName(file.originalname)}`;
      
      const uploadResult = this.uploadFile(file, fileName, folderPath);
      
      const file_url = (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/uploads') + 
                      '/' + uploadResult.path.replace(/\\/g, '/');

      return {
        success: true,
        fileInfo: {
          file_url,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadedAt: new Date().toISOString(),
          filePath: uploadResult.path,
        }
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
            instructorId: userId
          }
        },
        include: {
          course: true
        }
      });

      if (!contentItem) {
        throw new Error('Content item not found or access denied');
      }

      // Delete the physical file
      if (contentItem.contentData && typeof contentItem.contentData === 'object' && 'filePath' in contentItem.contentData) {
        const filePath = path.join(this.uploadPath, contentItem.contentData.filePath as string);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`File deleted: ${filePath}`);
        }
      }

      // Delete the database record
      await this.prisma.contentItem.delete({
        where: { id: contentItemId }
      });

      return {
        success: true,
        message: 'Content item deleted successfully',
        deletedItem: {
          id: contentItem.id,
          title: contentItem.title,
          fileName: contentItem.fileName
        }
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

  async deleteFile(filePath: string, userId: string) {
    try {
      // Verify the file exists and user has access
      const fullPath = path.join(this.uploadPath, filePath);
      if (!fs.existsSync(fullPath)) {
        throw new Error('File not found');
      }

      // Check if file is associated with any content item
      const contentItems = await this.prisma.contentItem.findMany({
        where: {
          course: {
            instructorId: userId
          }
        }
      });

      const contentItem = contentItems.find(item => 
        item.contentData && 
        typeof item.contentData === 'object' && 
        'filePath' in item.contentData && 
        (item.contentData.filePath as string).includes(filePath)
      );

      if (contentItem) {
        throw new Error('Cannot delete file that is associated with a content item. Delete the content item instead.');
      }

      // Delete the file
      fs.unlinkSync(fullPath);
      console.log(`File deleted: ${fullPath}`);

      return {
        success: true,
        message: 'File deleted successfully',
        deletedFile: {
          path: filePath,
          size: fs.statSync(fullPath).size
        }
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
            instructorId: userId
          }
        },
        include: {
          course: {
            select: {
              id: true,
              title: true
            }
          },
          lesson: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return {
        success: true,
        contentItems,
        count: contentItems.length
      };
    } catch (error) {
      console.error('Get user content items error:', error);
      throw new Error(`Failed to get user content items: ${error.message}`);
    }
  }

  // ============================================
  // UTILITY METHODS
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