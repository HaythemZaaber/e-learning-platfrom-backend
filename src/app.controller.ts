import {
  Controller,
  Get,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AppService } from './app.service';
import { ClerkService } from './auth/clerk.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly clerkService: ClerkService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('debug/auth')
  async debugAuth(@Headers('authorization') authHeader: string) {
    try {
      if (!authHeader) {
        return { error: 'No authorization header' };
      }

      const token = authHeader.replace('Bearer ', '');
      console.log('Debug: Token received:', token.substring(0, 20) + '...');

      // Test token verification
      const sessionToken = await this.clerkService.verifyToken(token);
      console.log('Debug: Session token:', sessionToken);

      // Test user retrieval
      const user = await this.clerkService.getUser(sessionToken.sub);
      console.log('Debug: User retrieved:', user ? 'Yes' : 'No');

      return {
        success: true,
        sessionToken,
        user: user
          ? {
              id: user.id,
              email: user.emailAddresses?.[0]?.emailAddress,
              firstName: user.firstName,
              lastName: user.lastName,
            }
          : null,
      };
    } catch (error) {
      console.error('Debug error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
