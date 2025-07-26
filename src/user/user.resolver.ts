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
  async getCurrentUser(@Context() context: any): Promise<User | null> {
    const clerkId = context.req.user.id;
    return this.userService.findByClerkId(clerkId);
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
