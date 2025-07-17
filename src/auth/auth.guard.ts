import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ClerkService } from './clerk.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private clerkService: ClerkService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      const sessionToken = await this.clerkService.verifyToken(token);
      const user = await this.clerkService.getUser(sessionToken.sub);

      // Add user info to request context
      request.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        role: user.publicMetadata?.role || 'VISITOR',
        ...user.publicMetadata,
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
