import { Resolver, Mutation, Query, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import {
  Course,
  CourseCreationResponse,
  CourseShareResponse,
} from './entities/course.entity';
import {
  CreateCourseInput,
  UpdateCourseInput,
  UpdateCourseBasicInfoInput,
  UpdateCourseSettingsInput,
  SaveCourseDraftInput,
  CourseFiltersInput,
  CourseDraftResponse,
  PaginationInput,
  PaginatedCoursesResponse,
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
  // COMPREHENSIVE COURSE CREATION
  // ============================================

  @Mutation(() => CourseCreationResponse, { name: 'createCourse' })
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
    @Args('lectureId', { nullable: true }) lectureId?: string,
    @Args('order', { nullable: true }) order?: number,
    @Context() context?: any,
  ) {
    const user = context.req.user;
    return this.courseService.createTextContent(courseId, user.id, {
      title,
      content,
      description,
      lectureId,
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
    @Args('lectureId', { nullable: true }) lectureId?: string,
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
      lectureId,
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
    @Args('lectureId', { nullable: true }) lectureId?: string,
    @Args('order', { nullable: true }) order?: number,
    @Context() context?: any,
  ) {
    const user = context.req.user;
    return this.courseService.createResourceLink(courseId, user.id, {
      title,
      url,
      description,
      resourceType,
      lectureId,
      order,
    });
  }

  // ============================================
  // COURSE MANAGEMENT
  // ============================================

  @Mutation(() => CourseCreationResponse, { name: 'updateCourse' })
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
  async updateCourseBasicInfo(
    @Args('courseId') courseId: string,
    @Args('basicInfo', { type: () => UpdateCourseBasicInfoInput })
    basicInfo: UpdateCourseBasicInfoInput,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    return this.courseService.updateCourseBasicInfo(
      courseId,
      user.id,
      basicInfo,
    );
  }

  @Mutation(() => CourseCreationResponse)
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async updateCourseSettings(
    @Args('courseId') courseId: string,
    @Args('settings', { type: () => UpdateCourseSettingsInput })
    settings: UpdateCourseSettingsInput,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    return this.courseService.updateCourseSettings(courseId, user.id, settings);
  }

  @Mutation(() => CourseCreationResponse, { name: 'publishCourse' })
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async publishCourse(
    @Args('courseId') courseId: string,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    return this.courseService.publishCourse(courseId, user.id);
  }

  @Mutation(() => CourseCreationResponse, { name: 'unpublishCourse' })
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async unpublishCourse(
    @Args('courseId') courseId: string,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    return this.courseService.unpublishCourse(courseId, user.id);
  }

  @Mutation(() => CourseCreationResponse, { name: 'deleteCourse' })
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async deleteCourse(
    @Args('courseId') courseId: string,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    const result = await this.courseService.deleteCourse(courseId, user.id);
    return {
      success: result.success,
      message: result.message,
      course: undefined,
      completionPercentage: 0,
      errors: [],
    };
  }

  @Mutation(() => CourseCreationResponse, { name: 'duplicateCourse' })
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async duplicateCourse(
    @Args('courseId') courseId: string,
    @Context() context: any,
  ): Promise<CourseCreationResponse> {
    const user = context.req.user;
    const result = await this.courseService.duplicateCourse(courseId, user.id);

    return {
      success: result.success,
      message: result.message,
      course: undefined,
      completionPercentage: 0,
      errors: [],
    };
  }

  // ============================================
  // COURSE SOCIAL MEDIA SHARING
  // ============================================

  @Query(() => CourseShareResponse, { name: 'getCourseShareLinks' })
  async getCourseShareLinks(
    @Args('courseId') courseId: string,
    @Context() context?: any,
  ): Promise<CourseShareResponse> {
    const user = context?.req?.user;
    const result = await this.courseService.getCourseShareLinks(
      courseId,
      user?.id,
    );

    return {
      success: result.success,
      message: result.message,
      shareData: result.shareData
        ? {
            courseUrl: result.shareData.courseUrl,
            socialLinks: {
              facebook: result.shareData.socialLinks.facebook,
              twitter: result.shareData.socialLinks.twitter,
              linkedin: result.shareData.socialLinks.linkedin,
              whatsapp: result.shareData.socialLinks.whatsapp,
              telegram: result.shareData.socialLinks.telegram,
              email: result.shareData.socialLinks.email,
            },
            embedCode: result.shareData.embedCode,
            qrCode: result.shareData.qrCode,
          }
        : undefined,
      errors: result.errors,
    };
  }

  @Query(() => CourseShareResponse, { name: 'copyCourseShareLink' })
  async copyCourseShareLink(
    @Args('courseId') courseId: string,
    @Context() context?: any,
  ): Promise<CourseShareResponse> {
    const user = context?.req?.user;
    const result = await this.courseService.copyCourseShareLink(
      courseId,
      user?.id,
    );

    return {
      success: result.success,
      message: result.message,
      shareData: result.shareUrl
        ? {
            courseUrl: result.shareUrl,
            socialLinks: {
              facebook: '',
              twitter: '',
              linkedin: '',
              whatsapp: '',
              telegram: '',
              email: '',
            },
            embedCode: '',
          }
        : undefined,
      errors: result.errors,
    };
  }

  @Query(() => CourseShareResponse, { name: 'generateCourseQRCode' })
  async generateCourseQRCode(
    @Args('courseId') courseId: string,
    @Context() context?: any,
  ): Promise<CourseShareResponse> {
    const user = context?.req?.user;
    const result = await this.courseService.generateCourseQRCode(
      courseId,
      user?.id,
    );

    return {
      success: result.success,
      message: result.message,
      shareData: result.qrCodeUrl
        ? {
            courseUrl: '',
            socialLinks: {
              facebook: '',
              twitter: '',
              linkedin: '',
              whatsapp: '',
              telegram: '',
              email: '',
            },
            embedCode: '',
            qrCode: result.qrCodeUrl,
          }
        : undefined,
      errors: result.errors,
    };
  }

  // ============================================
  // COURSE QUERIES
  // ============================================

  @Query(() => Course, { name: 'getCourse' })
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
    return this.courseService.getCourses(filters);
  }

  @Query(() => PaginatedCoursesResponse, { name: 'getAllCourses' })
  async getAllCourses(
    @Args('filters', { nullable: true }) filters?: CourseFiltersInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ) {
    return this.courseService.getAllCourses(filters, pagination);
  }

  @Query(() => [Course], { name: 'getMyCourses' })
  @Roles(UserRole.INSTRUCTOR, UserRole.ADMIN)
  async getMyCourses(@Context() context: any) {
    const user = context.req.user;
    return this.courseService.getMyCourses(user.id);
  }

  @Query(() => [Course], { name: 'getFeaturedCourses' })
  async getFeaturedCourses(
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.courseService.getFeaturedCourses(limit);
  }

  @Query(() => [Course], { name: 'getTrendingCourses' })
  async getTrendingCourses(
    @Args('limit', { nullable: true }) limit?: number,
  ) {
    return this.courseService.getTrendingCourses(limit);
  }
}
