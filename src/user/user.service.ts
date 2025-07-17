import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '../../generated/prisma';


@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async createUser(data: {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role || UserRole.VISITOR,
      },
    });
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { clerkId },
    });
  }

  async updateUserRole(clerkId: string, role: UserRole): Promise<User> {
    return this.prisma.user.update({
      where: { clerkId },
      data: { role },
    });
  }

  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
}
