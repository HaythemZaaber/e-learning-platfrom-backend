import { Injectable, Logger } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private ffmpegAvailable: boolean | null = null;

  /**
   * Check if ffmpeg is available on the system
   */
  async checkFfmpegAvailability(): Promise<boolean> {
    if (this.ffmpegAvailable !== null) {
      return this.ffmpegAvailable;
    }

    return new Promise((resolve) => {
      ffmpeg.getAvailableFormats((err) => {
        this.ffmpegAvailable = !err;
        if (err) {
          this.logger.warn(
            'FFmpeg is not available. Video duration extraction will be skipped.',
          );
        }
        resolve(this.ffmpegAvailable);
      });
    });
  }
  /**
   * Get video duration in seconds
   */
  async getVideoDuration(filePath: string): Promise<number> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video duration: ${err.message}`));
          return;
        }

        const duration = metadata.format.duration;
        if (duration === undefined) {
          reject(new Error('Could not determine video duration'));
          return;
        }

        // Round to nearest second
        resolve(Math.round(duration));
      });
    });
  }

  /**
   * Get video duration from buffer (for uploaded files)
   */
  async getVideoDurationFromBuffer(
    buffer: Buffer,
  ): Promise<number | undefined> {
    const isAvailable = await this.checkFfmpegAvailability();
    if (!isAvailable) {
      this.logger.warn(
        'FFmpeg not available, skipping video duration extraction',
      );
      return undefined;
    }

    return new Promise((resolve, reject) => {
      // Create a temporary file path
      const tempFilePath = path.join(
        process.cwd(),
        'temp',
        `temp_video_${Date.now()}.mp4`,
      );

      // Write buffer to temporary file
      const fs = require('fs');
      const tempDir = path.dirname(tempFilePath);

      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      fs.writeFileSync(tempFilePath, buffer);

      // Get duration
      ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
        // Clean up temporary file
        try {
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        } catch (cleanupError) {
          this.logger.error('Failed to cleanup temp file:', cleanupError);
        }

        if (err) {
          reject(new Error(`Failed to get video duration: ${err.message}`));
          return;
        }

        const duration = metadata.format.duration;
        if (duration === undefined) {
          reject(new Error('Could not determine video duration'));
          return;
        }

        // Round to nearest second
        resolve(Math.round(duration));
      });
    });
  }

  /**
   * Validate video duration constraints
   */
  validateVideoDuration(
    duration: number | undefined,
    type: 'STORY' | 'REEL',
  ): { valid: boolean; message?: string } {
    // If duration is not available (ffmpeg not installed), skip validation
    if (duration === undefined || duration === null) {
      this.logger.warn(
        `Skipping duration validation for ${type} - duration not available`,
      );
      return { valid: true };
    }

    if (type === 'STORY') {
      // Stories can be up to 15 seconds
      if (duration > 15) {
        return {
          valid: false,
          message: 'Story videos must be 15 seconds or less',
        };
      }
    } else if (type === 'REEL') {
      // Reels can be up to 90 seconds
      if (duration > 90) {
        return {
          valid: false,
          message: 'Reel videos must be 90 seconds or less',
        };
      }
    }

    return { valid: true };
  }

  /**
   * Get video metadata
   */
  async getVideoMetadata(filePath: string): Promise<{
    duration: number;
    width: number;
    height: number;
    bitrate: number;
    format: string;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(new Error(`Failed to get video metadata: ${err.message}`));
          return;
        }

        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === 'video',
        );
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        resolve({
          duration: Math.round(metadata.format.duration || 0),
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          bitrate: parseInt(String(metadata.format.bit_rate || '0')),
          format: metadata.format.format_name || 'unknown',
        });
      });
    });
  }
}
