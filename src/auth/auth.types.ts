import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    clerkId: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

