import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ClerkService } from './clerk.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private clerkService: ClerkService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    const token = this.extractTokenFromHeader(request);

    // If no token is provided, allow the request to continue without authentication
    if (!token) {
      return true;
    }

    try {
      const sessionToken = await this.clerkService.verifyToken(token);

      if (!sessionToken.sub) {
        // Invalid token, but don't throw error - just continue without user
        return true;
      }

      const clerkUser = await this.clerkService.getUser(sessionToken.sub);

      if (!clerkUser) {
        // User not found, but don't throw error - just continue without user
        return true;
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
      // If there's any error with authentication, don't throw - just continue without user
      console.log(
        'Optional auth guard - continuing without user:',
        error.message,
      );
      return true;
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async syncUserToDatabase(clerkUser: any) {
    try {
      // Check if user exists in database
      let dbUser = await this.prisma.user.findUnique({
        where: { clerkId: clerkUser.id },
      });

      if (!dbUser) {
        // Create new user if doesn't exist
        dbUser = await this.prisma.user.create({
          data: {
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            firstName: clerkUser.firstName || '',
            lastName: clerkUser.lastName || '',
            profileImage: clerkUser.profileImageUrl || null,
            role: 'STUDENT',
          },
        });
      } else {
        // Update existing user with latest info from Clerk
        dbUser = await this.prisma.user.update({
          where: { id: dbUser.id },
          data: {
            email: clerkUser.emailAddresses[0]?.emailAddress || dbUser.email,
            firstName: clerkUser.firstName || dbUser.firstName,
            lastName: clerkUser.lastName || dbUser.lastName,
            profileImage: clerkUser.profileImageUrl || dbUser.profileImage,
          },
        });
      }

      return dbUser;
    } catch (error) {
      console.error('Error syncing user to database:', error);
      throw error;
    }
  }
}
