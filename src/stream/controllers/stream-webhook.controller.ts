// stream-webhook.controller.ts
import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  HttpCode,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { StreamService } from '../services/stream.service.simple';
import { WebhookEventDto } from '../dto/stream.dto';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@ApiTags('Stream Webhooks')
@Controller('stream/webhooks')
export class StreamWebhookController {
  private readonly logger = new Logger(StreamWebhookController.name);

  constructor(
    private readonly streamService: StreamService,
    private readonly configService: ConfigService,
  ) {}

  @Post('events')
  @ApiOperation({ summary: 'Handle Stream webhook events' })
  @ApiResponse({ 
    status: 200, 
    description: 'Webhook event processed successfully' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid webhook payload' 
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized webhook request' 
  })
  @ApiHeader({ 
    name: 'x-signature', 
    description: 'Stream webhook signature for verification',
    required: true 
  })
  @HttpCode(HttpStatus.OK)
  async handleWebhookEvent(
    @Body() event: WebhookEventDto,
    @Headers('x-signature') signature: string,
  ): Promise<{ received: boolean }> {
    try {
      // Log incoming webhook
      this.logger.log(`Received webhook event: ${event.type} for call: ${event.call_id}`);

      // Verify webhook signature
      const isValidSignature = this.verifyWebhookSignature(event, signature);
      
      if (!isValidSignature) {
        this.logger.warn('Invalid webhook signature received', {
          eventType: event.type,
          callId: event.call_id
        });
        throw new UnauthorizedException('Invalid webhook signature');
      }

      // Process the webhook event
      await this.streamService.handleWebhookEvent(event);

      this.logger.log(`Successfully processed webhook event: ${event.type}`);
      
      return { received: true };
    } catch (error) {
      this.logger.error(
        `Error processing webhook event: ${error.message}`,
        error.stack
      );
      throw error; // Let NestJS handle the error response
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Test webhook endpoint (no auth required)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Test webhook received successfully' 
  })
  @HttpCode(HttpStatus.OK)
  async testWebhook(
    @Body() testData: any
  ): Promise<{ success: boolean; message: string; data: any }> {
    this.logger.log('Test webhook received:', JSON.stringify(testData, null, 2));
    
    return {
      success: true,
      message: 'Test webhook received successfully',
      data: testData
    };
  }

  /**
   * Verify webhook signature using Stream API Secret
   * GetStream uses your API Secret for webhook signing, NOT a separate webhook secret
   */
  private verifyWebhookSignature(event: any, signature: string): boolean {
    try {
      // Use STREAM_API_SECRET for webhook verification
      const apiSecret = this.configService.get<string>('STREAM_API_SECRET');
      
      if (!apiSecret) {
        this.logger.error('STREAM_API_SECRET not configured - cannot verify webhooks');
        return false;
      }

      if (!signature) {
        this.logger.warn('No signature provided in webhook request');
        return false;
      }

      // Remove 'sha256=' prefix if present
      const receivedSignature = signature.replace(/^sha256=/, '');

      // Create expected signature
      const payload = JSON.stringify(event);
      const expectedSignature = crypto
        .createHmac('sha256', apiSecret)
        .update(payload)
        .digest('hex');

      // Use timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(receivedSignature, 'hex')
      );

      if (!isValid) {
        this.logger.warn('Signature mismatch', {
          expected: expectedSignature.substring(0, 10) + '...',
          received: receivedSignature.substring(0, 10) + '...'
        });
      }

      return isValid;
    } catch (error) {
      this.logger.error('Error verifying webhook signature:', error);
      return false;
    }
  }
}