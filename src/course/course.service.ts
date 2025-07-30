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

// Define SortOrder type locally since it's not exported from the main Prisma package
type SortOrder = 'asc' | 'desc';

@Injectable()
export class CourseService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  // ============================================
  // COMPREHENSIVE COURSE CREATION WITH TEMP UPLOADS
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

        // 4. CONVERT TEMPORARY UPLOADS TO PERMANENT
        await this.convertUserTempUploadsToPermanent(instructorId, course.id, prisma);

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
  // CONVERT TEMP UPLOADS TO PERMANENT
  // ============================================

  private async convertUserTempUploadsToPermanent(
    instructorId: string,
    courseId: string,
    prisma: any // Transaction prisma instance
  ) {
    try {
      // Get all temporary uploads for this user
      const tempUploads = await prisma.temporaryUpload.findMany({
        where: { userId: instructorId },
        orderBy: { createdAt: 'asc' },
      });

      if (tempUploads.length === 0) {
        console.log('No temporary uploads found for user:', instructorId);
        return;
      }

      console.log(`Converting ${tempUploads.length} temporary uploads to permanent...`);

      for (const tempUpload of tempUploads) {
        try {
          // Convert each temp upload to permanent
          const result = await this.uploadService.convertTempToPermanent(
            tempUpload.id,
            courseId,
            tempUpload.tempId?.includes('lecture-') ? tempUpload.tempId.split('lecture-')[1] : undefined,
            0 // Default order
          );

          if (result.success) {
            console.log(`Successfully converted temp upload: ${tempUpload.originalName}`);
          }
        } catch (convertError) {
          console.error(`Failed to convert temp upload ${tempUpload.id}:`, convertError);
          // Continue with other uploads even if one fails
        }
      }

      // Clean up any remaining temp uploads for this user
      await this.uploadService.cleanupUserTempUploads(instructorId);

    } catch (error) {
      console.error('Error converting temp uploads:', error);
      // Don't throw error here as the course creation should still succeed
      // even if some uploads fail to convert
    }
  }

  // ============================================
  // ENHANCED DRAFT MANAGEMENT WITH FILE HANDLING
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
      // Delete draft
      await this.prisma.courseDraft.deleteMany({
        where: { instructorId },
      });

      // Also cleanup any temporary uploads for this user
      await this.uploadService.cleanupUserTempUploads(instructorId);

      return {
        success: true,
        message: 'Draft and temporary uploads deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete draft: ${error.message}`);
    }
  }

  // ============================================
  // ENHANCED CONTENT MANAGEMENT
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

      // Use the enhanced upload service for permanent uploads
      const result = await this.uploadService.createPermanentUpload(
        file,
        courseId,
        {
          type: contentType,
          title: metadata.title,
          description: metadata.description,
          lessonId: metadata.lessonId,
          order: metadata.order,
        }
      );

      return {
        success: true,
        message: 'Content uploaded successfully',
        contentItem: result.contentItem,
        fileInfo: result.fileInfo,
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
  // ENHANCED FILE UPLOAD METHODS
  // ============================================

  async uploadCourseThumbnail(
    courseId: string,
    instructorId: string,
    file: Express.Multer.File,
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const uploadResult = this.uploadService.uploadFile(
        file,
        `course-${courseId}-thumbnail`,
        'course-thumbnails',
      );

      const file_url = (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/public') + 
                      '/' + uploadResult.path.replace(/\\/g, '/');

      await this.prisma.course.update({
        where: { id: courseId },
        data: {
          thumbnail: file_url,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Course thumbnail uploaded successfully',
        thumbnailUrl: file_url,
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

      const uploadResult = this.uploadService.uploadFile(
        file,
        `course-${courseId}-trailer`,
        'course-trailers',
      );

      const file_url = (process.env.BACKEND_ASSETS_LINK || 'http://localhost:3001/public') + 
                      '/' + uploadResult.path.replace(/\\/g, '/');

      await this.prisma.course.update({
        where: { id: courseId },
        data: {
          trailer: file_url,
          updatedAt: new Date(),
        },
      });

      return {
        success: true,
        message: 'Course trailer uploaded successfully',
        trailerUrl: file_url,
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
  // TEMPORARY UPLOAD MANAGEMENT
  // ============================================

  async getUserTempUploads(instructorId: string) {
    try {
      await this.verifyInstructorPermissions(instructorId);

      const tempUploads = await this.prisma.temporaryUpload.findMany({
        where: { userId: instructorId },
        orderBy: { createdAt: 'desc' },
      });

      return {
        success: true,
        tempUploads,
        message: 'Temporary uploads retrieved successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get temporary uploads: ${error.message}`,
      );
    }
  }

  async cleanupUserTempUploads(instructorId: string) {
    try {
      await this.verifyInstructorPermissions(instructorId);
      await this.uploadService.cleanupUserTempUploads(instructorId);

      return {
        success: true,
        message: 'Temporary uploads cleaned up successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to cleanup temporary uploads: ${error.message}`,
      );
    }
  }

  // ============================================
  // Keep all existing methods as they were...
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

  // ... [Keep all other existing methods unchanged] ...
  // getCourseWithContent, getCourses, getMyCourses, deleteCourse, etc.

  // ============================================
  // UTILITY METHODS (Updated)
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
  // VALIDATION METHODS (Keep as is)
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
            include: {
              contentItems: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    } as any; // Type assertion to bypass complex Prisma type issues
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
            lessons: {
              include: {
                contentItems: true,
              },
            },
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

    // Validate content items
    const totalContentItems = course.sections?.reduce(
      (total, section) => total + section.lessons.reduce(
        (lessonTotal, lesson) => lessonTotal + lesson.contentItems.length,
        0
      ),
      0
    ) || 0;

    if (totalContentItems === 0) {
      errors.push('At least some content items are required');
      missingItems.push('Course content (videos, documents, etc.)');
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
  // Keep all remaining existing methods...
  // getCourseWithContent, getCourses, getMyCourses, deleteCourse,
  // getCourseAnalytics, getEnrollmentTrend, updateContentItem,
  // deleteContentItem, updateSection, deleteSection, updateLesson,
  // deleteLesson, duplicateCourse
  // ============================================

  async getCourseWithContent(courseId: string, instructorId?: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          ...this.getCourseIncludeOptions(),
          contentItems: {
            orderBy: { order: 'asc' as SortOrder },
          },
          sections: {
            include: {
              lessons: {
                include: {
                  contentItems: {
                    orderBy: { order: 'asc' as SortOrder },
                  },
                },
                orderBy: { order: 'asc' as SortOrder },
              },
            },
            orderBy: { order: 'asc' as SortOrder },
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
  // COURSE ANALYTICS AND TRENDS
  // ============================================

  async getCourseAnalytics(courseId: string, instructorId: string) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const analytics = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
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
            orderBy: { enrolledAt: 'desc' },
            take: 10,
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
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!analytics) {
        throw new NotFoundException('Course not found');
      }

      // Calculate average rating
      const avgRating = analytics.reviews.length > 0
        ? analytics.reviews.reduce((sum, review) => sum + review.rating, 0) / analytics.reviews.length
        : 0;

      return {
        success: true,
        analytics: {
          totalEnrollments: analytics._count.enrollments,
          totalReviews: analytics._count.reviews,
          avgRating,
          recentEnrollments: analytics.enrollments,
          recentReviews: analytics.reviews,
          views: analytics.views,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get course analytics: ${error.message}`,
      );
    }
  }

  async getEnrollmentTrend(courseId: string, instructorId: string, days: number = 30) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          courseId,
          enrolledAt: {
            gte: startDate,
          },
        },
        select: {
          enrolledAt: true,
        },
        orderBy: { enrolledAt: 'asc' },
      });

      // Group enrollments by date
      const trend = enrollments.reduce((acc, enrollment) => {
        const date = enrollment.enrolledAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        success: true,
        trend,
        totalEnrollments: enrollments.length,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to get enrollment trend: ${error.message}`,
      );
    }
  }

  // ============================================
  // CONTENT MANAGEMENT METHODS
  // ============================================

  async updateContentItem(
    contentItemId: string,
    instructorId: string,
    updateData: {
      title?: string;
      description?: string;
      order?: number;
      isPublished?: boolean;
      contentData?: any;
    },
  ) {
    try {
      const contentItem = await this.prisma.contentItem.findUnique({
        where: { id: contentItemId },
        include: { course: true },
      });

      if (!contentItem) {
        throw new NotFoundException('Content item not found');
      }

      if (!contentItem.course || contentItem.course.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to update this content');
      }

      const updatedContentItem = await this.prisma.contentItem.update({
        where: { id: contentItemId },
        data: {
          ...updateData,
          updatedAt: new Date(),
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

  async deleteContentItem(contentItemId: string, instructorId: string) {
    try {
      const contentItem = await this.prisma.contentItem.findUnique({
        where: { id: contentItemId },
        include: { course: true },
      });

      if (!contentItem) {
        throw new NotFoundException('Content item not found');
      }

      if (!contentItem.course || contentItem.course.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to delete this content');
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
  // SECTION MANAGEMENT METHODS
  // ============================================

  async updateSection(
    sectionId: string,
    instructorId: string,
    updateData: {
      title?: string;
      description?: string;
      order?: number;
      isLocked?: boolean;
    },
  ) {
    try {
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
        include: { course: true },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      if (section.course.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to update this section');
      }

      const updatedSection = await this.prisma.section.update({
        where: { id: sectionId },
        data: {
          ...updateData,
          updatedAt: new Date(),
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

  async deleteSection(sectionId: string, instructorId: string) {
    try {
      const section = await this.prisma.section.findUnique({
        where: { id: sectionId },
        include: { course: true },
      });

      if (!section) {
        throw new NotFoundException('Section not found');
      }

      if (section.course.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to delete this section');
      }

      await this.prisma.section.delete({
        where: { id: sectionId },
      });

      return {
        success: true,
        message: 'Section deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete section: ${error.message}`,
      );
    }
  }

  // ============================================
  // LESSON MANAGEMENT METHODS
  // ============================================

  async updateLesson(
    lessonId: string,
    instructorId: string,
    updateData: {
      title?: string;
      description?: string;
      type?: LessonType;
      content?: string;
      duration?: number;
      order?: number;
      isPreview?: boolean;
      isInteractive?: boolean;
      settings?: any;
    },
  ) {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { section: { include: { course: true } } },
      });

      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      if (lesson.section.course.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to update this lesson');
      }

      const updatedLesson = await this.prisma.lesson.update({
        where: { id: lessonId },
        data: {
          ...updateData,
          updatedAt: new Date(),
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

  async deleteLesson(lessonId: string, instructorId: string) {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: { section: { include: { course: true } } },
      });

      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      if (lesson.section.course.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to delete this lesson');
      }

      await this.prisma.lesson.delete({
        where: { id: lessonId },
      });

      return {
        success: true,
        message: 'Lesson deleted successfully',
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

  async duplicateCourse(courseId: string, instructorId: string) {
    try {
      const originalCourse = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          sections: {
            include: {
              lessons: {
                include: {
                  contentItems: true,
                },
              },
            },
          },
          contentItems: true,
        },
      });

      if (!originalCourse) {
        throw new NotFoundException('Course not found');
      }

      if (originalCourse.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to duplicate this course');
      }

      // Create duplicated course
      const duplicatedCourse = await this.prisma.course.create({
        data: {
          title: `${originalCourse.title} (Copy)`,
          description: originalCourse.description,
          shortDescription: originalCourse.shortDescription,
          category: originalCourse.category,
          subcategory: originalCourse.subcategory,
          level: originalCourse.level,
          thumbnail: originalCourse.thumbnail,
          trailer: originalCourse.trailer,
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
          isPublic: false, // Start as private
          certificate: originalCourse.certificate,
          settings: originalCourse.settings as any,
          accessibility: originalCourse.accessibility as any,
          views: 0,
          avgRating: 0,
          totalRatings: 0,
        },
      });

      // Duplicate sections and lessons
      for (const section of originalCourse.sections) {
        const duplicatedSection = await this.prisma.section.create({
          data: {
            title: section.title,
            description: section.description,
            order: section.order,
            isLocked: section.isLocked,
            courseId: duplicatedCourse.id,
          },
        });

        // Duplicate lessons
        for (const lesson of section.lessons) {
          const duplicatedLesson = await this.prisma.lesson.create({
            data: {
              title: lesson.title,
              description: lesson.description,
              type: lesson.type,
              content: lesson.content,
              duration: lesson.duration,
              order: lesson.order,
              isPreview: lesson.isPreview,
              isInteractive: lesson.isInteractive,
              hasAIQuiz: lesson.hasAIQuiz,
              aiSummary: lesson.aiSummary,
              transcription: lesson.transcription,
              captions: lesson.captions,
              transcript: lesson.transcript,
              settings: lesson.settings as any,
              sectionId: duplicatedSection.id,
            },
          });

          // Duplicate content items
          for (const contentItem of lesson.contentItems) {
            await this.prisma.contentItem.create({
              data: {
                title: contentItem.title,
                description: contentItem.description,
                type: contentItem.type,
                fileUrl: contentItem.fileUrl,
                fileName: contentItem.fileName,
                fileSize: contentItem.fileSize,
                mimeType: contentItem.mimeType,
                contentData: contentItem.contentData as any,
                order: contentItem.order,
                isPublished: contentItem.isPublished,
                courseId: duplicatedCourse.id,
                lessonId: duplicatedLesson.id,
              },
            });
          }
        }
      }

      // Duplicate course-level content items
      for (const contentItem of originalCourse.contentItems) {
        await this.prisma.contentItem.create({
          data: {
            title: contentItem.title,
            description: contentItem.description,
            type: contentItem.type,
            fileUrl: contentItem.fileUrl,
            fileName: contentItem.fileName,
            fileSize: contentItem.fileSize,
            mimeType: contentItem.mimeType,
            contentData: contentItem.contentData as any,
            order: contentItem.order,
            isPublished: contentItem.isPublished,
            courseId: duplicatedCourse.id,
          },
        });
      }

      return {
        success: true,
        message: 'Course duplicated successfully',
        courseId: duplicatedCourse.id,
        course: duplicatedCourse,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to duplicate course: ${error.message}`,
      );
    }
  }
}