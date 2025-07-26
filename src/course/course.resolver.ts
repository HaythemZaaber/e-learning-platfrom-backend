import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
// Remove GraphQL upload imports for now - use REST uploads instead
// import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { CourseService } from './course.service';
import { Course, CourseCreationResponse } from './entities/course.entity';
import {
  CreateCourseInput,
  UpdateCourseInput,
  CourseFiltersInput,
} from './dto/course-creation.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../../generated/prisma';

@Resolver(() => Course)
@UseGuards(AuthGuard, RolesGuard)
export class CourseResolver {
  constructor(private courseService: CourseService) {}

  // ============================================
  // COURSE CREATION MUTATIONS
  // ============================================

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createCourse(
    @Args('input') input: CreateCourseInput,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    return this.courseService.createCourse(user.id, input);
  }

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createCourseWithBasicInfo(
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('category') category: string,
    @Args('level') level: string,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    return this.courseService.createCourseWithBasicInfo(user.id, {
      title,
      description,
      category,
      level,
    });
  }

  // @Mutation(() => CourseCreationResponse)
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async updateCourse(
  //   @Args('courseId') courseId: string,
  //   @Args('input') input: UpdateCourseInput,
  //   @Context('user') user: any,
  // ): Promise<CourseCreationResponse> {
  //   return this.courseService.updateCourse(courseId, user.id, input);
  // }

  // // ============================================
  // // FILE URL UPDATE MUTATIONS (No direct file upload)
  // // Use REST /upload endpoint for files, then update course with URLs
  // // ============================================

  // @Mutation(() => CourseCreationResponse)
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async updateCourseThumbnail(
  //   @Args('courseId') courseId: string,
  //   @Args('thumbnailUrl') thumbnailUrl: string,
  //   @Context('user') user: any,
  // ): Promise<CourseCreationResponse> {
  //   // Update course with thumbnail URL (after uploading via REST)
  //   return this.courseService.updateCourse(courseId, user.id, {
  //     thumbnail: thumbnailUrl,
  //   });
  // }

  // @Mutation(() => CourseCreationResponse)
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async updateCourseTrailer(
  //   @Args('courseId') courseId: string,
  //   @Args('trailerUrl') trailerUrl: string,
  //   @Context('user') user: any,
  // ): Promise<CourseCreationResponse> {
  //   // Update course with trailer URL (after uploading via REST)
  //   return this.courseService.updateCourse(courseId, user.id, {
  //     trailer: trailerUrl,
  //   });
  // }

  // // ============================================
  // // COURSE STATUS MUTATIONS
  // // ============================================

  // @Mutation(() => CourseCreationResponse)
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async saveCourseAsDraft(
  //   @Args('courseId') courseId: string,
  //   @Context('user') user: any,
  // ): Promise<CourseCreationResponse> {
  //   return this.courseService.saveCourseAsDraft(courseId, user.id);
  // }

  // @Mutation(() => CourseCreationResponse)
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async submitCourseForReview(
  //   @Args('courseId') courseId: string,
  //   @Context('user') user: any,
  // ): Promise<CourseCreationResponse> {
  //   return this.courseService.submitCourseForReview(courseId, user.id);
  // }

  // @Mutation(() => CourseCreationResponse)
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async publishCourse(
  //   @Args('courseId') courseId: string,
  //   @Context('user') user: any,
  // ): Promise<CourseCreationResponse> {
  //   return this.courseService.publishCourse(courseId, user.id);
  // }

  // @Mutation(() => CourseCreationResponse)
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async deleteCourse(
  //   @Args('courseId') courseId: string,
  //   @Context('user') user: any,
  // ): Promise<CourseCreationResponse> {
  //   return this.courseService.deleteCourse(courseId, user.id);
  // }

  // // ============================================
  // // QUERIES
  // // ============================================

  // @Query(() => Course, { nullable: true })
  // async getCourse(
  //   @Args('courseId') courseId: string,
  //   @Args('includeUnpublished', { defaultValue: false })
  //   includeUnpublished: boolean,
  // ): Promise<Course | null> {
  //   try {
  //     return await this.courseService.getCourseById(
  //       courseId,
  //       includeUnpublished,
  //     );
  //   } catch (error) {
  //     return null;
  //   }
  // }

  // @Query(() => [Course])
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async getInstructorCourses(
  //   @Args('filters', { nullable: true }) filters: CourseFiltersInput,
  //   @Context('user') user: any,
  // ): Promise<Course[]> {
  //   return this.courseService.getInstructorCourses(user.id, filters);
  // }

  // @Query(() => CourseCreationResponse)
  // @UseGuards(RolesGuard)
  // @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  // async validateCourse(
  //   @Args('courseId') courseId: string,
  //   @Context('user') user: any,
  // ): Promise<CourseCreationResponse> {
  //   return this.courseService.validateCourseForPublication(courseId, user.id);
  // }

  // // ============================================
  // // UTILITY QUERIES
  // // ============================================

  // @Query(() => [String])
  // getAvailableCategories(): string[] {
  //   return [
  //     'Programming',
  //     'Web Development',
  //     'Mobile Development',
  //     'Data Science',
  //     'Machine Learning',
  //     'Design',
  //     'Marketing',
  //     'Business',
  //     'Photography',
  //     'Music',
  //     'Language',
  //     'Health & Fitness',
  //     'Personal Development',
  //     'Other',
  //   ];
  // }

  // @Query(() => [String])
  // getAvailableLevels(): string[] {
  //   return ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'ALL_LEVELS'];
  // }
}
