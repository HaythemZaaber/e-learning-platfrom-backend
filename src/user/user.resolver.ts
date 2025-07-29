import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserService } from './user.service';
import { UserRole, User } from '../../generated/prisma';
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
