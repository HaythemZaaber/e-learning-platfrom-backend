import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Webhook } from 'svix';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  private readonly webhook: Webhook;

  constructor(private configService: ConfigService) {
    const webhookSecret = this.configService.get<string>(
      'CLERK_WEBHOOK_SECRET',
    );
    if (!webhookSecret) {
      throw new Error('CLERK_WEBHOOK_SECRET is not configured');
    }
    this.webhook = new Webhook(webhookSecret);
  }

  async verifyWebhook(
    payload: string,
    svixId: string,
    svixTimestamp: string,
    svixSignature: string,
  ): Promise<boolean> {
    try {
      const headers = {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      };

      // Verify the webhook signature
      this.webhook.verify(payload, headers);
      return true;
    } catch (error) {
      this.logger.error('Webhook verification failed:', error);
      return false;
    }
  }
}
