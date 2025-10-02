import { Resolver, Query, Mutation, Args, Context, Int } from '@nestjs/graphql';
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
  ProfileImageUpdateResponse,
  FeaturedInstructorsResponse,
  InstructorListResponse,
  InstructorHeroStats,
} from './entities/instructor.entity';

import {
  UpdateInstructorProfileInput,
  UpdateProfileImageInput,
  InstructorSearchFiltersInput,
  CreateInstructorProfileInput,
  InstructorListFiltersInput,
} from './dto/instructor.dto';


@Resolver(() => InstructorProfile)
export class InstructorResolver {
  constructor(
    private instructorService: InstructorService,
  ) {}

  // =============================================================================
  // LANDING PAGE QUERIES
  // =============================================================================

  @Query(() => FeaturedInstructorsResponse, { name: 'getFeaturedInstructors' })
  async getFeaturedInstructors(@Args('limit', { nullable: true, type: () => Int }) limit?: number) {
    try {
      return await this.instructorService.getFeaturedInstructors(limit || 6);
    } catch (error) {
      throw new Error(`Failed to get featured instructors: ${error.message}`);
    }
  }

  @Query(() => InstructorHeroStats, { name: 'getInstructorHeroStats' })
  async getInstructorHeroStats() {
    try {
      return await this.instructorService.getInstructorHeroStats();
    } catch (error) {
      throw new Error(`Failed to get instructor hero stats: ${error.message}`);
    }
  }

  // =============================================================================
  // INSTRUCTORS PAGE QUERIES
  // =============================================================================

  @Query(() => InstructorListResponse, { name: 'getInstructorsList' })
  async getInstructorsList(
    @Args('filters', { nullable: true }) filters?: InstructorListFiltersInput,
    @Args('page', { nullable: true, type: () => Int }) page?: number,
    @Args('limit', { nullable: true, type: () => Int }) limit?: number,
    @Args('sortBy', { nullable: true }) sortBy?: string,
  ) {
    try {
      return await this.instructorService.getInstructorsList(filters, page || 1, limit || 6, sortBy);
    } catch (error) {
      throw new Error(`Failed to get instructors list: ${error.message}`);
    }
  }

  @Query(() => [InstructorProfile], { name: 'getAvailableTodayInstructors' })
  async getAvailableTodayInstructors(@Args('limit', { nullable: true, type: () => Int }) limit?: number) {
    try {
      return await this.instructorService.getAvailableTodayInstructors(limit || 10);
    } catch (error) {
      throw new Error(`Failed to get available today instructors: ${error.message}`);
    }
  }

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
  @UseGuards(AuthGuard, RolesGuard)
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

  @Mutation(() => ProfileImageUpdateResponse, { name: 'updateProfileImage' })
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(UserRole.INSTRUCTOR)
  async updateProfileImage(
    @Args('input') input: UpdateProfileImageInput,
    @GetUser() user: any,
  ) {
    try {
      if (!user || !user.id) {
        throw new Error('User not authenticated');
      }
      const result = await this.instructorService.updateProfileImage(user.id, input.profileImage);
      return {
        success: true,
        message: 'Profile image updated successfully',
        profileImage: result.profileImage,
      };
    } catch (error) {
      throw new Error(`Failed to update profile image: ${error.message}`);
    }
  }

  @Mutation(() => InstructorProfile, { name: 'updateInstructorProfileByUserId' })
  @UseGuards(AuthGuard, RolesGuard)
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
  @UseGuards(AuthGuard, RolesGuard)
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
  @UseGuards(AuthGuard, RolesGuard)
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
