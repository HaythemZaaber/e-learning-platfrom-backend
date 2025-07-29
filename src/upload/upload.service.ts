import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
  private uploadPath = './uploads/';

  async createFile(
    file: Express.Multer.File,
    fileName?: string,
    folderPath?: string,
  ) {
    try {
      const { path: filePath, name } = this.uploadFile(
        file,
        fileName,
        folderPath,
      );

      const file_url =
        (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/public') +
        '/' +
        filePath.replace(/\\/g, '/');

      // Log successful upload
      console.log(`File uploaded successfully: ${file_url}`);

      return {
        file_url: file_url,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        uploadedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  uploadFile(
    file: Express.Multer.File,
    fileName?: string,
    folderPath?: string,
  ) {
    try {
      // Ensure upload directory exists
      if (!fs.existsSync(this.uploadPath)) {
        fs.mkdirSync(this.uploadPath, { recursive: true });
      }

      // Create folder path if provided
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
        // If fileName is provided, use it with original extension
        const baseFileName = fileName.replace(/\.[^/.]+$/, ''); // Remove any extension from fileName
        finalFileName = `${baseFileName}${fileExtName}`;
      } else {
        // Use original name with unique suffix
        finalFileName = `${sanitizedOriginalName}-${uniqueSuffix}${fileExtName}`;
      }

      const relativePath = folderPath
        ? path.join(folderPath, finalFileName)
        : finalFileName;
      const fullFilePath = path.join(this.uploadPath, relativePath);

      // Delete existing file if it exists
      if (fs.existsSync(fullFilePath)) {
        fs.unlinkSync(fullFilePath);
      }

      // Write the new file
      fs.writeFileSync(fullFilePath, file.buffer);

      return {
        path: relativePath.replace(/\\/g, '/'), // Normalize path separators
        name: sanitizedOriginalName,
      };
    } catch (error) {
      throw new Error(`File system operation failed: ${error.message}`);
    }
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

  private sanitizeFileName(fileName: string): string {
    // Remove file extension
    const nameWithoutExt = path.parse(fileName).name;

    // Replace spaces and special characters with hyphens
    return nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  }

  // Helper method to get file info
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
