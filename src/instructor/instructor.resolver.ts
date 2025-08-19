import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { InstructorService } from './instructor.service';
import { GetUser } from '../auth/get-user.decorator';

// Import GraphQL types
import {
  InstructorProfile,
  InstructorStats,
  InstructorSearchResponse,
} from './entities/instructor.entity';

import {
  UpdateInstructorProfileInput,
  InstructorSearchFiltersInput,
  CreateInstructorProfileInput,
} from './dto/instructor.dto';

@Resolver(() => InstructorProfile)
@UseGuards(AuthGuard, RolesGuard)
export class InstructorResolver {
  constructor(
    private instructorService: InstructorService,
  ) {}

  // =============================================================================
  // INSTRUCTOR PROFILE QUERIES
  // =============================================================================

  @Query(() => InstructorProfile, { name: 'getInstructorProfile' })
  async getInstructorProfile(@Args('userId') userId: string) {
    try {
      return await this.instructorService.getInstructorProfile(userId);
    } catch (error) {
      throw new Error(`Failed to get instructor profile: ${error.message}`);
    }
  }

  @Query(() => InstructorProfile, { name: 'getMyInstructorProfile' })
  async getMyInstructorProfile(@GetUser() user: any) {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      return await this.instructorService.getInstructorProfile(user.id);
    } catch (error) {
      throw new Error(`Failed to get my instructor profile: ${error.message}`);
    }
  }

  // =============================================================================
  // INSTRUCTOR STATISTICS QUERIES
  // =============================================================================

  @Query(() => InstructorStats, { name: 'getInstructorStats' })
  async getInstructorStats(@Args('userId') userId: string) {
    try {
      return await this.instructorService.getInstructorStats(userId);
    } catch (error) {
      throw new Error(`Failed to get instructor stats: ${error.message}`);
    }
  }

  @Query(() => InstructorStats, { name: 'getMyInstructorStats' })
  async getMyInstructorStats(@GetUser() user: any) {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      return await this.instructorService.getInstructorStats(user.id);
    } catch (error) {
      throw new Error(`Failed to get my instructor stats: ${error.message}`);
    }
  }

  // =============================================================================
  // INSTRUCTOR SEARCH QUERIES
  // =============================================================================

  @Query(() => InstructorSearchResponse, { name: 'searchInstructors' })
  async searchInstructors(@Args('filters', { nullable: true }) filters?: InstructorSearchFiltersInput) {
    try {
      const instructors = await this.instructorService.searchInstructors(filters);
      return {
        instructors,
        total: instructors.length,
        hasMore: instructors.length === (filters?.limit || 20),
      };
    } catch (error) {
      throw new Error(`Failed to search instructors: ${error.message}`);
    }
  }

  // =============================================================================
  // INSTRUCTOR PROFILE MUTATIONS
  // =============================================================================

  @Mutation(() => InstructorProfile, { name: 'updateInstructorProfile' })
  @Roles(UserRole.INSTRUCTOR)
  async updateInstructorProfile(
    @Args('input') input: UpdateInstructorProfileInput,
    @GetUser() user: any,
  ) {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      return await this.instructorService.updateProfile(user.id, input);
    } catch (error) {
      throw new Error(`Failed to update instructor profile: ${error.message}`);
    }
  }

  @Mutation(() => InstructorProfile, { name: 'updateInstructorProfileByUserId' })
  @Roles(UserRole.ADMIN)
  async updateInstructorProfileByUserId(
    @Args('userId') userId: string,
    @Args('input') input: UpdateInstructorProfileInput,
  ) {
    try {
      return await this.instructorService.updateProfile(userId, input);
    } catch (error) {
      throw new Error(`Failed to update instructor profile: ${error.message}`);
    }
  }

  @Mutation(() => InstructorProfile, { name: 'deleteInstructorProfile' })
  @Roles(UserRole.ADMIN)
  async deleteInstructorProfile(@Args('userId') userId: string) {
    try {
      await this.instructorService.deleteInstructorProfile(userId);
      return { success: true, message: 'Instructor profile deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete instructor profile: ${error.message}`);
    }
  }

  // =============================================================================
  // INSTRUCTOR PROFILE CREATION (Called from verification service)
  // =============================================================================

  @Mutation(() => InstructorProfile, { name: 'createInstructorProfile' })
  @Roles(UserRole.ADMIN)
  async createInstructorProfile(
    @Args('input') input: CreateInstructorProfileInput,
  ) {
    try {
      return await this.instructorService.createInstructorProfile(input.userId, input.applicationData);
    } catch (error) {
      throw new Error(`Failed to create instructor profile: ${error.message}`);
    }
  }
}
