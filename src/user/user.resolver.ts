import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserService } from './user.service';
import { UserRole, User } from '@prisma/client';
import { UserObject } from './user.entity';

@Resolver(() => UserObject)
@UseGuards(AuthGuard, RolesGuard)
export class UserResolver {
  constructor(private userService: UserService) {}

  @Query(() => UserObject, { name: 'me', nullable: true })
  async getCurrentUser(@Context() context: any): Promise<UserObject | null> {
    const clerkId = context.req.user.clerkId;

    const user = await this.userService.findByClerkId(clerkId);
    if (!user) {
      throw new Error('User not found');
    }
    console.log('userrrrr', user);

    const userObject: UserObject = {
      id: user.id,
      email: user.email,
      firstName: user.firstName || undefined,
      lastName: user.lastName || undefined,
      profileImage: user.profileImage || undefined,
      role: user.role,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
      clerkId: user.clerkId,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      instructorStatus: user.instructorStatus,
      expertise: user.expertise,
      qualifications: user.qualifications,
      preferredLanguages: user.preferredLanguages,
      skillTags: user.skillTags,
      isActive: user.isActive,
      totalPoints: user.totalPoints,
      totalCourses: user.totalCourses || undefined,
      totalStudents: user.totalStudents || undefined,
      rating: user.rating || undefined,
      lastLoginAt: user.lastLoginAt || undefined,
      currentStreak: user.currentStreak || 0,
      longestStreak: user.longestStreak || 0,
      achievements: user.achievements || [],
    };
    return userObject;
  }

  @Query(() => [UserObject], { name: 'users' })
  @Roles(UserRole.ADMIN)
  async getAllUsers(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Mutation(() => UserObject, { name: 'updateUserRole' })
  @Roles(UserRole.ADMIN)
  async updateUserRole(
    @Args('clerkId') clerkId: string,
    @Args('role') role: UserRole,
  ): Promise<User> {
    return this.userService.updateUserRole(clerkId, role);
  }
}
