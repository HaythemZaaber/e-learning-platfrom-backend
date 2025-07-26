import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateCourseInput,
  UpdateCourseInput,
  CourseFiltersInput,
} from './dto/course-creation.dto';
import {
  CourseStatus,
  UserRole,
  InstructorStatus,
  EnrollmentType,
  CourseLevel,
  Prisma,
} from '../../generated/prisma';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CourseService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  // ============================================
  // COURSE CREATION METHODS
  // ============================================

  private convertNullsToUndefined<T>(obj: T): T {
    if (obj === null) return undefined as T;
    if (obj === undefined) return obj;

    if (Array.isArray(obj)) {
      return obj.map((item) => this.convertNullsToUndefined(item)) as T;
    }

    if (typeof obj === 'object' && obj !== null) {
      const result = {} as T;
      for (const [key, value] of Object.entries(obj)) {
        (result as any)[key] = this.convertNullsToUndefined(value);
      }
      return result;
    }

    return obj;
  }

  async createCourse(instructorId: string, input: CreateCourseInput) {
    try {
      // Verify instructor permissions
      await this.verifyInstructorPermissions(instructorId);

      // Validate and sanitize input
      const sanitizedInput = this.sanitizeCourseInput(input);

      // Validate pricing logic
      // this.validatePricing(
      //   sanitizedInput.price,
      //   sanitizedInput.originalPrice,
      //   sanitizedInput.enrollmentType,
      // );

      // Create course with comprehensive data
      const course = await this.prisma.course.create({
        data: {
          ...sanitizedInput,
          instructorId,
          status: CourseStatus.DRAFT,
          accessibility: {
            captions: false,
            transcripts: false,
            audioDescription: false,
            signLanguage: false,
          },
          views: 0,
          avgRating: 0,
          totalRatings: 0,
        },
        include: this.getCourseIncludeOptions(),
      });

      // Convert null values to undefined for GraphQL compatibility
      const courseWithUndefined = this.convertNullsToUndefined(course);

      return {
        success: true,
        message:
          'Course created successfully. You can now add content and customize your course.',
        course: courseWithUndefined,
        nextSteps: [
          'Add course thumbnail',
          'Create course sections',
          'Add lessons to sections',
          'Set pricing (if paid)',
          'Submit for review',
        ],
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create course: ${error.message}`,
      );
    }
  }

  async createCourseWithBasicInfo(
    instructorId: string,
    basicInfo: {
      title: string;
      description: string;
      category: string;
      level: string;
    },
  ) {
    try {
      await this.verifyInstructorPermissions(instructorId);

      // Create minimal course for quick start
      const course = await this.prisma.course.create({
        data: {
          title: basicInfo.title.trim(),
          description: basicInfo.description.trim(),
          category: basicInfo.category,
          level: basicInfo.level as CourseLevel,
          instructorId,
          status: CourseStatus.DRAFT,
          enrollmentType: EnrollmentType.FREE,
          price: 0,
          objectives: [],
          prerequisites: [],
          whatYouLearn: [],
          seoTags: [],
          marketingTags: [],
          accessibility: {
            captions: false,
            transcripts: false,
            audioDescription: false,
            signLanguage: false,
          },
        },
        include: this.getCourseIncludeOptions(),
      });

      // Convert null values to undefined for GraphQL compatibility
      const courseWithUndefined = this.convertNullsToUndefined(course);

      return {
        success: true,
        message: 'Course created successfully! Continue building your course.',
        course: courseWithUndefined,
        isBasicVersion: true,
        completionPercentage:
          this.calculateCourseCompletionPercentage(courseWithUndefined),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create course: ${error.message}`,
      );
    }
  }

  async updateCourse(
    courseId: string,
    instructorId: string,
    input: UpdateCourseInput,
  ) {
    try {
      // Verify ownership
      const course = await this.verifyCourseOwnership(courseId, instructorId);

      // Validate pricing if provided
      if (input.price !== undefined || input.originalPrice !== undefined) {
        this.validatePricing(
          input.price ?? course.price,
          input.originalPrice,
          input.enrollmentType ?? course.enrollmentType,
        );
      }

      // Sanitize input
      const sanitizedInput = this.sanitizeUpdateInput(input);

      const updatedCourse = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          ...sanitizedInput,
          updatedAt: new Date(),
        },
        include: this.getCourseIncludeOptions(),
      });

      const completionPercentage =
        this.calculateCourseCompletionPercentage(updatedCourse);

      return {
        success: true,
        message: 'Course updated successfully',
        course: updatedCourse,
        completionPercentage,
        readyForReview: completionPercentage >= 80,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update course: ${error.message}`,
      );
    }
  }

  // ============================================
  // FILE UPLOAD METHODS
  // ============================================

  async uploadCourseThumbnail(
    courseId: string,
    instructorId: string,
    file: Express.Multer.File,
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Upload file using your local upload service
      const uploadResult = await this.uploadService.createFile(
        file,
        `course-${courseId}-thumbnail`,
        'course-thumbnails',
      );

      // Update course with thumbnail URL
      await this.prisma.course.update({
        where: { id: courseId },
        data: {
          thumbnail: uploadResult.file_url,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Course thumbnail uploaded successfully',
        thumbnailUrl: uploadResult.file_url,
        fileSize: file.size,
        fileName: file.originalname,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload thumbnail: ${error.message}`,
      );
    }
  }

  async uploadCourseTrailer(
    courseId: string,
    instructorId: string,
    file: Express.Multer.File,
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Upload video file
      const uploadResult = await this.uploadService.createFile(
        file,
        `course-${courseId}-trailer`,
        'course-trailers',
      );

      await this.prisma.course.update({
        where: { id: courseId },
        data: {
          trailer: uploadResult.file_url,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Course trailer uploaded successfully',
        trailerUrl: uploadResult.file_url,
        fileSize: file.size,
        fileName: file.originalname,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload trailer: ${error.message}`,
      );
    }
  }

  // ============================================
  // COURSE STATUS MANAGEMENT
  // ============================================

  async saveCourseAsDraft(courseId: string, instructorId: string) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const course = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          status: CourseStatus.DRAFT,
          updatedAt: new Date(),
        },
        include: this.getCourseIncludeOptions(),
      });

      return {
        success: true,
        message: 'Course saved as draft',
        course,
        completionPercentage: this.calculateCourseCompletionPercentage(course),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to save course as draft: ${error.message}`,
      );
    }
  }

  async submitCourseForReview(courseId: string, instructorId: string) {
    try {
      const course = await this.verifyCourseOwnership(courseId, instructorId);

      // Comprehensive validation
      const validationResult = await this.validateCourseForReview(courseId);

      if (!validationResult.isValid) {
        return {
          success: false,
          message:
            'Course validation failed. Please complete all required fields.',
          errors: validationResult.errors,
          missingItems: validationResult.missingItems,
          completionPercentage: validationResult.completionPercentage,
        };
      }

      await this.prisma.course.update({
        where: { id: courseId },
        data: {
          status: CourseStatus.UNDER_REVIEW,
          updatedAt: new Date(),
        },
      });

      // Notify admins (you can implement this later)
      await this.notifyAdminsForReview(courseId);

      return {
        success: true,
        message:
          'Course submitted for review successfully. You will be notified once the review is complete.',
        estimatedReviewTime: '2-5 business days',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to submit course for review: ${error.message}`,
      );
    }
  }

  async validateCourseForPublication(courseId: string, instructorId: string) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const validationResult = await this.validateCourseForReview(courseId);

      return {
        success: validationResult.isValid,
        message: validationResult.isValid
          ? 'Course is ready for publication!'
          : 'Course needs improvements before publication',
        isValid: validationResult.isValid,
        errors: validationResult.errors,
        missingItems: validationResult.missingItems,
        completionPercentage: validationResult.completionPercentage,
        recommendations: this.generateCourseRecommendations(validationResult),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to validate course: ${error.message}`,
      );
    }
  }

  // ============================================
  // QUERY METHODS
  // ============================================

  async getCourseById(courseId: string, includeUnpublished = false) {
    const whereClause: any = { id: courseId };

    if (!includeUnpublished) {
      whereClause.status = CourseStatus.PUBLISHED;
    }

    const course = await this.prisma.course.findFirst({
      where: whereClause,
      include: this.getCourseIncludeOptions(),
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Calculate additional fields
    const totalLessons = course.sections.reduce(
      (total, section) => total + section.lessons.length,
      0,
    );
    const totalDuration = course.sections.reduce(
      (total, section) =>
        total +
        section.lessons.reduce(
          (sectionTotal, lesson) => sectionTotal + lesson.duration,
          0,
        ),
      0,
    );

    return {
      ...course,
      totalLessons,
      totalDuration,
      enrollmentCount: course._count.enrollments,
      completionPercentage: this.calculateCourseCompletionPercentage(course),
    };
  }

  async getInstructorCourses(
    instructorId: string,
    filters?: CourseFiltersInput,
  ) {
    const whereClause: any = { instructorId };

    if (filters) {
      if (filters.category) whereClause.category = filters.category;
      if (filters.level) whereClause.level = filters.level;
      if (filters.status) whereClause.status = filters.status;
      if (filters.search) {
        whereClause.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } },
        ];
      }
      if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
        whereClause.price = {};
        if (filters.minPrice !== undefined)
          whereClause.price.gte = filters.minPrice;
        if (filters.maxPrice !== undefined)
          whereClause.price.lte = filters.maxPrice;
      }
    }

    const courses = await this.prisma.course.findMany({
      where: whereClause,
      include: {
        sections: {
          include: {
            lessons: true,
          },
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return courses.map((course) => ({
      ...course,
      completionPercentage: this.calculateCourseCompletionPercentage(course),
    }));
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async verifyInstructorPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.INSTRUCTOR && user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only instructors can create courses');
    }

    if (
      user.role === UserRole.INSTRUCTOR &&
      user.instructorStatus !== InstructorStatus.APPROVED
    ) {
      throw new ForbiddenException(
        'Instructor account must be approved to create courses',
      );
    }
  }

  private async verifyCourseOwnership(courseId: string, instructorId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId,
      },
    });

    if (!course) {
      throw new NotFoundException(
        'Course not found or you do not have permission to access it',
      );
    }

    return course;
  }

  private validatePricing(
    price: number,
    originalPrice: number | undefined,
    enrollmentType: EnrollmentType,
  ) {
    if (enrollmentType === EnrollmentType.FREE && price > 0) {
      throw new BadRequestException('Free courses cannot have a price');
    }

    if (enrollmentType === EnrollmentType.PAID && price <= 0) {
      throw new BadRequestException(
        'Paid courses must have a price greater than 0',
      );
    }

    if (originalPrice && originalPrice <= price) {
      throw new BadRequestException(
        'Original price must be greater than current price',
      );
    }
  }

  private sanitizeCourseInput(input: CreateCourseInput) {
    return {
      ...input,
      title: input.title?.trim(),
      description: input.description?.trim(),
      shortDescription: input.shortDescription?.trim(),
      objectives:
        input.objectives?.map((obj) => obj.trim()).filter(Boolean) || [],
      prerequisites:
        input.prerequisites?.map((req) => req.trim()).filter(Boolean) || [],
      whatYouLearn:
        input.whatYouLearn?.map((item) => item.trim()).filter(Boolean) || [],
      seoTags:
        input.seoTags?.map((tag) => tag.trim().toLowerCase()).filter(Boolean) ||
        [],
      marketingTags:
        input.marketingTags?.map((tag) => tag.trim()).filter(Boolean) || [],
    };
  }

  private sanitizeUpdateInput(input: UpdateCourseInput) {
    const sanitized: any = { ...input };

    if (sanitized.title) sanitized.title = sanitized.title.trim();
    if (sanitized.description)
      sanitized.description = sanitized.description.trim();
    if (sanitized.objectives) {
      sanitized.objectives = sanitized.objectives
        .map((obj: string) => obj.trim())
        .filter(Boolean);
    }
    if (sanitized.prerequisites) {
      sanitized.prerequisites = sanitized.prerequisites
        .map((req: string) => req.trim())
        .filter(Boolean);
    }
    if (sanitized.whatYouLearn) {
      sanitized.whatYouLearn = sanitized.whatYouLearn
        .map((item: string) => item.trim())
        .filter(Boolean);
    }

    return sanitized;
  }

  private getCourseIncludeOptions() {
    return {
      instructor: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          instructorBio: true,
          expertise: true,
        },
      },
      sections: {
        include: {
          lessons: true,
        },
        orderBy: [{ order: Prisma.SortOrder.asc }],
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    };
  }

  private calculateCourseCompletionPercentage(course: any): number {
    let completionScore = 0;
    const maxScore = 100;

    // Basic Information (30 points)
    if (course.title && course.title.length >= 10) completionScore += 5;
    if (course.description && course.description.length >= 100)
      completionScore += 10;
    if (course.shortDescription && course.shortDescription.length >= 50)
      completionScore += 5;
    if (course.category) completionScore += 5;
    if (course.level) completionScore += 5;

    // Learning Objectives (20 points)
    if (course.objectives && course.objectives.length >= 3)
      completionScore += 10;
    if (course.whatYouLearn && course.whatYouLearn.length >= 3)
      completionScore += 10;

    // Media Content (25 points)
    if (course.thumbnail) completionScore += 15;
    if (course.trailer) completionScore += 10;

    // Content Structure (15 points)
    if (course.sections && course.sections.length > 0) completionScore += 10;
    const totalLessons =
      course.sections?.reduce(
        (total: number, section: any) => total + (section.lessons?.length || 0),
        0,
      ) || 0;
    if (totalLessons > 0) completionScore += 5;

    // Pricing & Settings (10 points)
    if (
      course.enrollmentType === EnrollmentType.FREE ||
      (course.enrollmentType === EnrollmentType.PAID && course.price > 0)
    ) {
      completionScore += 10;
    }

    return Math.min(completionScore, maxScore);
  }

  private async validateCourseForReview(courseId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lessons: true,
          },
        },
      },
    });

    if (!course) {
      return {
        isValid: false,
        errors: ['Course not found'],
        missingItems: [],
        completionPercentage: 0,
      };
    }

    const errors: string[] = [];
    const missingItems: string[] = [];

    // Validate basic information
    if (!course.title || course.title.length < 10) {
      errors.push('Course title must be at least 10 characters long');
      missingItems.push('Descriptive course title');
    }

    if (!course.description || course.description.length < 100) {
      errors.push('Course description must be at least 100 characters long');
      missingItems.push('Detailed course description');
    }

    if (!course.thumbnail) {
      errors.push('Course thumbnail is required');
      missingItems.push('Course thumbnail image');
    }

    if (!course.objectives || course.objectives.length === 0) {
      errors.push('At least one learning objective is required');
      missingItems.push('Learning objectives');
    }

    if (!course.whatYouLearn || course.whatYouLearn.length === 0) {
      errors.push('At least one "what you learn" item is required');
      missingItems.push('What students will learn');
    }

    // Validate content structure
    if (!course.sections || course.sections.length === 0) {
      errors.push('At least one section is required');
      missingItems.push('Course sections');
    }

    const totalLessons =
      course.sections?.reduce(
        (total, section) => total + section.lessons.length,
        0,
      ) || 0;

    if (totalLessons === 0) {
      errors.push('At least one lesson is required');
      missingItems.push('Course lessons');
    }

    // Validate pricing
    if (course.enrollmentType === EnrollmentType.PAID && course.price <= 0) {
      errors.push('Paid courses must have a price greater than 0');
      missingItems.push('Course pricing');
    }

    const completionPercentage =
      this.calculateCourseCompletionPercentage(course);

    return {
      isValid: errors.length === 0 && completionPercentage >= 80,
      errors,
      missingItems,
      completionPercentage,
    };
  }

  private generateCourseRecommendations(validationResult: any): string[] {
    const recommendations: string[] = [];

    if (validationResult.completionPercentage < 50) {
      recommendations.push(
        'Focus on completing the basic course information first',
      );
    }

    if (validationResult.missingItems.includes('Course thumbnail image')) {
      recommendations.push('Add an eye-catching thumbnail to attract students');
    }

    if (validationResult.missingItems.includes('Course sections')) {
      recommendations.push('Organize your content into logical sections');
    }

    if (validationResult.missingItems.includes('Course lessons')) {
      recommendations.push('Create engaging lessons with varied content types');
    }

    if (validationResult.completionPercentage >= 80) {
      recommendations.push(
        'Your course looks great! Consider adding a trailer video to boost enrollments',
      );
    }

    return recommendations;
  }

  private async notifyAdminsForReview(courseId: string) {
    try {
      const admins = await this.prisma.user.findMany({
        where: { role: UserRole.ADMIN },
      });

      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructor: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      if (!course) return;

      // Create notifications for all admins
      const notifications = admins.map((admin) => ({
        userId: admin.id,
        title: 'New Course Awaiting Review',
        message: `${course.instructor.firstName} ${course.instructor.lastName} has submitted "${course.title}" for review.`,
        type: 'SYSTEM_ANNOUNCEMENT' as const,
        data: {
          courseId: courseId,
          instructorId: course.instructorId,
          action: 'course_review',
          courseTitle: course.title,
          instructorName: `${course.instructor.firstName} ${course.instructor.lastName}`,
        },
      }));

      await this.prisma.notification.createMany({
        data: notifications,
      });

      console.log(
        `Created ${notifications.length} admin notifications for course review: ${course.title}`,
      );
    } catch (error) {
      console.error('Failed to notify admins:', error);
      // Don't throw error as this is not critical for course submission
    }
  }

  async publishCourse(courseId: string, instructorId: string) {
    try {
      const course = await this.verifyCourseOwnership(courseId, instructorId);

      // Check if user is admin or if course is approved
      const user = await this.prisma.user.findUnique({
        where: { id: instructorId },
      });

      if (
        course.status !== CourseStatus.PUBLISHED &&
        user?.role !== UserRole.ADMIN &&
        course.status !== CourseStatus.UNDER_REVIEW
      ) {
        throw new ForbiddenException(
          'Course must be approved before publishing',
        );
      }

      // Validate course completeness
      const validationResult = await this.validateCourseForReview(courseId);

      if (!validationResult.isValid) {
        return {
          success: false,
          message:
            'Course validation failed. Please complete all required fields before publishing.',
          errors: validationResult.errors,
          missingItems: validationResult.missingItems,
          completionPercentage: validationResult.completionPercentage,
        };
      }

      const publishedCourse = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          status: CourseStatus.PUBLISHED,
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
        include: this.getCourseIncludeOptions(),
      });

      return {
        success: true,
        message:
          'Course published successfully! Students can now enroll in your course.',
        course: publishedCourse,
        publishedAt: publishedCourse.publishedAt,
        courseUrl: `/courses/${courseId}`, // You can customize this URL structure
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to publish course: ${error.message}`,
      );
    }
  }

  async deleteCourse(courseId: string, instructorId: string) {
    try {
      const course = await this.verifyCourseOwnership(courseId, instructorId);

      // Check if course has enrollments
      const enrollmentCount = await this.prisma.enrollment.count({
        where: { courseId },
      });

      if (enrollmentCount > 0) {
        throw new BadRequestException(
          'Cannot delete course with active enrollments. Please contact support if you need to remove this course.',
        );
      }

      // Clean up associated files if needed
      if (course.thumbnail) {
        try {
          // Extract file path from URL if using local storage
          const thumbnailPath = course.thumbnail.replace(
            process.env.BACKEND_ASSETS_LINK || '',
            '',
          );
          await this.uploadService.deleteFile(`./uploads/${thumbnailPath}`);
        } catch (error) {
          console.warn('Failed to delete thumbnail file:', error);
        }
      }

      if (course.trailer) {
        try {
          const trailerPath = course.trailer.replace(
            process.env.BACKEND_ASSETS_LINK || '',
            '',
          );
          await this.uploadService.deleteFile(`./uploads/${trailerPath}`);
        } catch (error) {
          console.warn('Failed to delete trailer file:', error);
        }
      }

      await this.prisma.course.delete({
        where: { id: courseId },
      });

      return {
        success: true,
        message: 'Course deleted successfully',
        deletedCourseTitle: course.title,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete course: ${error.message}`,
      );
    }
  }
}
