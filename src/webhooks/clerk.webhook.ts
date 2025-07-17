import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { Webhook } from 'svix';
import { UserService } from '../user/user.service';
import { ClerkService } from '../auth/clerk.service';

@Controller('webhooks')
export class ClerkWebhookController {
  constructor(
    private userService: UserService,
    private clerkService: ClerkService,
  ) {}

  @Post('clerk')
  async handleClerkWebhook(@Body() body: any, @Headers() headers: any) {
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const wh = new Webhook(webhookSecret);

    try {
      const evt = wh.verify(JSON.stringify(body), headers) as any;

      switch (evt.type) {
        case 'user.created':
          await this.handleUserCreated(evt.data);
          break;
        case 'user.updated':
          await this.handleUserUpdated(evt.data);
          break;
        case 'user.deleted':
          await this.handleUserDeleted(evt.data);
          break;
      }

      return { received: true };
    } catch (error) {
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  private async handleUserCreated(userData: any) {
    await this.userService.createUser({
      clerkId: userData.id,
      email: userData.email_addresses[0]?.email_address,
      firstName: userData.first_name,
      lastName: userData.last_name,
    });
  }

  private async handleUserUpdated(userData: any) {
    // Handle user updates
    console.log('User updated:', userData.id);
  }

  private async handleUserDeleted(userData: any) {
    // Handle user deletion
    console.log('User deleted:', userData.id);
  }
}
