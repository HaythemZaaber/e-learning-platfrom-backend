import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { WebhookService } from './webhook.service';

@Controller('webhooks')
export class UserWebhookController {
  private readonly logger = new Logger(UserWebhookController.name);

  constructor(
    private userService: UserService,
    private webhookService: WebhookService,
  ) {}

  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  async handleClerkWebhook(
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
    @Body() payload: any,
  ) {
    try {
      // Verify the webhook signature
      const isValid = await this.webhookService.verifyWebhook(
        JSON.stringify(payload),
        svixId,
        svixTimestamp,
        svixSignature,
      );

      if (!isValid) {
        this.logger.error('Invalid webhook signature');
        return { error: 'Invalid signature' };
      }

      const { type, data } = payload;

      switch (type) {
        case 'user.created':
          await this.handleUserCreated(data);
          break;
        case 'user.updated':
          await this.handleUserUpdated(data);
          break;
        case 'user.deleted':
          await this.handleUserDeleted(data);
          break;
        default:
          this.logger.warn(`Unhandled webhook type: ${type}`);
      }

      return { received: true };
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      return { error: 'Internal server error' };
    }
  }

  private async handleUserCreated(data: any) {
    try {
      const userData = {
        clerkId: data.id,
        email: data.email_addresses[0]?.email_address || '',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
        profileImage: data.image_url || '',
      };

      const user = await this.userService.createUser(userData);
      this.logger.log(`User created successfully: ${user.email}`);
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  private async handleUserUpdated(data: any) {
    try {
      const userData = {
        email: data.email_addresses[0]?.email_address || '',
        firstName: data.first_name || '',
        lastName: data.last_name || '',
      };

      const user = await this.userService.updateUser(data.id, userData);
      this.logger.log(`User updated successfully: ${user.email}`);
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  private async handleUserDeleted(data: any) {
    try {
      await this.userService.deleteUser(data.id);
      this.logger.log(`User deleted successfully: ${data.id}`);
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }
}
