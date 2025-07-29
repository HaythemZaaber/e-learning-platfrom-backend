import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ClerkService } from './clerk.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private clerkService: ClerkService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    

    try {
      const sessionToken = await this.clerkService.verifyToken(token);
      console.log('Session token:', sessionToken);
      console.log('User ID from session:', sessionToken.sub);

      if (!sessionToken.sub) {
        throw new UnauthorizedException('No user ID in session token');
      }

      const clerkUser = await this.clerkService.getUser(sessionToken.sub);
      console.log('User retrieved:', clerkUser ? 'Yes' : 'No', clerkUser?.id);

      if (!clerkUser) {
        throw new UnauthorizedException('User not found');
      }

      const dbUser = await this.syncUserToDatabase(clerkUser);

      // Add user info to request context
      request.user = {
        id: dbUser.id,
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        role: dbUser.role || 'STUDENT',
        ...clerkUser.publicMetadata,
      };

      return true;
    } catch (error) {
      console.error('Auth guard error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async syncUserToDatabase(clerkUser: any) {
    // Check if user exists
    let dbUser = await this.prisma.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    if (!dbUser) {
      // Create user if doesn't exist
      dbUser = await this.prisma.user.create({
        data: {
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          role: clerkUser.publicMetadata?.role || 'STUDENT',
          instructorStatus:
            clerkUser.publicMetadata?.instructorStatus || 'NOT_APPLIED',
          isEmailVerified: true,
          isActive: true,
        },
      });
    }

    return dbUser;
  }
}
