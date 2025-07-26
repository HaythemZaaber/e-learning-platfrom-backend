import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, UserRole } from '../../generated/prisma';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async createUser(data: {
    clerkId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    profileImage?: string;
  }): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.findByClerkId(data.clerkId);
      if (existingUser) {
        this.logger.warn(`User with clerkId ${data.clerkId} already exists`);
        return existingUser;
      }

      const user = await this.prisma.user.create({
        data: {
          ...data,
          role: data.role || UserRole.STUDENT,
        },
      });

      this.logger.log(`User created: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async findByClerkId(clerkId: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { clerkId },
      });
    } catch (error) {
      this.logger.error('Error finding user by clerkId:', error);
      throw error;
    }
  }

  async updateUser(
    clerkId: string,
    data: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: UserRole;
    },
  ): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { clerkId },
        data,
      });

      this.logger.log(`User updated: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw error;
    }
  }

  async updateUserRole(clerkId: string, role: UserRole): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: { clerkId },
        data: { role },
      });

      this.logger.log(`User role updated: ${user.email} -> ${role}`);
      return user;
    } catch (error) {
      this.logger.error('Error updating user role:', error);
      throw error;
    }
  }

  async deleteUser(clerkId: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { clerkId },
      });

      this.logger.log(`User deleted: ${clerkId}`);
    } catch (error) {
      this.logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    try {
      return await this.prisma.user.findMany();
    } catch (error) {
      this.logger.error('Error finding all users:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      return await this.prisma.user.findUnique({
        where: { email },
      });
    } catch (error) {
      this.logger.error('Error finding user by email:', error);
      throw error;
    }
  }
}
