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
  SaveCourseDraftInput,
  CourseCreationResponse,
  CourseDraftResponse,
} from './dto/course-creation.dto';
import {
  CourseStatus,
  UserRole,
  InstructorStatus,
  EnrollmentType,
  CourseLevel,
  ContentType,
  LessonType,
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
  // COMPREHENSIVE COURSE CREATION
  // ============================================

  async createCourse(
    instructorId: string,
    input: CreateCourseInput,
  ): Promise<CourseCreationResponse> {
    try {
      // Verify instructor permissions
      await this.verifyInstructorPermissions(instructorId);

      // Validate and sanitize input
      const sanitizedInput = this.sanitizeCourseInput(input);

      // Validate pricing logic
      this.validatePricing(
        sanitizedInput.price,
        sanitizedInput.originalPrice,
        sanitizedInput.settings?.enrollmentType || EnrollmentType.FREE,
      );

      // Use database transaction for complex operations
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Create the main course
        const course = await prisma.course.create({
          data: {
            title: sanitizedInput.title,
            description: sanitizedInput.description,
            shortDescription: sanitizedInput.shortDescription,
            category: sanitizedInput.category,
            subcategory: sanitizedInput.subcategory,
            level: sanitizedInput.level,
            thumbnail: sanitizedInput.thumbnail,
            trailer: sanitizedInput.trailer,
            price: sanitizedInput.price,
            originalPrice: sanitizedInput.originalPrice,
            currency: sanitizedInput.currency,
            objectives: sanitizedInput.objectives,
            prerequisites: sanitizedInput.prerequisites,
            whatYouLearn: sanitizedInput.whatYouLearn,
            seoTags: sanitizedInput.seoTags,
            marketingTags: sanitizedInput.marketingTags,
            instructorId,
            status: CourseStatus.DRAFT,
            enrollmentType:
              sanitizedInput.settings?.enrollmentType || EnrollmentType.FREE,
            language: sanitizedInput.settings?.language || 'en',
            isPublic: sanitizedInput.settings?.isPublic ?? true,
            certificate: sanitizedInput.settings?.certificate ?? false,

            // Store all settings as JSON
            settings: sanitizedInput.settings || {},

            // Default accessibility
            accessibility: sanitizedInput.settings?.accessibility || {
              captions: false,
              transcripts: false,
              audioDescription: false,
              signLanguage: false,
            },

            // Analytics defaults
            views: 0,
            avgRating: 0,
            totalRatings: 0,
          },
        });

        // 2. Create sections and lessons
        if (sanitizedInput.sections && sanitizedInput.sections.length > 0) {
          for (const [
            sectionIndex,
            sectionInput,
          ] of sanitizedInput.sections.entries()) {
            const section = await prisma.section.create({
              data: {
                title: sectionInput.title,
                description: sectionInput.description,
                order: sectionIndex,
                courseId: course.id,
              },
            });

            // Create lessons for this section
            if (sectionInput.lectures && sectionInput.lectures.length > 0) {
              for (const [
                lectureIndex,
                lectureInput,
              ] of sectionInput.lectures.entries()) {
                const lesson = await prisma.lesson.create({
                  data: {
                    title: lectureInput.title,
                    description: lectureInput.description,
                    type: lectureInput.type,
                    content: lectureInput.content,
                    duration: lectureInput.duration,
                    order: lectureIndex,
                    isPreview: false,
                    isInteractive: false,
                    sectionId: section.id,
                    settings: lectureInput.settings || {},
                  },
                });

                // Create content items for this lesson
                if (
                  lectureInput.contentItems &&
                  lectureInput.contentItems.length > 0
                ) {
                  for (const [
                    contentIndex,
                    contentInput,
                  ] of lectureInput.contentItems.entries()) {
                    await prisma.contentItem.create({
                      data: {
                        title: contentInput.title,
                        description: contentInput.description,
                        type: contentInput.type,
                        fileUrl: contentInput.fileUrl,
                        fileName: contentInput.fileName,
                        fileSize: contentInput.fileSize,
                        mimeType: contentInput.mimeType,
                        contentData: contentInput.contentData || {},
                        order: contentIndex,
                        isPublished: true,
                        courseId: course.id,
                        lessonId: lesson.id,
                      },
                    });
                  }
                }
              }
            }
          }
        }

        // 3. Create additional content items (not tied to specific lessons)
        if (
          sanitizedInput.additionalContent &&
          sanitizedInput.additionalContent.length > 0
        ) {
          for (const [
            contentIndex,
            contentInput,
          ] of sanitizedInput.additionalContent.entries()) {
            await prisma.contentItem.create({
              data: {
                title: contentInput.title,
                description: contentInput.description,
                type: contentInput.type,
                fileUrl: contentInput.fileUrl,
                fileName: contentInput.fileName,
                fileSize: contentInput.fileSize,
                mimeType: contentInput.mimeType,
                contentData: contentInput.contentData || {},
                order: contentIndex,
                isPublished: true,
                courseId: course.id,
                // lessonId is null for course-level content
              },
            });
          }
        }

        // Return the complete course with all relations
        return prisma.course.findUnique({
          where: { id: course.id },
          include: this.getCourseIncludeOptions(),
        });
      });

      // Convert null values to undefined for GraphQL compatibility
      const courseWithUndefined = this.convertNullsToUndefined(result);

      return {
        success: true,
        message: 'Course created successfully with all content and structure!',
        course: courseWithUndefined,
        completionPercentage:
          this.calculateCourseCompletionPercentage(courseWithUndefined),
      };
    } catch (error) {
      console.error('Course creation error:', error);
      throw new BadRequestException(
        `Failed to create course: ${error.message}`,
      );
    }
  }

  // ============================================
  // BASIC COURSE CREATION (for quick start)
  // ============================================

  async createCourseWithBasicInfo(
    instructorId: string,
    basicInfo: {
      title: string;
      description: string;
      category: string;
      level: string;
    },
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyInstructorPermissions(instructorId);

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
          settings: {},
        },
        include: this.getCourseIncludeOptions(),
      });

      const courseWithUndefined = this.convertNullsToUndefined(course);

      return {
        success: true,
        message: 'Course created successfully! Continue building your course.',
        course: courseWithUndefined,
        completionPercentage:
          this.calculateCourseCompletionPercentage(courseWithUndefined),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create course: ${error.message}`,
      );
    }
  }

  // ============================================
  // DRAFT MANAGEMENT
  // ============================================

  async saveCourseDraft(
    instructorId: string,
    draftInput: SaveCourseDraftInput,
  ): Promise<CourseDraftResponse> {
    try {
      await this.verifyInstructorPermissions(instructorId);

      // Check if draft already exists
      const existingDraft = await this.prisma.courseDraft.findFirst({
        where: { instructorId },
      });

      let draft;
      if (existingDraft) {
        // Update existing draft
        draft = await this.prisma.courseDraft.update({
          where: { id: existingDraft.id },
          data: {
            draftData: draftInput.draftData,
            currentStep: draftInput.currentStep,
            completionScore: draftInput.completionScore,
          },
        });
      } else {
        // Create new draft
        draft = await this.prisma.courseDraft.create({
          data: {
            instructorId,
            draftData: draftInput.draftData,
            currentStep: draftInput.currentStep,
            completionScore: draftInput.completionScore,
          },
        });
      }

      return {
        success: true,
        message: 'Draft saved successfully',
        draftData: draft.draftData,
        currentStep: draft.currentStep,
        completionScore: draft.completionScore,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to save draft: ${error.message}`);
    }
  }

  async getCourseDraft(instructorId: string): Promise<CourseDraftResponse> {
    try {
      const draft = await this.prisma.courseDraft.findFirst({
        where: { instructorId },
      });

      if (!draft) {
        return {
          success: false,
          message: 'No draft found',
        };
      }

      return {
        success: true,
        message: 'Draft retrieved successfully',
        draftData: draft.draftData,
        currentStep: draft.currentStep,
        completionScore: draft.completionScore,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get draft: ${error.message}`);
    }
  }

  async deleteCourseDraft(
    instructorId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.prisma.courseDraft.deleteMany({
        where: { instructorId },
      });

      return {
        success: true,
        message: 'Draft deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete draft: ${error.message}`);
    }
  }

  // ============================================
  // CONTENT MANAGEMENT
  // ============================================

  async uploadContent(
    courseId: string,
    instructorId: string,
    file: Express.Multer.File,
    contentType: ContentType,
    metadata: {
      title: string;
      description?: string;
      lessonId?: string;
      order?: number;
    },
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Determine folder path based on content type
      const folderPath = this.getContentFolderPath(contentType, courseId);
      const fileName = `${contentType}-${Date.now()}`;

      // Upload file using the existing upload service
      const uploadResult = await this.uploadService.createFile(
        file,
        fileName,
        folderPath,
      );

      // Create content item in database
      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: metadata.title,
          description: metadata.description,
          type: contentType,
          fileUrl: uploadResult.file_url,
          fileName: uploadResult.originalName,
          fileSize: uploadResult.size,
          mimeType: uploadResult.mimetype,
          order: metadata.order || 0,
          isPublished: true,
          courseId,
          lessonId: metadata.lessonId,
          contentData: {
            uploadedAt: uploadResult.uploadedAt,
            originalName: uploadResult.originalName,
          },
        },
      });

      return {
        success: true,
        message: 'Content uploaded successfully',
        contentItem,
        fileInfo: uploadResult,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload content: ${error.message}`,
      );
    }
  }

  async createTextContent(
    courseId: string,
    instructorId: string,
    contentData: {
      title: string;
      content: string;
      description?: string;
      lessonId?: string;
      order?: number;
    },
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: contentData.title,
          description: contentData.description,
          type: ContentType.TEXT,
          order: contentData.order || 0,
          isPublished: true,
          courseId,
          lessonId: contentData.lessonId,
          contentData: {
            textContent: contentData.content,
            createdAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        message: 'Text content created successfully',
        contentItem,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create text content: ${error.message}`,
      );
    }
  }

  async createAssignment(
    courseId: string,
    instructorId: string,
    assignmentData: {
      title: string;
      description: string;
      instructions?: string;
      dueDate?: string;
      points?: number;
      lessonId?: string;
      order?: number;
    },
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: assignmentData.title,
          description: assignmentData.description,
          type: ContentType.ASSIGNMENT,
          order: assignmentData.order || 0,
          isPublished: true,
          courseId,
          lessonId: assignmentData.lessonId,
          contentData: {
            instructions: assignmentData.instructions,
            dueDate: assignmentData.dueDate,
            points: assignmentData.points,
            createdAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        message: 'Assignment created successfully',
        contentItem,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create assignment: ${error.message}`,
      );
    }
  }

  async createResourceLink(
    courseId: string,
    instructorId: string,
    resourceData: {
      title: string;
      url: string;
      description?: string;
      resourceType: string;
      lessonId?: string;
      order?: number;
    },
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: resourceData.title,
          description: resourceData.description,
          type: ContentType.LINK,
          order: resourceData.order || 0,
          isPublished: true,
          courseId,
          lessonId: resourceData.lessonId,
          contentData: {
            url: resourceData.url,
            resourceType: resourceData.resourceType,
            createdAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        message: 'Resource link created successfully',
        contentItem,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to create resource link: ${error.message}`,
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

      const uploadResult = await this.uploadService.createFile(
        file,
        `course-${courseId}-thumbnail`,
        'course-thumbnails',
      );

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
  // COURSE MANAGEMENT
  // ============================================

  async updateCourse(
    courseId: string,
    instructorId: string,
    input: UpdateCourseInput,
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const sanitizedInput = this.sanitizeCourseInput(input);

      const updatedCourse = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          ...sanitizedInput,
          updatedAt: new Date(),
        },
        include: this.getCourseIncludeOptions(),
      });

      return {
        success: true,
        message: 'Course updated successfully',
        course: this.convertNullsToUndefined(updatedCourse),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update course: ${error.message}`,
      );
    }
  }

  async publishCourse(
    courseId: string,
    instructorId: string,
  ): Promise<CourseCreationResponse> {
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
          warnings: validationResult.missingItems,
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

      // Delete the draft since course is now published
      await this.prisma.courseDraft.deleteMany({
        where: { instructorId },
      });

      return {
        success: true,
        message:
          'Course published successfully! Students can now enroll in your course.',
        course: this.convertNullsToUndefined(publishedCourse),
        completionPercentage: validationResult.completionPercentage,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to publish course: ${error.message}`,
      );
    }
  }

  async getCourseWithContent(courseId: string, instructorId?: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          ...this.getCourseIncludeOptions(),
          contentItems: {
            orderBy: { order: 'asc' },
          },
          sections: {
            include: {
              lessons: {
                include: {
                  contentItems: {
                    orderBy: { order: 'asc' },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Check permissions for private courses
      if (!course.isPublic && course.instructorId !== instructorId) {
        throw new ForbiddenException('Access denied to private course');
      }

      return this.convertNullsToUndefined(course);
    } catch (error) {
      throw new BadRequestException(`Failed to get course: ${error.message}`);
    }
  }

  async getCourses(filters?: CourseFiltersInput, instructorId?: string) {
    try {
      const where: Prisma.CourseWhereInput = {
        isPublic: true,
        status: CourseStatus.PUBLISHED,
      };

      // Apply filters
      if (filters) {
        if (filters.category) {
          where.category = filters.category;
        }
        if (filters.level) {
          where.level = filters.level;
        }
        if (filters.enrollmentType) {
          where.enrollmentType = filters.enrollmentType;
        }
        if (filters.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
          ];
        }
        if (filters.tags && filters.tags.length > 0) {
          where.seoTags = {
            hasSome: filters.tags,
          };
        }
      }

      const courses = await this.prisma.course.findMany({
        where,
        include: this.getCourseIncludeOptions(),
        orderBy: { createdAt: 'desc' },
      });

      return courses.map((course) => this.convertNullsToUndefined(course));
    } catch (error) {
      throw new BadRequestException(`Failed to get courses: ${error.message}`);
    }
  }

  async getMyCourses(instructorId: string) {
    try {
      await this.verifyInstructorPermissions(instructorId);

      const courses = await this.prisma.course.findMany({
        where: { instructorId },
        include: this.getCourseIncludeOptions(),
        orderBy: { createdAt: 'desc' },
      });

      return courses.map((course) => this.convertNullsToUndefined(course));
    } catch (error) {
      throw new BadRequestException(
        `Failed to get instructor courses: ${error.message}`,
      );
    }
  }

  async deleteCourse(
    courseId: string,
    instructorId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Check if course has enrollments
      const enrollmentCount = await this.prisma.enrollment.count({
        where: { courseId },
      });

      if (enrollmentCount > 0) {
        throw new BadRequestException(
          'Cannot delete course with active enrollments',
        );
      }

      await this.prisma.course.delete({
        where: { id: courseId },
      });

      return {
        success: true,
        message: 'Course deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete course: ${error.message}`,
      );
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private getContentFolderPath(
    contentType: ContentType,
    courseId: string,
  ): string {
    const basePath = `courses/${courseId}`;

    switch (contentType) {
      case ContentType.VIDEO:
        return `${basePath}/videos`;
      case ContentType.AUDIO:
        return `${basePath}/audio`;
      case ContentType.DOCUMENT:
        return `${basePath}/documents`;
      case ContentType.IMAGE:
        return `${basePath}/images`;
      case ContentType.ARCHIVE:
        return `${basePath}/archives`;
      default:
        return `${basePath}/misc`;
    }
  }

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

  // ============================================
  // VALIDATION METHODS
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

  private sanitizeCourseInput(input: any) {
    return {
      ...input,
      title: input.title?.trim(),
      description: input.description?.trim(),
      shortDescription: input.shortDescription?.trim(),
      objectives:
        input.objectives?.map((obj: string) => obj.trim()).filter(Boolean) ||
        [],
      prerequisites:
        input.prerequisites?.map((req: string) => req.trim()).filter(Boolean) ||
        [],
      whatYouLearn:
        input.whatYouLearn
          ?.map((item: string) => item.trim())
          .filter(Boolean) || [],
      seoTags:
        input.seoTags
          ?.map((tag: string) => tag.trim().toLowerCase())
          .filter(Boolean) || [],
      marketingTags:
        input.marketingTags?.map((tag: string) => tag.trim()).filter(Boolean) ||
        [],
    };
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
          lessons: {
            orderBy: [{ order: Prisma.SortOrder.asc }],
          },
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
        contentItems: true,
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

  // ============================================
  // COURSE ANALYTICS METHODS
  // ============================================

  async getCourseAnalytics(courseId: string, instructorId: string) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Get course with enrollments and reviews
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          progress: true,
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Calculate analytics
      const totalEnrollments = course._count.enrollments;
      const totalReviews = course._count.reviews;
      const averageRating = course.avgRating;

      // Calculate completion rate
      const completedEnrollments = course.enrollments.filter(
        (enrollment) => enrollment.status === 'COMPLETED',
      ).length;
      const completionRate =
        totalEnrollments > 0
          ? (completedEnrollments / totalEnrollments) * 100
          : 0;

      // Calculate revenue (for paid courses)
      const totalRevenue = course.enrollments
        .filter((enrollment) => enrollment.amountPaid)
        .reduce((sum, enrollment) => sum + (enrollment.amountPaid || 0), 0);

      // Recent enrollments (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentEnrollments = course.enrollments.filter(
        (enrollment) => enrollment.enrolledAt >= thirtyDaysAgo,
      ).length;

      return {
        success: true,
        analytics: {
          totalEnrollments,
          totalReviews,
          averageRating,
          completionRate,
          totalRevenue,
          recentEnrollments,
          views: course.views,
          enrollmentTrend: await this.getEnrollmentTrend(courseId),
          topReviews: course.reviews
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 5),
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get course analytics: ${error.message}`,
      );
    }
  }

  private async getEnrollmentTrend(courseId: string) {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        courseId,
        enrolledAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        enrolledAt: true,
      },
    });

    // Group by month
    const trend: { [key: string]: number } = {};
    enrollments.forEach((enrollment) => {
      const monthKey = enrollment.enrolledAt.toISOString().substring(0, 7); // YYYY-MM
      trend[monthKey] = (trend[monthKey] || 0) + 1;
    });

    return Object.entries(trend).map(([month, count]) => ({
      month,
      enrollments: count,
    }));
  }

  // ============================================
  // CONTENT ITEM MANAGEMENT
  // ============================================

  async updateContentItem(
    contentItemId: string,
    courseId: string,
    instructorId: string,
    updateData: {
      title?: string;
      description?: string;
      order?: number;
      contentData?: any;
    },
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const contentItem = await this.prisma.contentItem.findFirst({
        where: {
          id: contentItemId,
          courseId,
        },
      });

      if (!contentItem) {
        throw new NotFoundException('Content item not found');
      }

      const updatedContentItem = await this.prisma.contentItem.update({
        where: { id: contentItemId },
        data: {
          ...updateData,
          contentData: updateData.contentData
            ? {
                ...((contentItem.contentData as Record<string, any>) || {}),
                ...updateData.contentData,
              }
            : contentItem.contentData,
        },
      });

      return {
        success: true,
        message: 'Content item updated successfully',
        contentItem: updatedContentItem,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update content item: ${error.message}`,
      );
    }
  }

  async deleteContentItem(
    contentItemId: string,
    courseId: string,
    instructorId: string,
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const contentItem = await this.prisma.contentItem.findFirst({
        where: {
          id: contentItemId,
          courseId,
        },
      });

      if (!contentItem) {
        throw new NotFoundException('Content item not found');
      }

      // Delete file if it exists
      if (contentItem.fileUrl) {
        try {
          // Extract file path from URL and delete
          const urlParts = contentItem.fileUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const folderPath = this.getContentFolderPath(
            contentItem.type,
            courseId,
          );
          const fullPath = `./uploads/${folderPath}/${fileName}`;
          await this.uploadService.deleteFile(fullPath);
        } catch (fileError) {
          console.error('Failed to delete file:', fileError);
          // Continue with database deletion even if file deletion fails
        }
      }

      await this.prisma.contentItem.delete({
        where: { id: contentItemId },
      });

      return {
        success: true,
        message: 'Content item deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete content item: ${error.message}`,
      );
    }
  }

  // ============================================
  // SECTION AND LESSON MANAGEMENT
  // ============================================

  async updateSection(
    sectionId: string,
    courseId: string,
    instructorId: string,
    updateData: {
      title?: string;
      description?: string;
      order?: number;
    },
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const section = await this.prisma.section.findFirst({
        where: {
          id: sectionId,
          courseId,
        },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      const updatedSection = await this.prisma.section.update({
        where: { id: sectionId },
        data: updateData,
        include: {
          lessons: {
            orderBy: { order: 'asc' },
          },
        },
      });

      return {
        success: true,
        message: 'Section updated successfully',
        section: updatedSection,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update section: ${error.message}`,
      );
    }
  }

  async deleteSection(
    sectionId: string,
    courseId: string,
    instructorId: string,
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const section = await this.prisma.section.findFirst({
        where: {
          id: sectionId,
          courseId,
        },
        include: {
          lessons: {
            include: {
              contentItems: true,
            },
          },
        },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      // Delete all content files associated with lessons in this section
      for (const lesson of section.lessons) {
        for (const contentItem of lesson.contentItems) {
          if (contentItem.fileUrl) {
            try {
              const urlParts = contentItem.fileUrl.split('/');
              const fileName = urlParts[urlParts.length - 1];
              const folderPath = this.getContentFolderPath(
                contentItem.type,
                courseId,
              );
              const fullPath = `./uploads/${folderPath}/${fileName}`;
              await this.uploadService.deleteFile(fullPath);
            } catch (fileError) {
              console.error('Failed to delete file:', fileError);
            }
          }
        }
      }

      await this.prisma.section.delete({
        where: { id: sectionId },
      });

      return {
        success: true,
        message: 'Section and all associated content deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete section: ${error.message}`,
      );
    }
  }

  async updateLesson(
    lessonId: string,
    courseId: string,
    instructorId: string,
    updateData: {
      title?: string;
      description?: string;
      type?: LessonType;
      duration?: number;
      content?: string;
      order?: number;
      settings?: any;
    },
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const lesson = await this.prisma.lesson.findFirst({
        where: {
          id: lessonId,
          section: {
            courseId,
          },
        },
        include: {
          section: true,
        },
      });

      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      const updatedLesson = await this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          ...updateData,
          settings: updateData.settings
            ? {
                ...((lesson.settings as Record<string, any>) || {}),
                ...updateData.settings,
              }
            : lesson.settings,
        },
        include: {
          contentItems: {
            orderBy: { order: 'asc' },
          },
        },
      });

      return {
        success: true,
        message: 'Lesson updated successfully',
        lesson: updatedLesson,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update lesson: ${error.message}`,
      );
    }
  }

  async deleteLesson(lessonId: string, courseId: string, instructorId: string) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const lesson = await this.prisma.lesson.findFirst({
        where: {
          id: lessonId,
          section: {
            courseId,
          },
        },
        include: {
          contentItems: true,
          section: true,
        },
      });

      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      // Delete all content files associated with this lesson
      for (const contentItem of lesson.contentItems) {
        if (contentItem.fileUrl) {
          try {
            const urlParts = contentItem.fileUrl.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const folderPath = this.getContentFolderPath(
              contentItem.type,
              courseId,
            );
            const fullPath = `./uploads/${folderPath}/${fileName}`;
            await this.uploadService.deleteFile(fullPath);
          } catch (fileError) {
            console.error('Failed to delete file:', fileError);
          }
        }
      }

      await this.prisma.lesson.delete({
        where: { id: lessonId },
      });

      return {
        success: true,
        message: 'Lesson and all associated content deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete lesson: ${error.message}`,
      );
    }
  }

  // ============================================
  // COURSE DUPLICATION
  // ============================================

  async duplicateCourse(
    courseId: string,
    instructorId: string,
    newTitle?: string,
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const originalCourse = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: {
              lessons: {
                include: {
                  contentItems: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          contentItems: {
            where: { lessonId: null }, // Course-level content
          },
        },
      });

      if (!originalCourse) {
        throw new NotFoundException('Course not found');
      }

      const result = await this.prisma.$transaction(async (prisma) => {
        // Create the duplicated course
        const duplicatedCourse = await prisma.course.create({
          data: {
            title: newTitle || `${originalCourse.title} (Copy)`,
            description: originalCourse.description,
            shortDescription: originalCourse.shortDescription,
            category: originalCourse.category,
            subcategory: originalCourse.subcategory,
            level: originalCourse.level,
            // Don't copy thumbnail and trailer URLs
            price: originalCourse.price,
            originalPrice: originalCourse.originalPrice,
            currency: originalCourse.currency,
            objectives: originalCourse.objectives,
            prerequisites: originalCourse.prerequisites,
            whatYouLearn: originalCourse.whatYouLearn,
            seoTags: originalCourse.seoTags,
            marketingTags: originalCourse.marketingTags,
            instructorId,
            status: CourseStatus.DRAFT,
            enrollmentType: originalCourse.enrollmentType,
            language: originalCourse.language,
            isPublic: originalCourse.isPublic,
            certificate: originalCourse.certificate,
            settings: originalCourse.settings || {},
            accessibility: originalCourse.accessibility || {
              captions: false,
              transcripts: false,
              audioDescription: false,
              signLanguage: false,
            },
            views: 0,
            avgRating: 0,
            totalRatings: 0,
          },
        });

        // Duplicate sections and lessons
        for (const section of originalCourse.sections) {
          const duplicatedSection = await prisma.section.create({
            data: {
              title: section.title,
              description: section.description,
              order: section.order,
              courseId: duplicatedCourse.id,
            },
          });

          for (const lesson of section.lessons) {
            const duplicatedLesson = await prisma.lesson.create({
              data: {
                title: lesson.title,
                description: lesson.description,
                type: lesson.type,
                content: lesson.content,
                duration: lesson.duration,
                order: lesson.order,
                isPreview: lesson.isPreview,
                isInteractive: lesson.isInteractive,
                sectionId: duplicatedSection.id,
                settings: lesson.settings || {},
              },
            });

            // Duplicate content items (but not files - just metadata)
            for (const contentItem of lesson.contentItems) {
              await prisma.contentItem.create({
                data: {
                  title: contentItem.title,
                  description: contentItem.description,
                  type: contentItem.type,
                  // Don't copy file URLs - user will need to re-upload
                  contentData: contentItem.contentData || {},
                  order: contentItem.order,
                  isPublished: false, // Set to false until files are re-uploaded
                  courseId: duplicatedCourse.id,
                  lessonId: duplicatedLesson.id,
                },
              });
            }
          }
        }

        // Duplicate course-level content items
        for (const contentItem of originalCourse.contentItems) {
          await prisma.contentItem.create({
            data: {
              title: contentItem.title,
              description: contentItem.description,
              type: contentItem.type,
              // Don't copy file URLs
              contentData: contentItem.contentData || {},
              order: contentItem.order,
              isPublished: false,
              courseId: duplicatedCourse.id,
              // lessonId is null for course-level content
            },
          });
        }

        return prisma.course.findUnique({
          where: { id: duplicatedCourse.id },
          include: this.getCourseIncludeOptions(),
        });
      });

      return {
        success: true,
        message:
          'Course duplicated successfully. Please re-upload any files and media.',
        course: this.convertNullsToUndefined(result),
        completionPercentage: this.calculateCourseCompletionPercentage(result),
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to duplicate course: ${error.message}`,
      );
    }
  }
}
