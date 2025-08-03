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
  UpdateCourseBasicInfoInput,
  UpdateCourseSettingsInput,
  CourseFiltersInput,
  SaveCourseDraftInput,
  CourseCreationResponse,
  CourseDraftResponse,
  CourseSettingsInput,
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

// Define SortOrder type locally since it's not exported from the main prisma index
type SortOrder = 'asc' | 'desc';

@Injectable()
export class CourseService {
  constructor(
    private prisma: PrismaService,
    private uploadService: UploadService,
  ) {}

  // ============================================
  // ENHANCED COURSE CREATION WITH ORGANIZED CONTENT
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
            settings: sanitizedInput.settings || {},
            accessibility: sanitizedInput.settings?.accessibility || {
              captions: false,
              transcripts: false,
              audioDescription: false,
            },
            views: 0,
            avgRating: 0,
            totalRatings: 0,
          },
        });

        // 2. Create sections and lessons
        const sectionMap = new Map<string, string>(); // frontend ID -> backend ID
        const lectureMap = new Map<string, string>(); // frontend ID -> backend ID

        if (sanitizedInput.sections && sanitizedInput.sections.length > 0) {
          for (const [sectionIndex, sectionInput] of sanitizedInput.sections.entries()) {
            const section = await prisma.section.create({
              data: {
                title: sectionInput.title,
                description: sectionInput.description,
                order: sectionIndex,
                courseId: course.id,
              },
            });

            // Map frontend section ID to backend ID
            sectionMap.set(sectionInput.id, section.id);

            // Create lessons for this section
            if (sectionInput.lectures && sectionInput.lectures.length > 0) {
              for (const [lectureIndex, lectureInput] of sectionInput.lectures.entries()) {
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

                // Map frontend lecture ID to backend ID
                lectureMap.set(lectureInput.id, lesson.id);

                // Create content item for this lesson if provided
                if (lectureInput.contentItem) {
                  console.log(`Creating content item for lesson ${lesson.id}:`, lectureInput.contentItem);
                  const contentItem = await prisma.contentItem.create({
                    data: {
                      title: lectureInput.contentItem.title,
                      description: lectureInput.contentItem.description,
                      type: lectureInput.contentItem.type,
                      fileUrl: lectureInput.contentItem.fileUrl,
                      fileName: lectureInput.contentItem.fileName,
                      fileSize: lectureInput.contentItem.fileSize,
                      mimeType: lectureInput.contentItem.mimeType,
                      contentData: lectureInput.contentItem.contentData || {},
                      order: lectureInput.contentItem.order || 0,
                      isPublished: true,
                      courseId: course.id,
                      lessonId: lesson.id,
                    },
                  });
                  console.log(`Created content item:`, contentItem);
                } else {
                  console.log(`No content item provided for lesson ${lesson.id}`);
                }
              }
            }
          }
        }

        // Create additional content items at course level
        if (sanitizedInput.additionalContent && sanitizedInput.additionalContent.length > 0) {
          console.log(`Creating ${sanitizedInput.additionalContent.length} additional content items`);
          for (const [index, contentItem] of sanitizedInput.additionalContent.entries()) {
            console.log(`Creating course-level content item ${index}:`, contentItem);
            const createdContentItem = await prisma.contentItem.create({
              data: {
                title: contentItem.title,
                description: contentItem.description,
                type: contentItem.type,
                fileUrl: contentItem.fileUrl,
                fileName: contentItem.fileName,
                fileSize: contentItem.fileSize,
                mimeType: contentItem.mimeType,
                contentData: contentItem.contentData || {},
                order: contentItem.order || index,
                isPublished: true,
                courseId: course.id,
                // No lessonId for course-level content items
              },
            });
            console.log(`Created course-level content item:`, createdContentItem);
          }
        } else {
          console.log('No additional content items provided');
        }



        // Return the complete course with all relations
        const result = await prisma.course.findUnique({
          where: { id: course.id },
          include: this.getCourseIncludeOptions(),
        });

        return result;
      });

      // Convert null values to undefined for GraphQL compatibility
      const courseWithUndefined = this.convertNullsToUndefined(result);

      

      const response = {
        success: true,
        message: 'Course created successfully with all content organized by lectures!',
        course: courseWithUndefined,
        completionPercentage: this.calculateCourseCompletionPercentage(courseWithUndefined),
        errors: [],
      };
      return response;
    } catch (error) {
      console.error('Course creation error:', error);
      
      // Return error response instead of throwing
      return {
        success: false,
        message: 'Failed to create course',
        course: null,
        completionPercentage: 0,
        errors: [error.message || 'An unexpected error occurred during course creation'],
      };
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
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyInstructorPermissions(instructorId);

      const course = await this.prisma.course.create({
        data: {
          title: basicInfo.title,
          description: basicInfo.description,
          category: basicInfo.category,
          level: basicInfo.level as CourseLevel,
          instructorId,
          status: CourseStatus.DRAFT,
          enrollmentType: EnrollmentType.FREE,
          language: 'en',
          isPublic: false,
          certificate: false,
          settings: {},
          accessibility: {
            captions: false,
            transcripts: false,
            audioDescription: false,
          },
          views: 0,
          avgRating: 0,
          totalRatings: 0,
        },
        include: this.getCourseIncludeOptions(),
      });

      return {
        success: true,
        message: 'Course created successfully with basic information',
        course: this.convertNullsToUndefined(course),
        completionPercentage: this.calculateCourseCompletionPercentage(course),
        errors: [],
      };
    } catch (error) {
      console.error('Course creation error:', error);
      
      // Return error response instead of throwing
      return {
        success: false,
        message: 'Failed to create course with basic information',
        course: null,
        completionPercentage: 0,
        errors: [error.message || 'An unexpected error occurred during course creation'],
      };
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
  ): Promise<CourseCreationResponse> {
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
        course: contentItem,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create text content',
        course: null,
        errors: [error.message || 'An unexpected error occurred while creating text content'],
      };
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
  ): Promise<CourseCreationResponse> {
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
        course: contentItem,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create assignment',
        course: null,
        errors: [error.message || 'An unexpected error occurred while creating assignment'],
      };
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
  ): Promise<CourseCreationResponse> {
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
        course: contentItem,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create resource link',
        course: null,
        errors: [error.message || 'An unexpected error occurred while creating resource link'],
      };
    }
  }

  async updateCourse(
    courseId: string,
    instructorId: string,
    input: UpdateCourseInput,
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Validate and sanitize input
      const sanitizedInput = this.sanitizeCourseInput(input);

      // Validate pricing logic if price is being updated
      if (sanitizedInput.price !== undefined || sanitizedInput.originalPrice !== undefined) {
        this.validatePricing(
          sanitizedInput.price,
          sanitizedInput.originalPrice,
          sanitizedInput.settings?.enrollmentType || EnrollmentType.FREE,
        );
      }

      // Use database transaction for complex operations
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Update the main course
        const course = await prisma.course.update({
          where: { id: courseId },
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
            enrollmentType: sanitizedInput.settings?.enrollmentType,
            language: sanitizedInput.settings?.language,
            isPublic: sanitizedInput.settings?.isPublic,
            certificate: sanitizedInput.settings?.certificate,
            settings: sanitizedInput.settings || {},
            accessibility: sanitizedInput.settings?.accessibility || {
              captions: false,
              transcripts: false,
              audioDescription: false,
            },
            updatedAt: new Date(),
          },
        });

        // 2. Handle sections and lessons updates if provided
        if (sanitizedInput.sections && sanitizedInput.sections.length > 0) {
          // Get existing sections to track what needs to be updated/deleted
          const existingSections = await prisma.section.findMany({
            where: { courseId },
            include: {
              lessons: {
                include: {
                  contentItem: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          });

          // Create maps for efficient lookup
          const existingSectionMap = new Map(existingSections.map(s => [s.id, s]));
          const existingLessonMap = new Map();
          existingSections.forEach(section => {
            section.lessons.forEach(lesson => {
              existingLessonMap.set(lesson.id, lesson);
            });
          });

          // Process each section from input
          for (const [sectionIndex, sectionInput] of sanitizedInput.sections.entries()) {
            let section;
            
            if (existingSectionMap.has(sectionInput.id)) {
              // Update existing section
              section = await prisma.section.update({
                where: { id: sectionInput.id },
                data: {
                  title: sectionInput.title,
                  description: sectionInput.description,
                  order: sectionIndex,
                },
              });
            } else {
              // Create new section
              section = await prisma.section.create({
                data: {
                  title: sectionInput.title,
                  description: sectionInput.description,
                  order: sectionIndex,
                  courseId: course.id,
                },
              });
            }

            // Handle lessons for this section
            if (sectionInput.lectures && sectionInput.lectures.length > 0) {
              for (const [lectureIndex, lectureInput] of sectionInput.lectures.entries()) {
                let lesson;
                
                if (existingLessonMap.has(lectureInput.id)) {
                  // Update existing lesson
                  lesson = await prisma.lesson.update({
                    where: { id: lectureInput.id },
                    data: {
                      title: lectureInput.title,
                      description: lectureInput.description,
                      type: lectureInput.type,
                      content: lectureInput.content,
                      duration: lectureInput.duration,
                      order: lectureIndex,
                      settings: lectureInput.settings || {},
                    },
                  });
                } else {
                  // Create new lesson
                  lesson = await prisma.lesson.create({
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
                }

                // Handle content item for this lesson
                if (lectureInput.contentItem) {
                  // Check if lesson already has a content item
                  const existingContentItem = await prisma.contentItem.findFirst({
                    where: { lessonId: lesson.id },
                  });

                  if (existingContentItem) {
                    // Update existing content item
                    await prisma.contentItem.update({
                      where: { id: existingContentItem.id },
                      data: {
                        title: lectureInput.contentItem.title,
                        description: lectureInput.contentItem.description,
                        type: lectureInput.contentItem.type,
                        fileUrl: lectureInput.contentItem.fileUrl,
                        fileName: lectureInput.contentItem.fileName,
                        fileSize: lectureInput.contentItem.fileSize,
                        mimeType: lectureInput.contentItem.mimeType,
                        contentData: lectureInput.contentItem.contentData || {},
                        order: lectureInput.contentItem.order || 0,
                        isPublished: true,
                      },
                    });
                  } else {
                    // Create new content item
                    await prisma.contentItem.create({
                      data: {
                        title: lectureInput.contentItem.title,
                        description: lectureInput.contentItem.description,
                        type: lectureInput.contentItem.type,
                        fileUrl: lectureInput.contentItem.fileUrl,
                        fileName: lectureInput.contentItem.fileName,
                        fileSize: lectureInput.contentItem.fileSize,
                        mimeType: lectureInput.contentItem.mimeType,
                        contentData: lectureInput.contentItem.contentData || {},
                        order: lectureInput.contentItem.order || 0,
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

          // Delete sections and lessons that are no longer in the input
          const inputSectionIds = new Set(sanitizedInput.sections.map(s => s.id));
          const inputLessonIds = new Set();
          sanitizedInput.sections.forEach(section => {
            section.lectures.forEach(lecture => {
              inputLessonIds.add(lecture.id);
            });
          });

          // Delete lessons that are no longer in input
          for (const existingSection of existingSections) {
            for (const lesson of existingSection.lessons) {
              if (!inputLessonIds.has(lesson.id)) {
                // Delete content item first (if exists)
                if (lesson.contentItem) {
                  await prisma.contentItem.delete({
                    where: { id: lesson.contentItem.id },
                  });
                }
                // Delete lesson
                await prisma.lesson.delete({
                  where: { id: lesson.id },
                });
              }
            }
          }

          // Delete sections that are no longer in input
          for (const existingSection of existingSections) {
            if (!inputSectionIds.has(existingSection.id)) {
              await prisma.section.delete({
                where: { id: existingSection.id },
              });
            }
          }
        }

        // 3. Handle additional content items at course level
        if (sanitizedInput.additionalContent && sanitizedInput.additionalContent.length > 0) {
          // Get existing course-level content items
          const existingCourseContent = await prisma.contentItem.findMany({
            where: {
              courseId,
              lessonId: null, // Course-level content items only
            },
            orderBy: { order: 'asc' },
          });

          // Create map for efficient lookup
          const existingContentMap = new Map(existingCourseContent.map(c => [c.id, c]));

          // Process each additional content item
          for (const [index, contentItem] of sanitizedInput.additionalContent.entries()) {
            if (existingContentMap.has(contentItem.id)) {
              // Update existing content item
              await prisma.contentItem.update({
                where: { id: contentItem.id },
                data: {
                  title: contentItem.title,
                  description: contentItem.description,
                  type: contentItem.type,
                  fileUrl: contentItem.fileUrl,
                  fileName: contentItem.fileName,
                  fileSize: contentItem.fileSize,
                  mimeType: contentItem.mimeType,
                  contentData: contentItem.contentData || {},
                  order: contentItem.order || index,
                  isPublished: true,
                },
              });
            } else {
              // Create new content item
              await prisma.contentItem.create({
                data: {
                  title: contentItem.title,
                  description: contentItem.description,
                  type: contentItem.type,
                  fileUrl: contentItem.fileUrl,
                  fileName: contentItem.fileName,
                  fileSize: contentItem.fileSize,
                  mimeType: contentItem.mimeType,
                  contentData: contentItem.contentData || {},
                  order: contentItem.order || index,
                  isPublished: true,
                  courseId: course.id,
                  // No lessonId for course-level content items
                },
              });
            }
          }

          // Delete course-level content items that are no longer in input
          const inputContentIds = new Set(sanitizedInput.additionalContent.map(c => c.id));
          for (const existingContent of existingCourseContent) {
            if (!inputContentIds.has(existingContent.id)) {
              await prisma.contentItem.delete({
                where: { id: existingContent.id },
              });
            }
          }
        }

        // Return the complete updated course with all relations
        const result = await prisma.course.findUnique({
          where: { id: course.id },
          include: this.getCourseIncludeOptions(),
        });

        return result;
      });

      // Convert null values to undefined for GraphQL compatibility
      const courseWithUndefined = this.convertNullsToUndefined(result);

      return {
        success: true,
        message: 'Course updated successfully with all content organized!',
        course: courseWithUndefined,
        completionPercentage: this.calculateCourseCompletionPercentage(courseWithUndefined),
        errors: [],
      };
    } catch (error) {
      console.error('Course update error:', error);
      
      return {
        success: false,
        message: 'Failed to update course',
        course: null,
        completionPercentage: 0,
        errors: [error.message || 'An unexpected error occurred during course update'],
      };
    }
  }

  // ============================================
  // PARTIAL COURSE UPDATE METHODS
  // ============================================

  async updateCourseBasicInfo(
    courseId: string,
    instructorId: string,
    basicInfo: UpdateCourseBasicInfoInput,
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Validate and sanitize input
      const sanitizedInput = this.sanitizeCourseInput(basicInfo);

      // Validate pricing logic if price is being updated
      if (sanitizedInput.price !== undefined || sanitizedInput.originalPrice !== undefined) {
        this.validatePricing(
          sanitizedInput.price,
          sanitizedInput.originalPrice,
          EnrollmentType.FREE, // Default, will be overridden if settings are provided
        );
      }

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
        message: 'Course basic information updated successfully',
        course: this.convertNullsToUndefined(updatedCourse),
        completionPercentage: this.calculateCourseCompletionPercentage(updatedCourse),
        errors: [],
      };
    } catch (error) {
      console.error('Course basic info update error:', error);
      
      return {
        success: false,
        message: 'Failed to update course basic information',
        course: null,
        completionPercentage: 0,
        errors: [error.message || 'An unexpected error occurred during course basic info update'],
      };
    }
  }

  async updateCourseSettings(
    courseId: string,
    instructorId: string,
    settings: UpdateCourseSettingsInput,
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Build update data object with only provided fields
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (settings.enrollmentType !== undefined) {
        updateData.enrollmentType = settings.enrollmentType;
      }
      if (settings.language !== undefined) {
        updateData.language = settings.language;
      }
      if (settings.isPublic !== undefined) {
        updateData.isPublic = settings.isPublic;
      }
      if (settings.certificate !== undefined) {
        updateData.certificate = settings.certificate;
      }
      if (settings.seoDescription !== undefined) {
        updateData.seoDescription = settings.seoDescription;
      }
      if (settings.seoTags !== undefined) {
        updateData.seoTags = settings.seoTags;
      }
      if (settings.accessibility !== undefined) {
        updateData.accessibility = settings.accessibility as any;
      }
      if (settings.pricing !== undefined) {
        updateData.settings = { ...updateData.settings, pricing: settings.pricing };
      }
      if (settings.enrollment !== undefined) {
        updateData.settings = { ...updateData.settings, enrollment: settings.enrollment };
      }
      if (settings.communication !== undefined) {
        updateData.settings = { ...updateData.settings, communication: settings.communication };
      }
      if (settings.completion !== undefined) {
        updateData.settings = { ...updateData.settings, completion: settings.completion };
      }
      if (settings.content !== undefined) {
        updateData.settings = { ...updateData.settings, content: settings.content };
      }
      if (settings.marketing !== undefined) {
        updateData.settings = { ...updateData.settings, marketing: settings.marketing };
      }

      const updatedCourse = await this.prisma.course.update({
        where: { id: courseId },
        data: updateData,
        include: this.getCourseIncludeOptions(),
      });

      return {
        success: true,
        message: 'Course settings updated successfully',
        course: this.convertNullsToUndefined(updatedCourse),
        completionPercentage: this.calculateCourseCompletionPercentage(updatedCourse),
        errors: [],
      };
    } catch (error) {
      console.error('Course settings update error:', error);
      
      return {
        success: false,
        message: 'Failed to update course settings',
        course: null,
        completionPercentage: 0,
        errors: [error.message || 'An unexpected error occurred during course settings update'],
      };
    }
  }

  // ============================================
  // ENHANCED DRAFT MANAGEMENT WITH ORGANIZED CONTENT
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

      // Ensure organized content is properly stored
      const enhancedDraftData = {
        ...draftInput.draftData,
        _lastSaved: new Date().toISOString(),
        _contentSummary: this.generateDraftContentSummary(draftInput.draftData),
      };

      console.log("enhancedDraftData", enhancedDraftData)

      let draft;
      if (existingDraft) {
        // Update existing draft
        draft = await this.prisma.courseDraft.update({
          where: { id: existingDraft.id },
          data: {
            draftData: enhancedDraftData,
            currentStep: draftInput.currentStep,
            completionScore: draftInput.completionScore,
          },
        });
      } else {
        // Create new draft
        draft = await this.prisma.courseDraft.create({
          data: {
            instructorId,
            draftData: enhancedDraftData,
            currentStep: draftInput.currentStep,
            completionScore: draftInput.completionScore,
          },
        });
      }

      return {
        success: true,
        message: 'Draft saved successfully with organized content',
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
        message: 'Draft retrieved successfully with organized content',
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
      // Get the draft data first to extract thumbnail URLs
      const existingDraft = await this.prisma.courseDraft.findFirst({
        where: { instructorId },
      });

      if (existingDraft && existingDraft.draftData) {
        // Extract thumbnail URL from draft data
        const draftData = existingDraft.draftData as any;
        if (draftData.thumbnail) {
          try {
            // Delete the thumbnail file
            await this.uploadService.deleteCourseThumbnail(
              draftData.thumbnail,
              instructorId,
              { isUnsaved: true }
            );
          } catch (error) {
            console.error('Failed to delete draft thumbnail:', error);
            // Continue with draft deletion even if thumbnail deletion fails
          }
        }
      }

      // Delete draft
      await this.prisma.courseDraft.deleteMany({
        where: { instructorId },
      });

      return {
        success: true,
        message: 'Draft and associated files deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(`Failed to delete draft: ${error.message}`);
    }
  }

  // ============================================
  // ENHANCED COURSE RETRIEVAL WITH ORGANIZED CONTENT
  // ============================================

  async getCourseWithOrganizedContent(courseId: string, instructorId?: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          ...this.getCourseIncludeOptions(),
          sections: {
            include: {
              lessons: {
                include: {
                  contentItem: true, // One-to-one relationship
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

      // Organize content by lecture for easier frontend consumption
      const organizedCourse = this.organizeCourseContentByLecture(course);

      return this.convertNullsToUndefined(organizedCourse);
    } catch (error) {
      throw new BadRequestException(`Failed to get course: ${error.message}`);
    }
  }

  private organizeCourseContentByLecture(course: any) {
    const contentByLecture: Record<string, any> = {};

    // Organize content items by lesson
    course.sections?.forEach((section: any) => {
      section.lessons?.forEach((lesson: any) => {
        if (!contentByLecture[lesson.id]) {
          contentByLecture[lesson.id] = {
            contentItem: null, // Single content item per lesson
          };
        }

        // Each lesson has exactly one content item
        if (lesson.contentItem) {
          const item = lesson.contentItem;
          contentByLecture[lesson.id].contentItem = {
            id: item.id,
            title: item.title,
            description: item.description,
            type: item.type,
            fileUrl: item.fileUrl,
            fileName: item.fileName,
            fileSize: item.fileSize,
            mimeType: item.mimeType,
            contentData: item.contentData,
            order: item.order,
            isPublished: item.isPublished,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          };
        }
      });
    });

    return {
      ...course,
      organizedContent: {
        contentByLecture,
        summary: this.generateContentSummaryFromOrganized(contentByLecture),
      },
    };
  }

  private mapContentTypeToCategory(contentType: ContentType): string {
    const mapping: Record<ContentType, string> = {
      [ContentType.VIDEO]: 'videos',
      [ContentType.DOCUMENT]: 'documents',
      [ContentType.IMAGE]: 'images',
      [ContentType.AUDIO]: 'audio',
      [ContentType.ARCHIVE]: 'archives',
      [ContentType.TEXT]: 'text',
      [ContentType.ASSIGNMENT]: 'assignments',
      [ContentType.RESOURCE]: 'resources',
      [ContentType.LINK]: 'resources',
      [ContentType.QUIZ]: 'quizzes',
    };

    return mapping[contentType] || 'other';
  }

  private generateContentSummaryFromOrganized(contentByLecture: Record<string, any>) {
    const summary = {
      totalLectures: Object.keys(contentByLecture).length,
      totalContent: 0,
      contentTypes: {} as Record<string, number>,
      lectureBreakdown: {} as Record<string, any>,
    };

    Object.entries(contentByLecture).forEach(([lectureId, content]) => {
      let lectureTotal = 0;
      const lectureBreakdown: Record<string, number> = {};

      // Check if lecture has a content item
      if (content.contentItem) {
        lectureTotal = 1;
        summary.totalContent += 1;
        
        const contentType = this.mapContentTypeToCategory(content.contentItem.type);
        summary.contentTypes[contentType] = (summary.contentTypes[contentType] || 0) + 1;
        lectureBreakdown[contentType] = 1;
      }

      summary.lectureBreakdown[lectureId] = {
        total: lectureTotal,
        breakdown: lectureBreakdown,
      };
    });

    return summary;
  }

  // ============================================
  // ENHANCED CONTENT MANAGEMENT
  // ============================================

  async uploadContentToLecture(
    courseId: string,
    lectureId: string,
    instructorId: string,
    file: Express.Multer.File,
    contentType: ContentType,
    metadata: {
      title: string;
      description?: string;
      order?: number;
    },
  ) {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Verify lecture belongs to course
      const lecture = await this.prisma.lesson.findFirst({
        where: {
          id: lectureId,
          section: {
            courseId: courseId,
          },
        },
      });

      if (!lecture) {
        throw new NotFoundException('Lecture not found in this course');
      }

      // Use the upload service to store the file and get the URL
      const uploadResult = await this.uploadService.createDirectUpload(
        file,
        {
          type: contentType,
        }
      );

      // Create the content item with the uploaded file information
      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: metadata.title,
          description: metadata.description,
          type: contentType,
          fileUrl: uploadResult.fileInfo.file_url,
          fileName: uploadResult.fileInfo.originalName,
          fileSize: uploadResult.fileInfo.size,
          mimeType: uploadResult.fileInfo.mimetype,
          order: metadata.order || 0,
          isPublished: true,
          courseId,
          lessonId: lectureId,
          contentData: {
            uploadedAt: uploadResult.fileInfo.uploadedAt,
            filePath: uploadResult.fileInfo.filePath,
          }
        }
      });

      return {
        success: true,
        message: 'Content uploaded successfully to lecture',
        contentItem,
        fileInfo: uploadResult.fileInfo,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to upload content to lecture: ${error.message}`,
      );
    }
  }

  async createTextContentForLecture(
    courseId: string,
    lectureId: string,
    instructorId: string,
    contentData: {
      title: string;
      content: string;
      description?: string;
      order?: number;
    },
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Verify lecture belongs to course
      const lecture = await this.prisma.lesson.findFirst({
        where: {
          id: lectureId,
          section: {
            courseId: courseId,
          },
        },
      });

      if (!lecture) {
        throw new NotFoundException('Lecture not found in this course');
      }

      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: contentData.title,
          description: contentData.description,
          type: ContentType.TEXT,
          order: contentData.order || 0,
          isPublished: true,
          courseId,
          lessonId: lectureId,
          contentData: {
            textContent: contentData.content,
            createdAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        message: 'Text content created successfully for lecture',
        course: contentItem,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create text content for lecture',
        course: null,
        errors: [error.message || 'An unexpected error occurred while creating text content for lecture'],
      };
    }
  }

  async createAssignmentForLecture(
    courseId: string,
    lectureId: string,
    instructorId: string,
    assignmentData: {
      title: string;
      description: string;
      instructions?: string;
      dueDate?: string;
      points?: number;
      order?: number;
    },
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Verify lecture belongs to course
      const lecture = await this.prisma.lesson.findFirst({
        where: {
          id: lectureId,
          section: {
            courseId: courseId,
          },
        },
      });

      if (!lecture) {
        throw new NotFoundException('Lecture not found in this course');
      }

      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: assignmentData.title,
          description: assignmentData.description,
          type: ContentType.ASSIGNMENT,
          order: assignmentData.order || 0,
          isPublished: true,
          courseId,
          lessonId: lectureId,
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
        message: 'Assignment created successfully for lecture',
        course: contentItem,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create assignment for lecture',
        course: null,
        errors: [error.message || 'An unexpected error occurred while creating assignment for lecture'],
      };
    }
  }

  async createResourceForLecture(
    courseId: string,
    lectureId: string,
    instructorId: string,
    resourceData: {
      title: string;
      url: string;
      description?: string;
      resourceType: string;
      order?: number;
    },
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      // Verify lecture belongs to course
      const lecture = await this.prisma.lesson.findFirst({
        where: {
          id: lectureId,
          section: {
            courseId: courseId,
          },
        },
      });

      if (!lecture) {
        throw new NotFoundException('Lecture not found in this course');
      }

      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: resourceData.title,
          description: resourceData.description,
          type: ContentType.LINK,
          order: resourceData.order || 0,
          isPublished: true,
          courseId,
          lessonId: lectureId,
          contentData: {
            url: resourceData.url,
            resourceType: resourceData.resourceType,
            createdAt: new Date().toISOString(),
          },
        },
      });

      return {
        success: true,
        message: 'Resource created successfully for lecture',
        course: contentItem,
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to create resource for lecture',
        course: null,
        errors: [error.message || 'An unexpected error occurred while creating resource for lecture'],
      };
    }
  }

  // ============================================
  // ENHANCED VALIDATION WITH CONTENT CHECKING
  // ============================================

  async validateCourseForPublishing(courseId: string, instructorId: string) {
    try {
      const course = await this.getCourseWithOrganizedContent(courseId, instructorId);

      const validation = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[],
        completionPercentage: 0,
      };

      // Basic information validation
      if (!course.title || course.title.length < 10) {
        validation.errors.push('Course title must be at least 10 characters long');
      }

      if (!course.description || course.description.length < 100) {
        validation.errors.push('Course description must be at least 100 characters long');
      }

      if (!course.thumbnail) {
        validation.errors.push('Course thumbnail is required');
      }

      if (!course.objectives || course.objectives.length === 0) {
        validation.errors.push('At least one learning objective is required');
      }

      // Structure validation
      if (!course.sections || course.sections.length === 0) {
        validation.errors.push('At least one section is required');
      } else {
        // Calculate total lessons across all sections
        const totalLessons = course.sections.reduce(
          (total: number, section: any) => total + (section.lessons?.length || 0),
          0
        );

        if (totalLessons === 0) {
          validation.errors.push('At least one lesson is required');
        }

        
      }

      // Pricing validation
      if (course.enrollmentType === 'PAID' && (course.price || 0) <= 0) {
        validation.errors.push('Paid courses must have a price greater than 0');
      }

      // Calculate completion percentage
      // validation.completionPercentage = this.calculateCourseCompletionPercentage(course);

      // Final validation
      validation.isValid = validation.errors.length === 0 

      return validation;
    } catch (error) {
      throw new BadRequestException(`Failed to validate course: ${error.message}`);
    }
  }

  // ============================================
  // ENHANCED COURSE PUBLISHING
  // ============================================

  async publishCourse(
    courseId: string,
    instructorId: string,
  ): Promise<CourseCreationResponse> {
    try {
      const course = await this.verifyCourseOwnership(courseId, instructorId);

      // Enhanced validation before publishing
      const validationResult = await this.validateCourseForPublishing(courseId, instructorId);

      if (!validationResult.isValid) {
        return {
          success: false,
          message: 'Course validation failed. Please complete all requirements before publishing.',
          errors: validationResult.errors,
          warnings: validationResult.warnings,
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
        message: 'Course published successfully! Students can now enroll in your course.',
        course: this.convertNullsToUndefined(publishedCourse),
        completionPercentage: validationResult.completionPercentage,
        errors: [],
      };
    } catch (error) {

      return {
        success: false,
        message: 'Failed to publish course',
        course: null,
        completionPercentage: 0,
        errors: [error.message || 'An unexpected error occurred while publishing course'],
      };

    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private generateDraftContentSummary(draftData: any) {
    const summary = {
      hasBasicInfo: !!(draftData.title && draftData.description),
      hasStructure: !!(draftData.sections && draftData.sections.length > 0),
      hasContent: false,
      contentByLecture: {},
      totalContent: 0,
      lastModified: new Date().toISOString(),
    };

    // Check for organized content
    if (draftData._contentByLecture) {
      summary.contentByLecture = draftData._contentByLecture;
      summary.totalContent = Object.values(draftData._contentByLecture as Record<string, any>).reduce(
        (total: number, lectureContent: any) => {
          return total + Object.values(lectureContent as Record<string, any>).reduce(
            (lectureTotal: number, items: any) => lectureTotal + (Array.isArray(items) ? items.length : 0),
            0
          );
        },
        0
      );
      summary.hasContent = summary.totalContent > 0;
    }

    return summary;
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
  // EXISTING VALIDATION METHODS (Enhanced)
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
              contentItem: true, // One-to-one relationship
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
      contentItems: {
        where: {
          lessonId: null, // Course-level content items only
        },
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    } as any;
  }

  private calculateCourseCompletionPercentage(course: any): number {
    let completionScore = 0;
    const maxScore = 100;

    // Basic Information (30 points)
    if (course.title && course.title.length >= 10) completionScore += 5;
    if (course.description && course.description.length >= 100) completionScore += 10;
    if (course.shortDescription && course.shortDescription.length >= 50) completionScore += 5;
    if (course.category) completionScore += 5;
    if (course.level) completionScore += 5;

    // Learning Objectives (20 points)
    if (course.objectives && course.objectives.length >= 3) completionScore += 10;
    if (course.whatYouLearn && course.whatYouLearn.length >= 3) completionScore += 10;

    // Media Content (25 points)
    if (course.thumbnail) completionScore += 15;
    if (course.trailer) completionScore += 10;

    // Content Structure (15 points)
    if (course.sections && course.sections.length > 0) completionScore += 10;
    const totalLessons = course.sections?.reduce(
      (total: number, section: any) => total + (section.lessons?.length || 0),
      0,
    ) || 0;
    if (totalLessons > 0) completionScore += 5;

    // Content Items (10 points) - Enhanced with organized content
    if (course.organizedContent?.summary?.totalContent > 0) {
      completionScore += 10;
    }

    return Math.min(completionScore, maxScore);
  }

  // ============================================
  // EXISTING METHODS (Keep all existing functionality)
  // ============================================


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
                  contentItem: true, // One-to-one relationship
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
                  contentItem: true, // One-to-one relationship
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

                  // Duplicate content item (one-to-one relationship)
        if (lesson.contentItem) {
          await this.prisma.contentItem.create({
            data: {
              title: lesson.contentItem.title,
              description: lesson.contentItem.description,
              type: lesson.contentItem.type,
              fileUrl: lesson.contentItem.fileUrl,
              fileName: lesson.contentItem.fileName,
              fileSize: lesson.contentItem.fileSize,
              mimeType: lesson.contentItem.mimeType,
              contentData: lesson.contentItem.contentData as any,
              order: lesson.contentItem.order,
              isPublished: lesson.contentItem.isPublished,
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