import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { Course, CourseCreationResponse } from './entities/course.entity';
import {
  CreateCourseInput,
  UpdateCourseInput,
  SaveCourseDraftInput,
  CourseFiltersInput,
  CourseDraftResponse,
} from './dto/course-creation.dto';
import { AuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, ContentType } from '../../generated/prisma';

@Resolver(() => Course)
@UseGuards(AuthGuard, RolesGuard)
export class CourseResolver {
  constructor(private courseService: CourseService) {}

  // ============================================
  // COMPREHENSIVE COURSE CREATION
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

  // ============================================
  // DRAFT MANAGEMENT
  // ============================================

  @Mutation(() => CourseDraftResponse, { name: 'saveCourseDraft' })
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async saveCourseDraft(
    @Args('input') input: SaveCourseDraftInput,
    @Context() context: any,
  ): Promise<CourseDraftResponse> {
    const user = context.req.user;
    return this.courseService.saveCourseDraft(user.id, input);
  }

  @Query(() => CourseDraftResponse, { name: 'getCourseDraft' })
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getCourseDraft(@Context() context: any): Promise<CourseDraftResponse> {
    const user = context.req.user;
    return this.courseService.getCourseDraft(user.id);
  }

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async deleteCourseDraft(
    @Context() context: any,
  ): Promise<{ success: boolean; message: string }> {
    const user = context.req.user;
    return this.courseService.deleteCourseDraft(user.id);
  }

  // ============================================
  // CONTENT MANAGEMENT
  // ============================================

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createTextContent(
    @Args('courseId') courseId: string,
    @Args('title') title: string,
    @Args('content') content: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('lessonId', { nullable: true }) lessonId?: string,
    @Args('order', { nullable: true }) order?: number,
    @Context() context?: any,
  ) {
    const user = context.req.user;
    return this.courseService.createTextContent(courseId, user.id, {
      title,
      content,
      description,
      lessonId,
      order,
    });
  }

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createAssignment(
    @Args('courseId') courseId: string,
    @Args('title') title: string,
    @Args('description') description: string,
    @Args('instructions', { nullable: true }) instructions?: string,
    @Args('dueDate', { nullable: true }) dueDate?: string,
    @Args('points', { nullable: true }) points?: number,
    @Args('lessonId', { nullable: true }) lessonId?: string,
    @Args('order', { nullable: true }) order?: number,
    @Context() context?: any,
  ) {
    const user = context.req.user;
    return this.courseService.createAssignment(courseId, user.id, {
      title,
      description,
      instructions,
      dueDate,
      points,
      lessonId,
      order,
    });
  }

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async createResourceLink(
    @Args('courseId') courseId: string,
    @Args('title') title: string,
    @Args('url') url: string,
    @Args('resourceType') resourceType: string,
    @Args('description', { nullable: true }) description?: string,
    @Args('lessonId', { nullable: true }) lessonId?: string,
    @Args('order', { nullable: true }) order?: number,
    @Context() context?: any,
  ) {
    const user = context.req.user;
    return this.courseService.createResourceLink(courseId, user.id, {
      title,
      url,
      description,
      resourceType,
      lessonId,
      order,
    });
  }

  // ============================================
  // COURSE MANAGEMENT
  // ============================================

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateCourse(
    @Args('courseId') courseId: string,
    @Args('input') input: UpdateCourseInput,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    return this.courseService.updateCourse(courseId, user.id, input);
  }

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async publishCourse(
    @Args('courseId') courseId: string,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    return this.courseService.publishCourse(courseId, user.id);
  }

  // ============================================
  // COURSE QUERIES
  // ============================================

  @Query(() => Course)
  async getCourse(
    @Args('courseId') courseId: string,
    @Context() context?: any,
  ) {
    const user = context?.req?.user;
    return this.courseService.getCourseWithContent(courseId, user?.id);
  }

  @Query(() => [Course])
  async getCourses(
    @Args('filters', { nullable: true }) filters?: CourseFiltersInput,
  ) {
    // Implementation for getting courses with filters
    // This would include pagination, search, filtering logic
    return [];
  }

  @Query(() => [Course])
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getMyCourses(@Context() context: any) {
    const user = context.req.user;
    // Implementation for getting instructor's courses
    return [];
  }
}
