import { Injectable } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ClerkService {
  private clerkClient;

  constructor() {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error('CLERK_SECRET_KEY is not configured');
      throw new Error('CLERK_SECRET_KEY is required');
    }

    this.clerkClient = createClerkClient({
      secretKey: secretKey,
    });

    console.log('Clerk client initialized successfully');
  }

  async verifyToken(token: string) {
    console.log('Verifying token...');
    try {
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (!secretKey) {
        throw new Error('CLERK_SECRET_KEY is not configured');
      }

      try {
        const { sub } = await verifyToken(token, {
          secretKey: secretKey,
        });

        console.log('Token verified successfully, user ID:', sub);

        if (!sub) {
          throw new Error('No user ID found in token');
        }

        // Token is valid
        return { sub } as { sub: string };
      } catch (err) {
        console.error('Token verification failed:', err);
        throw new Error('Invalid token');
      }
    } catch (error) {
      console.error('Error in verifyToken:', error);
      throw new Error('Invalid token');
    }
  }

  async getUser(userId: string) {
    try {
      console.log('Finding user with ID:', userId);

      if (!userId) {
        throw new Error('User ID is required');
      }

      if (!this.clerkClient) {
        throw new Error('Clerk client not initialized');
      }

      console.log('Calling Clerk API to get user...');
      const user = await this.clerkClient.users.getUser(userId);
      console.log('User found:', user ? 'Yes' : 'No', user?.id);

      if (!user) {
        throw new Error('User not found in Clerk');
      }

      return user;
    } catch (error) {
      console.error('Error in getUser:', error);

      if (error instanceof Error) {
        throw new Error(`Failed to get user: ${error.message}`);
      }

      throw new Error('User not found');
    }
  }

  async updateUserMetadata(userId: string, metadata: any) {
    try {
      const user = await this.clerkClient.users.updateUser(userId, {
        publicMetadata: metadata,
      });
      return user;
    } catch (error) {
      throw new Error('Failed to update user metadata');
    }
  }
}
