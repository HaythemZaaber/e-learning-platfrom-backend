import { Injectable } from '@nestjs/common';
import { createClerkClient, verifyToken } from '@clerk/backend';
import * as jwt from 'jsonwebtoken';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

@Injectable()
export class ClerkService {
  async verifyToken(token: string) {
    try {
      const publicKey = process.env.CLERK_PEM_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('Clerk PEM public key not configured');
      }
      //   // Verify and decode the JWT
      //   const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as any;
      //   // Return the user ID (sub)
      //   return { sub: decoded.sub || decoded.userId };

      try {
        const { sessionId, userId, getToken } = await verifyToken(token, {
          secretKey: process.env.CLERK_API_KEY, // optional if your env is already configured
        });

        // Token is valid
        return { sub: userId } as { sub: string };

      } catch (err) {
        throw new Error('Invalid token');
      }
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async getUser(userId: string) {
    try {
      const user = await clerkClient.users.getUser(userId);
      return user;
    } catch (error) {
      throw new Error('User not found');
    }
  }

  async updateUserMetadata(userId: string, metadata: any) {
    try {
      const user = await clerkClient.users.updateUser(userId, {
        publicMetadata: metadata,
      });
      return user;
    } catch (error) {
      throw new Error('Failed to update user metadata');
    }
  }
}
