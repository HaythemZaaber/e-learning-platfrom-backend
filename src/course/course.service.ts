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
  PaginationInput,
  PaginatedCoursesResponse,
} from './dto/course-creation.dto';
import {
  CourseStatus,
  UserRole,
  InstructorStatus,
  EnrollmentType,
  CourseLevel,
  ContentType,
  LectureType,
  Prisma,
} from '@prisma/client';
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

  /**
   * Calculate and determine field values from CreateCourseInput before creating the course
   * This method pre-processes the input to derive calculated fields
   */
  private calculateDerivedFieldsFromInput(input: CreateCourseInput): {
    totalSections: number;
    totalLectures: number;
    totalContentItems: number;
    estimatedHours: number;
    estimatedMinutes: number;
    difficulty: number;
    hasDiscussions: boolean;
    hasAssignments: boolean;
    hasQuizzes: boolean;
    hasLiveSessions: boolean;
    hasRecordings: boolean;
    downloadableResources: boolean;
    offlineAccess: boolean;
    mobileOptimized: boolean;
    completionRate: number;
    avgRating: number;
    totalRatings: number;
    views: number;
    uniqueViews: number;
    currentEnrollments: number;
    version: string;
    status: CourseStatus;
    enrollmentType: EnrollmentType;
    language: string;
    isPublic: boolean;
    certificate: boolean;
    accessibility: any;
    settings: any;
    metadata: any;
  } {
    // Calculate content counts
    const totalSections = input.sections?.length || 0;
    const totalLectures = input.sections?.reduce((total, section) => 
      total + (section.lectures?.length || 0), 0) || 0;
    const totalContentItems = (input.sections?.reduce((total, section) => 
      total + (section.lectures?.reduce((lectureTotal, lecture) => 
        lectureTotal + (lecture.contentItem ? 1 : 0), 0) || 0), 0) || 0) + 
      (input.additionalContent?.length || 0);

    // Calculate estimated duration
    const totalDurationMinutes = input.sections?.reduce((total, section) => 
      total + (section.lectures?.reduce((lectureTotal, lecture) => {
        // If duration is explicitly set and greater than 0, use it
        if (lecture.duration && lecture.duration > 0) {
          return lectureTotal + lecture.duration;
        }
        
        // Otherwise, estimate duration based on lecture type and content
        let estimatedDuration = 0;
        
        switch (lecture.type) {
          case 'VIDEO':
            // Estimate 5-15 minutes for video content
            estimatedDuration = lecture.contentItem?.type === 'QUIZ' ? 10 : 15;
            break;
          case 'TEXT':
            // Estimate based on content length (roughly 200 words per minute reading)
            const wordCount = lecture.content?.split(/\s+/).length || 0;
            estimatedDuration = Math.max(3, Math.ceil(wordCount / 200));
            break;
          case 'AUDIO':
            // Estimate 8-12 minutes for audio content
            estimatedDuration = 10;
            break;
          case 'QUIZ':
            // Estimate 5-10 minutes for quiz completion
            estimatedDuration = 8;
            break;
          case 'ASSIGNMENT':
            // Estimate 15-30 minutes for assignments
            estimatedDuration = 20;
            break;
          default:
            // Default 5 minutes for other types
            estimatedDuration = 5;
        }
        
        return lectureTotal + estimatedDuration;
      }, 0) || 0), 0) || 0;
    const estimatedHours = Math.floor(totalDurationMinutes / 60);
    const estimatedMinutes = totalDurationMinutes % 60;

    // Calculate difficulty based on level and content complexity
    const difficultyMap = {
      [CourseLevel.BEGINNER]: 1.0,
      [CourseLevel.INTERMEDIATE]: 2.5,
      [CourseLevel.ADVANCED]: 4.0,
      [CourseLevel.EXPERT]: 5.0,
    };
    const baseDifficulty = difficultyMap[input.level] || 1.0;
    const contentComplexity = totalLectures > 20 ? 0.5 : totalLectures > 10 ? 0.3 : 0.1;
    const difficulty = Math.min(5.0, baseDifficulty + contentComplexity);

    // Determine feature flags based on content
    const hasDiscussions = input.settings?.communication?.discussionForum ?? true;
    const hasAssignments = input.sections?.some(section => 
      section.lectures?.some(lecture => 
        lecture.contentItem?.type === ContentType.ASSIGNMENT)) || false;
    const hasQuizzes = input.sections?.some(section => 
      section.lectures?.some(lecture => 
        lecture.contentItem?.type === ContentType.QUIZ)) || false;
    const hasAIQuizzes = input.sections?.some(section => 
      section.lectures?.some(lecture => 
        lecture.contentItem?.type === ContentType.QUIZ && 
        lecture.settings?.hasAIQuiz)) || false;
    const hasInteractiveElements = input.sections?.some(section => 
      section.lectures?.some(lecture => 
        lecture.settings?.isInteractive || 
        lecture.contentItem?.type === ContentType.QUIZ)) || false;
    const hasProjectWork = input.sections?.some(section => 
      section.lectures?.some(lecture => 
        lecture.contentItem?.type === ContentType.ASSIGNMENT)) || false;

    // Determine live sessions and recordings
    const hasLiveSessions = input.hasLiveSessions ?? false;
    const hasRecordings = input.hasRecordings ?? false;

    // Determine content access settings
    const downloadableResources = input.settings?.content?.downloadableResources ?? true;
    const offlineAccess = input.settings?.content?.offlineAccess ?? false;
    const mobileOptimized = input.settings?.content?.mobileOptimized ?? true;

    // Initialize analytics fields
    const completionRate = 0; // Will be calculated after enrollments
    const avgRating = 0;
    const totalRatings = 0;
    const views = 0;
    const uniqueViews = 0;
    const currentEnrollments = 0;

    // Set version and status
    const version = "1.0";
    const status = CourseStatus.DRAFT;
    const enrollmentType = input.settings?.enrollmentType || EnrollmentType.FREE;
    const language = input.settings?.language || 'en';
    const isPublic = input.settings?.isPublic ?? true;
    const certificate = input.settings?.certificate ?? false;

    // Set accessibility settings
    const accessibility = input.settings?.accessibility || {
      captions: false,
      transcripts: false,
      audioDescription: false,
      signLanguage: false,
    };

    // Set settings and metadata
    const settings = input.settings || {};
    const metadata = {
      createdAt: new Date().toISOString(),
      totalSections,
      totalLectures,
      totalContentItems,
      estimatedDuration: `${estimatedHours}h ${estimatedMinutes}m`,
      difficulty,
      features: {
        hasDiscussions,
        hasAssignments,
        hasQuizzes,
        
      },
    };

    return {
      totalSections,
      totalLectures,
      totalContentItems,
      estimatedHours,
      estimatedMinutes,
      difficulty,
      hasDiscussions,
      hasAssignments,
      hasQuizzes,
      hasLiveSessions,
      hasRecordings,
      downloadableResources,
      offlineAccess,
      mobileOptimized,
      completionRate,
      avgRating,
      totalRatings,
      views,
      uniqueViews,
      currentEnrollments,
      version,
      status,
      enrollmentType,
      language,
      isPublic,
      certificate,
      accessibility,
      settings,
      metadata,
    };
  }

  async createCourse(
    instructorId: string,
    input: CreateCourseInput,
  ): Promise<CourseCreationResponse> {
    try {
      // Verify instructor permissions
      await this.verifyInstructorPermissions(instructorId);

      // Validate and sanitize input
      const sanitizedInput = this.sanitizeCourseInput(input);

      // Calculate derived fields from input
      const derivedFields = this.calculateDerivedFieldsFromInput(sanitizedInput);

      // Validate pricing logic
      this.validatePricing(
        sanitizedInput.price,
        sanitizedInput.originalPrice,
        sanitizedInput.settings?.enrollmentType || EnrollmentType.FREE,
      );

      // Use database transaction for complex operations
      const result = await this.prisma.$transaction(async (prisma) => {
        // 1. Create the main course with calculated fields
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
            
            // Calculated fields from input
            status: derivedFields.status,
            enrollmentType: derivedFields.enrollmentType,
            language: derivedFields.language,
            isPublic: derivedFields.isPublic,
            certificate: derivedFields.certificate,
            totalSections: derivedFields.totalSections,
            totalLectures: derivedFields.totalLectures,
            totalContentItems: derivedFields.totalContentItems,
            estimatedHours: derivedFields.estimatedHours,
            estimatedMinutes: derivedFields.estimatedMinutes,
            difficulty: derivedFields.difficulty,
            hasDiscussions: derivedFields.hasDiscussions,
            hasAssignments: derivedFields.hasAssignments,
            hasQuizzes: derivedFields.hasQuizzes,
            hasLiveSessions: derivedFields.hasLiveSessions,
            hasRecordings: derivedFields.hasRecordings,
            
            downloadableResources: derivedFields.downloadableResources,
            offlineAccess: derivedFields.offlineAccess,
            mobileOptimized: derivedFields.mobileOptimized,
            completionRate: derivedFields.completionRate,
            avgRating: derivedFields.avgRating,
            totalRatings: derivedFields.totalRatings,
            views: derivedFields.views,
            uniqueViews: derivedFields.uniqueViews,
            currentEnrollments: derivedFields.currentEnrollments,
            version: derivedFields.version,
            accessibility: derivedFields.accessibility,
            settings: derivedFields.settings,
            metadata: derivedFields.metadata,
          },
        });

        // 2. Create sections and lectures
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

            // Create lectures for this section
            if (sectionInput.lectures && sectionInput.lectures.length > 0) {
              for (const [lectureIndex, lectureInput] of sectionInput.lectures.entries()) {
                const lecture = await prisma.lecture.create({
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
                lectureMap.set(lectureInput.id, lecture.id);

                // Create content item for this lecture if provided
                if (lectureInput.contentItem) {
                  console.log(`Creating content item for lecture ${lecture.id}:`, lectureInput.contentItem);
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
                      lectureId: lecture.id,
                    },
                  });
                  console.log(`Created content item:`, contentItem);
                } else {
                  console.log(`No content item provided for lecture ${lecture.id}`);
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
      lectureId?: string;
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
          lectureId: contentData.lectureId,
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
      lectureId?: string;
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
          lectureId: assignmentData.lectureId,
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
      lectureId?: string;
      order?: number;
    },
  ): Promise<CourseCreationResponse> {
    try {
      await this.verifyCourseOwnership(courseId, instructorId);

      const contentItem = await this.prisma.contentItem.create({
        data: {
          title: resourceData.title,
          description: resourceData.description,
          type: ContentType.RESOURCE,
          order: resourceData.order || 0,
          isPublished: true,
          courseId,
          lectureId: resourceData.lectureId,
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

      // Use database transaction for complex operations with increased timeout
      const result = await this.prisma.$transaction(
        async (prisma) => {
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
            hasLiveSessions: sanitizedInput.hasLiveSessions,
            hasRecordings: sanitizedInput.hasRecordings,
            settings: sanitizedInput.settings || {},
            accessibility: sanitizedInput.settings?.accessibility || {
              captions: false,
              transcripts: false,
              audioDescription: false,
            },
            updatedAt: new Date(),
          },
        });

        // 2. Handle sections and lectures updates if provided
        if (sanitizedInput.sections && sanitizedInput.sections.length > 0) {
          // Get existing sections to track what needs to be updated/deleted
          const existingSections = await prisma.section.findMany({
            where: { courseId },
            include: {
              lectures: {
                include: {
                  contentItem: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          });

          // Create maps for efficient lookup
          const existingSectionMap = new Map(existingSections.map(s => [s.id, s]));
          const existingLectureMap = new Map();
          existingSections.forEach(section => {
            section.lectures.forEach(lecture => {
              existingLectureMap.set(lecture.id, lecture);
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

            // Handle lectures for this section
            if (sectionInput.lectures && sectionInput.lectures.length > 0) {
              for (const [lectureIndex, lectureInput] of sectionInput.lectures.entries()) {
                let lecture;
                
                if (existingLectureMap.has(lectureInput.id)) {
                  // Update existing lecture
                  lecture = await prisma.lecture.update({
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
                  // Create new lecture
                  lecture = await prisma.lecture.create({
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

                // Handle content item for this lecture
                if (lectureInput.contentItem) {
                  // Check if lecture already has a content item
                  const existingContentItem = await prisma.contentItem.findFirst({
                    where: { lectureId: lecture.id },
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
                        lectureId: lecture.id,
                      },
                    });
                  }
                }
              }
            }
          }

          // Delete sections and lectures that are no longer in the input
          const inputSectionIds = new Set(sanitizedInput.sections.map(s => s.id));
          const inputLectureIds = new Set();
          sanitizedInput.sections.forEach(section => {
            section.lectures.forEach(lecture => {
              inputLectureIds.add(lecture.id);
            });
          });

          // Delete lectures that are no longer in input
          for (const existingSection of existingSections) {
            for (const lecture of existingSection.lectures) {
              if (!inputLectureIds.has(lecture.id)) {
                // Delete content item first (if exists)
                if (lecture.contentItem) {
                  await prisma.contentItem.delete({
                    where: { id: lecture.contentItem.id },
                  });
                }
                // Delete lecture
                await prisma.lecture.delete({
                  where: { id: lecture.id },
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
              lectureId: null, // Course-level content items only
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

        // Recalculate course duration after all updates
        await this.recalculateCourseDurationWithPrisma(prisma, course.id);

        // Return just the course ID to avoid heavy query in transaction
        return { id: course.id };
      }, {
        timeout: 30000, // 30 seconds timeout
      });

      // Fetch the complete updated course data outside the transaction
      const completeCourse = await this.prisma.course.findUnique({
        where: { id: result.id },
        include: this.getCourseIncludeOptions(),
      });

      // Convert null values to undefined for GraphQL compatibility
      const courseWithUndefined = this.convertNullsToUndefined(completeCourse);

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

      // Recalculate course duration after basic info update
      await this.recalculateCourseDuration(courseId);

      // Get the updated course with recalculated duration
      const finalCourse = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: this.getCourseIncludeOptions(),
      });

      return {
        success: true,
        message: 'Course basic information updated successfully',
        course: this.convertNullsToUndefined(finalCourse),
        completionPercentage: this.calculateCourseCompletionPercentage(finalCourse),
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
      if (settings.hasLiveSessions !== undefined) {
        updateData.hasLiveSessions = settings.hasLiveSessions;
      }
      if (settings.hasRecordings !== undefined) {
        updateData.hasRecordings = settings.hasRecordings;
      }

      const updatedCourse = await this.prisma.course.update({
        where: { id: courseId },
        data: updateData,
        include: this.getCourseIncludeOptions(),
      });

      // Recalculate course duration after settings update
      await this.recalculateCourseDuration(courseId);

      // Get the updated course with recalculated duration
      const finalCourse = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: this.getCourseIncludeOptions(),
      });

      return {
        success: true,
        message: 'Course settings updated successfully',
        course: this.convertNullsToUndefined(finalCourse),
        completionPercentage: this.calculateCourseCompletionPercentage(finalCourse),
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
              lectures: {
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

      // Recalculate duration to ensure it's up-to-date
      await this.recalculateCourseDuration(courseId);

      // Get the updated course with recalculated duration
      const updatedCourse = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          ...this.getCourseIncludeOptions(),
          sections: {
            include: {
              lectures: {
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

      // Organize content by lecture for easier frontend consumption
      const organizedCourse = this.organizeCourseContentByLecture(updatedCourse);

      return this.convertNullsToUndefined(organizedCourse);
    } catch (error) {
      throw new BadRequestException(`Failed to get course: ${error.message}`);
    }
  }

  private organizeCourseContentByLecture(course: any) {
    const contentByLecture: Record<string, any> = {};

    // Organize content items by lecture
    course.sections?.forEach((section: any) => {
      section.lectures?.forEach((lecture: any) => {
        if (!contentByLecture[lecture.id]) {
          contentByLecture[lecture.id] = {
            contentItem: null, // Single content item per lecture
          };
        }

        // Each lecture has exactly one content item
        if (lecture.contentItem) {
          const item = lecture.contentItem;
          contentByLecture[lecture.id].contentItem = {
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
      const lecture = await this.prisma.lecture.findFirst({
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
          lectureId: lectureId,
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
      const lecture = await this.prisma.lecture.findFirst({
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
          lectureId: lectureId,
          contentData: {
            textContent: contentData.content,
            createdAt: new Date().toISOString(),
          },
        },
      });

      // Update lecture content and recalculate duration
      await this.prisma.lecture.update({
        where: { id: lectureId },
        data: { 
          content: contentData.content,
          type: 'TEXT'
        }
      });

      // Recalculate lecture duration
      await this.updateLectureDuration(lectureId);

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
      const lecture = await this.prisma.lecture.findFirst({
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
          lectureId: lectureId,
          contentData: {
            instructions: assignmentData.instructions,
            dueDate: assignmentData.dueDate,
            points: assignmentData.points,
            createdAt: new Date().toISOString(),
          },
        },
      });

      // Update lecture type and recalculate duration
      await this.prisma.lecture.update({
        where: { id: lectureId },
        data: { 
          type: 'ASSIGNMENT',
          content: assignmentData.description
        }
      });

      // Recalculate lecture duration
      await this.updateLectureDuration(lectureId);

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
      const lecture = await this.prisma.lecture.findFirst({
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
          type: ContentType.RESOURCE,
          order: resourceData.order || 0,
          isPublished: true,
          courseId,
          lectureId: lectureId,
          contentData: {
            url: resourceData.url,
            resourceType: resourceData.resourceType,
            createdAt: new Date().toISOString(),
          },
        },
      });

      // Update lecture type and recalculate duration
      await this.prisma.lecture.update({
        where: { id: lectureId },
        data: { 
          type: 'RESOURCE',
          content: resourceData.description || resourceData.title
        }
      });

      // Recalculate lecture duration
      await this.updateLectureDuration(lectureId);

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
        // Calculate total lectures across all sections
        const totalLectures = course.sections.reduce(
          (total: number, section: any) => total + (section.lectures?.length || 0),
          0
        );

        if (totalLectures === 0) {
          validation.errors.push('At least one lecture is required');
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

  async unpublishCourse(
    courseId: string,
    instructorId: string,
  ): Promise<CourseCreationResponse> {
    try {
      const course = await this.verifyCourseOwnership(courseId, instructorId);

      // Check if course is currently published
      if (course.status !== CourseStatus.PUBLISHED) {
        return {
          success: false,
          message: 'Course is not currently published',
          course: null,
          completionPercentage: 0,
          errors: ['Course must be published to unpublish it'],
        };
      }

      // Check if course has active enrollments
      const enrollmentCount = await this.prisma.enrollment.count({
        where: { courseId },
      });

      if (enrollmentCount > 0) {
        return {
          success: false,
          message: 'Cannot unpublish course with active enrollments',
          course: null,
          completionPercentage: 0,
          errors: ['Course has active enrollments and cannot be unpublished'],
        };
      }

      const unpublishedCourse = await this.prisma.course.update({
        where: { id: courseId },
        data: {
          status: CourseStatus.DRAFT,
          publishedAt: null,
          updatedAt: new Date(),
        },
        include: this.getCourseIncludeOptions(),
      });

      return {
        success: true,
        message: 'Course unpublished successfully. It is now in draft mode.',
        course: this.convertNullsToUndefined(unpublishedCourse),
        completionPercentage: this.calculateCourseCompletionPercentage(unpublishedCourse),
        errors: [],
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to unpublish course',
        course: null,
        completionPercentage: 0,
        errors: [error.message || 'An unexpected error occurred while unpublishing course'],
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
          email: true,
          firstName: true,
          lastName: true,
          profileImage: true,
          title: true,
          bio: true,
          instructorBio: true,
          expertise: true,
        },
      },
      sections: {
        include: {
          lectures: {
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
          lectureId: null, // Course-level content items only
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
    const totalLectures = course.sections?.reduce(
      (total: number, section: any) => total + (section.lectures?.length || 0),
      0,
    ) || 0;
    if (totalLectures > 0) completionScore += 5;

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
          instructor: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              profileImage: true,
              bio: true,
              expertise: true,
            },
          },
          sections: {
            include: {
              lectures: {
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

      // Recalculate duration to ensure it's up-to-date
      await this.recalculateCourseDuration(courseId);

      // Get the updated course with recalculated duration
      const updatedCourse = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          ...this.getCourseIncludeOptions(),
          contentItems: {
            orderBy: { order: 'asc' as SortOrder },
          },
          sections: {
            include: {
              lectures: {
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

      return this.convertNullsToUndefined(updatedCourse);
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

  async getAllCourses(
    filters?: CourseFiltersInput,
    pagination?: PaginationInput,
  ): Promise<PaginatedCoursesResponse> {
    try {
      const page = pagination?.page || 1;
      const limit = pagination?.limit || 10;
      const skip = (page - 1) * limit;

      const where: Prisma.CourseWhereInput = {
        // isPublic: true,
        status: CourseStatus.PUBLISHED,
      };

      // Apply comprehensive filters
      if (filters) {
        // Search filter
        if (filters.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } },
            { shortDescription: { contains: filters.search, mode: 'insensitive' } },
          ];
        }

        // Categories filter
        if (filters.categories && filters.categories.length > 0) {
          where.category = { in: filters.categories };
        }

        // Price range filter
        if (filters.priceRange) {
          where.price = {
            gte: filters.priceRange.min,
            lte: filters.priceRange.max,
          };
        }

        // Levels filter
        if (filters.levels && filters.levels.length > 0) {
          where.level = { in: filters.levels };
        }

        // Duration filter (based on estimated hours)
        if (filters.durations && filters.durations.length > 0) {
          const durationConditions = filters.durations.map(duration => {
            switch (duration) {
              case '0-2':
                return { estimatedHours: { gte: 0, lte: 2 } };
              case '2-5':
                return { estimatedHours: { gte: 2, lte: 5 } };
              case '5-10':
                return { estimatedHours: { gte: 5, lte: 10 } };
              case '10+':
                return { estimatedHours: { gte: 10 } };
              default:
                return {};
            }
          });
          where.OR = durationConditions;
        }

        // Ratings filter
        if (filters.ratings && filters.ratings.length > 0) {
          const ratingConditions = filters.ratings.map(rating => ({
            avgRating: { gte: rating },
          }));
          where.OR = ratingConditions;
        }

        // Featured courses filter
        if (filters.showFeatured) {
          where.isFeatured = true;
        }

        // Individual filters (for backward compatibility)
        if (filters.category) {
          where.category = filters.category;
        }
        if (filters.level) {
          where.level = filters.level;
        }
        if (filters.enrollmentType) {
          where.enrollmentType = filters.enrollmentType;
        }
        if (filters.tags && filters.tags.length > 0) {
          where.seoTags = {
            hasSome: filters.tags,
          };
        }
      }

      // Determine sort order
      let orderBy: Prisma.CourseOrderByWithRelationInput = { createdAt: 'desc' };
      if (filters?.sortBy) {
        switch (filters.sortBy) {
          case 'newest':
            orderBy = { createdAt: 'desc' };
            break;
          case 'oldest':
            orderBy = { createdAt: 'asc' };
            break;
          case 'price_low':
            orderBy = { price: 'asc' };
            break;
          case 'price_high':
            orderBy = { price: 'desc' };
            break;
          case 'rating':
            orderBy = { avgRating: 'desc' };
            break;
          case 'popular':
            orderBy = { views: 'desc' };
            break;
          case 'featured':
            orderBy = { isFeatured: 'desc' };
            break;
          default:
            orderBy = { createdAt: 'desc' };
        }
      }

      // Get total count for pagination
      const total = await this.prisma.course.count({ where });

      // Get courses with pagination
      const courses = await this.prisma.course.findMany({
        where,
        include: this.getCourseIncludeOptions(),
        orderBy,
        skip,
        take: limit,
      });

      const totalPages = Math.ceil(total / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        courses: courses.map((course) => this.convertNullsToUndefined(course)) as any,
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get all courses: ${error.message}`);
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

  async getFeaturedCourses(limit: number = 6) {
    try {
      const courses = await this.prisma.course.findMany({
        where: {
          isPublic: true,
          status: CourseStatus.PUBLISHED,
          isFeatured: true,
        },
        include: this.getCourseIncludeOptions(),
        orderBy: [
          { avgRating: 'desc' },
          { currentEnrollments: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      });

      return courses.map((course) => this.convertNullsToUndefined(course));
    } catch (error) {
      throw new BadRequestException(
        `Failed to get featured courses: ${error.message}`,
      );
    }
  }

  async getTrendingCourses(limit: number = 6) {
    try {
      const courses = await this.prisma.course.findMany({
        where: {
          isPublic: true,
          status: CourseStatus.PUBLISHED,
          isTrending: true,
        },
        include: this.getCourseIncludeOptions(),
        orderBy: [
          { currentEnrollments: 'desc' },
          { views: 'desc' },
          { avgRating: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      });

      return courses.map((course) => this.convertNullsToUndefined(course));
    } catch (error) {
      throw new BadRequestException(
        `Failed to get trending courses: ${error.message}`,
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

      // Get course details for file cleanup
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: {
          thumbnail: true,
          trailer: true,
          instructorId: true,
        },
      });

      // Delete the course (this will cascade delete related content)
      await this.prisma.course.delete({
        where: { id: courseId },
      });

      // Clean up associated files if they exist
      if (course) {
        try {
          if (course.thumbnail) {
            await this.uploadService.deleteCourseThumbnail(
              course.thumbnail,
              instructorId,
              { courseId }
            );
          }
          // Note: Trailer cleanup would need to be implemented in upload service
          // if (course.trailer) {
          //   await this.uploadService.deleteCourseTrailer(course.trailer, instructorId);
          // }
        } catch (error) {
          console.error('Failed to clean up course files:', error);
          // Continue with course deletion even if file cleanup fails
        }
      }

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

      // Recalculate course duration if content item is associated with a lecture
      if (contentItem.lectureId) {
        await this.updateLectureDuration(contentItem.lectureId);
      }

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

      // Recalculate course duration if content item was associated with a lecture
      if (contentItem.lectureId) {
        await this.updateLectureDuration(contentItem.lectureId);
      }

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

      // Recalculate course duration after section update
      await this.recalculateCourseDuration(section.courseId);

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

      // Recalculate course duration after section deletion
      await this.recalculateCourseDuration(section.courseId);

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

  /**
   * Calculate estimated duration for a lecture based on its type and content
   */
  private calculateLectureDuration(lecture: any): number {
    // If duration is explicitly set and greater than 0, use it
    if (lecture.duration && lecture.duration > 0) {
      return lecture.duration;
    }
    
    // Otherwise, estimate duration based on lecture type and content
    let estimatedDuration = 0;
    
    switch (lecture.type) {
      case 'VIDEO':
        // Estimate 5-15 minutes for video content
        estimatedDuration = lecture.contentItem?.type === 'QUIZ' ? 10 : 15;
        break;
      case 'TEXT':
        // Estimate based on content length (roughly 200 words per minute reading)
        const wordCount = lecture.content?.split(/\s+/).length || 0;
        estimatedDuration = Math.max(3, Math.ceil(wordCount / 200));
        break;
      case 'AUDIO':
        // Estimate 8-12 minutes for audio content
        estimatedDuration = 10;
        break;
      case 'QUIZ':
        // Estimate 5-10 minutes for quiz completion
        estimatedDuration = 8;
        break;
      case 'ASSIGNMENT':
        // Estimate 15-30 minutes for assignments
        estimatedDuration = 20;
        break;
      default:
        // Default 5 minutes for other types
        estimatedDuration = 5;
    }
    
    return estimatedDuration;
  }

  /**
   * Update lecture duration and recalculate course total duration
   */
  private async updateLectureDuration(lectureId: string): Promise<void> {
    const lecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { 
        contentItem: true,
        section: { include: { course: true } }
      }
    });

    if (!lecture) return;

    const calculatedDuration = this.calculateLectureDuration(lecture);
    
    // Update the lecture duration if it's different
    if (lecture.duration !== calculatedDuration) {
      await this.prisma.lecture.update({
        where: { id: lectureId },
        data: { duration: calculatedDuration }
      });
    }

    // Recalculate course total duration
    await this.recalculateCourseDuration(lecture.section.courseId);
  }

  /**
   * Recalculate total course duration based on all lectures
   */
  private async recalculateCourseDuration(courseId: string): Promise<void> {
    return this.recalculateCourseDurationWithPrisma(this.prisma, courseId);
  }

  private async recalculateCourseDurationWithPrisma(prisma: any, courseId: string): Promise<void> {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lectures: {
              include: { contentItem: true }
            }
          }
        }
      }
    });

    if (!course) return;

    let totalDurationMinutes = 0;
    
    for (const section of course.sections) {
      for (const lecture of section.lectures) {
        totalDurationMinutes += this.calculateLectureDuration(lecture);
      }
    }

    const estimatedHours = Math.floor(totalDurationMinutes / 60);
    const estimatedMinutes = totalDurationMinutes % 60;

    // Count total content items (both lecture-associated and course-level)
    const totalContentItems = course.sections.reduce((total, section) => {
      const lectureContentItems = section.lectures.reduce((lectureTotal, lecture) => {
        return lectureTotal + (lecture.contentItem ? 1 : 0);
      }, 0);
      return total + lectureContentItems;
    }, 0);

    // Update course with new duration and content count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        estimatedHours,
        estimatedMinutes,
        totalContentItems
      }
    });
  }

  async updateLecture(
    lectureId: string,
    instructorId: string,
    updateData: {
      title?: string;
      description?: string;
      type?: LectureType;
      content?: string;
      duration?: number;
      order?: number;
      isPreview?: boolean;
      isInteractive?: boolean;
      settings?: any;
    },
  ) {
    try {
      const lecture = await this.prisma.lecture.findUnique({
        where: { id: lectureId },
        include: { section: { include: { course: true } } },
      });

      if (!lecture) {
        throw new NotFoundException('Lecture not found');
      }

      if (lecture.section.course.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to update this lecture');
      }

      const updatedLecture = await this.prisma.lecture.update({
        where: { id: lectureId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      // Recalculate duration if content was updated
      if (updateData.content || updateData.type) {
        await this.updateLectureDuration(lectureId);
      }

      return {
        success: true,
        message: 'Lecture updated successfully',
        lecture: updatedLecture,
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to update lecture: ${error.message}`,
      );
    }
  }

  async deleteLecture(lectureId: string, instructorId: string) {
    try {
      const lecture = await this.prisma.lecture.findUnique({
        where: { id: lectureId },
        include: { section: { include: { course: true } } },
      });

      if (!lecture) {
        throw new NotFoundException('Lecture not found');
      }

      if (lecture.section.course.instructorId !== instructorId) {
        throw new ForbiddenException('You do not have permission to delete this lecture');
      }

      await this.prisma.lecture.delete({
        where: { id: lectureId },
      });

      // Recalculate course duration after lecture deletion
      await this.recalculateCourseDuration(lecture.section.courseId);

      return {
        success: true,
        message: 'Lecture deleted successfully',
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to delete lecture: ${error.message}`,
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
              lectures: {
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
          thumbnail: originalCourse.thumbnail, // Will be copied if exists
          trailer: originalCourse.trailer, // Will be copied if exists
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
          totalLectures: originalCourse.totalLectures,
          totalSections: originalCourse.totalSections,
          estimatedHours: originalCourse.estimatedHours,
          estimatedMinutes: originalCourse.estimatedMinutes,
          difficulty: originalCourse.difficulty,
          hasDiscussions: originalCourse.hasDiscussions,
          
        },
      });

      // Note: File copying (thumbnails, trailers) would need to be implemented
      // in the upload service. For now, we'll use the original URLs.
      // TODO: Implement copyCourseThumbnail and copyCourseTrailer methods in UploadService

      // Duplicate sections and lectures
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

        // Duplicate lectures
        for (const lecture of section.lectures) {
          const duplicatedLecture = await this.prisma.lecture.create({
            data: {
              title: lecture.title,
              description: lecture.description,
              type: lecture.type,
              content: lecture.content,
              duration: lecture.duration,
              order: lecture.order,
              isPreview: lecture.isPreview,
              isInteractive: lecture.isInteractive,
              hasAIQuiz: lecture.hasAIQuiz,
              aiSummary: lecture.aiSummary,
              transcription: lecture.transcription,
              captions: lecture.captions,
              transcript: lecture.transcript,
              settings: lecture.settings as any,
              sectionId: duplicatedSection.id,
            },
          });

                  // Duplicate content item (one-to-one relationship)
        if (lecture.contentItem) {
          await this.prisma.contentItem.create({
            data: {
              title: lecture.contentItem.title,
              description: lecture.contentItem.description,
              type: lecture.contentItem.type,
              fileUrl: lecture.contentItem.fileUrl,
              fileName: lecture.contentItem.fileName,
              fileSize: lecture.contentItem.fileSize,
              mimeType: lecture.contentItem.mimeType,
              contentData: lecture.contentItem.contentData as any,
              order: lecture.contentItem.order,
              isPublished: lecture.contentItem.isPublished,
              courseId: duplicatedCourse.id,
              lectureId: duplicatedLecture.id,
            },
          });
        }
        }
      }

      // Duplicate course-level content items
      // for (const contentItem of originalCourse.contentItems) {
      //   await this.prisma.contentItem.create({
      //     data: {
      //       title: contentItem.title,
      //       description: contentItem.description,
      //       type: contentItem.type,
      //       fileUrl: contentItem.fileUrl,
      //       fileName: contentItem.fileName,
      //       fileSize: contentItem.fileSize,
      //       mimeType: contentItem.mimeType,
      //       contentData: contentItem.contentData as any,
      //       order: contentItem.order,
      //       isPublished: contentItem.isPublished,
      //       courseId: duplicatedCourse.id,
      //     },
      //   });
      // }

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

  // ============================================
  // COURSE SHARING FUNCTIONALITY
  // ============================================



  // ============================================
  // COURSE SOCIAL MEDIA SHARING FUNCTIONALITY
  // ============================================

  async getCourseShareLinks(
    courseId: string,
    instructorId?: string
  ): Promise<{
    success: boolean;
    message: string;
    shareData: {
      courseUrl: string;
      socialLinks: {
        facebook: string;
        twitter: string;
        linkedin: string;
        whatsapp: string;
        telegram: string;
        email: string;
      };
      embedCode: string;
      qrCode?: string;
    } | undefined;
    errors?: string[];
  }> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!course) {
        return {
          success: false,
          message: 'Course not found',
          shareData: undefined,
          errors: ['Course not found'],
        };
      }

      // Check if course is public or user has access
      if (!course.isPublic && course.instructorId !== instructorId) {
        return {
          success: false,
          message: 'Access denied',
          shareData: undefined,
          errors: ['You do not have permission to share this course'],
        };
      }

      // Create course URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const courseUrl = `${baseUrl}/course/${courseId}`;

      // Prepare share text
      const shareText = `${course.title} by ${course.instructor?.firstName || 'Instructor'} ${course.instructor?.lastName || ''}`;
      const shareDescription = course.shortDescription || course.description.substring(0, 100) + '...';

      // Generate social media links
      const socialLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(courseUrl)}&quote=${encodeURIComponent(shareText)}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(courseUrl)}&text=${encodeURIComponent(shareText)}&hashtags=elearning,education`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(courseUrl)}`,
        whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareText} - ${courseUrl}`)}`,
        telegram: `https://t.me/share/url?url=${encodeURIComponent(courseUrl)}&text=${encodeURIComponent(shareText)}`,
        email: `mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(`${shareDescription}\n\n${courseUrl}`)}`,
      };

      // Generate embed code for websites
      const embedCode = `<iframe src="${baseUrl}/embed/course/${courseId}" width="100%" height="400" frameborder="0" allowfullscreen></iframe>`;

      return {
        success: true,
        message: 'Share links generated successfully',
        shareData: {
          courseUrl,
          socialLinks,
          embedCode,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate share links',
        shareData: undefined,
        errors: [error.message || 'An unexpected error occurred'],
      };
    }
  }

  async copyCourseShareLink(
    courseId: string,
    instructorId?: string
  ): Promise<{
    success: boolean;
    message: string;
    shareUrl?: string;
    errors?: string[];
  }> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return {
          success: false,
          message: 'Course not found',
          errors: ['Course not found'],
        };
      }

      // Check if course is public or user has access
      if (!course.isPublic && course.instructorId !== instructorId) {
        return {
          success: false,
          message: 'Access denied',
          errors: ['You do not have permission to share this course'],
        };
      }

      // Create course URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const shareUrl = `${baseUrl}/course/${courseId}`;

      return {
        success: true,
        message: 'Course URL copied to clipboard',
        shareUrl,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to copy course URL',
        errors: [error.message || 'An unexpected error occurred'],
      };
    }
  }

  async generateCourseQRCode(
    courseId: string,
    instructorId?: string
  ): Promise<{
    success: boolean;
    message: string;
    qrCodeUrl?: string;
    errors?: string[];
  }> {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      if (!course) {
        return {
          success: false,
          message: 'Course not found',
          errors: ['Course not found'],
        };
      }

      // Check if course is public or user has access
      if (!course.isPublic && course.instructorId !== instructorId) {
        return {
          success: false,
          message: 'Access denied',
          errors: ['You do not have permission to share this course'],
        };
      }

      // Create course URL
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const courseUrl = `${baseUrl}/course/${courseId}`;

      // Generate QR code URL using a QR code service
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(courseUrl)}`;

      return {
        success: true,
        message: 'QR code generated successfully',
        qrCodeUrl,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to generate QR code',
        errors: [error.message || 'An unexpected error occurred'],
      };
    }
  }

  // ============================================
  // COURSE PREVIEW AND LECTURE FUNCTIONALITY
  // ============================================

  async getCoursePreview(courseId: string, userId?: string) {
    try {
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: {
          instructor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              profileImage: true,
              instructorBio: true,
              expertise: true,
            },
          },
          sections: {
            include: {
              lectures: {
                include: {
                  contentItem: true,
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          reviews: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  profileImage: true,
                },
              },
            },
            take: 5,
            orderBy: { createdAt: 'desc' },
          },
          enrollments: userId ? {
            where: { userId },
            take: 1,
          } : undefined,
        },
      });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Check if user is enrolled
      let enrollment: any = null;
      let progress: any = null;
      let userProgressMap: Map<string, boolean> = new Map();
      
      if (userId) {
        enrollment = course.enrollments?.[0] || null;
        if (enrollment) {
          progress = await this.getCourseProgress(courseId, userId);
          
          // Get completion status for each lecture
          const lectureProgress = await this.prisma.progress.findMany({
            where: {
              userId,
              courseId,
            },
            select: {
              lectureId: true,
              completed: true,
            },
          });
          
          lectureProgress.forEach((p) => {
            if (p.lectureId) {
              userProgressMap.set(p.lectureId, p.completed);
            }
          });
        }
      }

      // Add completion status to lectures
      const sectionsWithProgress = course.sections?.map(section => ({
        ...section,
        lectures: section.lectures.map(lecture => ({
          ...lecture,
          isCompleted: userProgressMap.get(lecture.id) || false,
          isLocked: this.isLectureLocked(lecture, userId),
        })),
      }));

      const result = {
        ...course,
        sections: sectionsWithProgress,
        enrollment: enrollment ? {
          id: enrollment.id,
          status: enrollment.status,
          progress: enrollment.progress,
          currentLessonId: enrollment.currentLectureId,
          lastAccessedAt: enrollment.lastAccessedAt,
          completedAt: enrollment.completedAt,
        } : undefined,
        progress: progress || undefined,
      };

      return result;
    } catch (error) {
      throw new BadRequestException(`Failed to get course preview: ${error.message}`);
    }
  }

  async getLecturePreview(courseId: string, lectureId: string, userId?: string) {
    try {
      const lecture = await this.prisma.lecture.findFirst({
        where: {
          id: lectureId,
          section: {
            courseId: courseId,
          },
        },
        include: {
          contentItem: true,
          section: {
            include: {
              course: {
                include: {
                  instructor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      username: true,
                      profileImage: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!lecture) {
        throw new NotFoundException('Lecture not found');
      }

      // Get navigation info
      const [previousLecture, nextLecture] = await Promise.all([
        this.getPreviousLecture(lectureId, courseId),
        this.getNextLecture(lectureId, courseId),
      ]);

      // Check if user has completed this lecture
      let isCompleted = false;
      if (userId) {
        const progress = await this.prisma.progress.findUnique({
          where: {
            userId_courseId_lectureId: {
              userId,
              courseId,
              lectureId,
            },
          },
        });
        isCompleted = progress?.completed || false;
      }

      return {
        ...lecture,
        isCompleted,
        isLocked: this.isLectureLocked(lecture, userId),
        previousLecture,
        nextLecture,
        course: {
          id: lecture.section.course.id,
          title: lecture.section.course.title,
          description: lecture.section.course.description,
          thumbnail: lecture.section.course.thumbnail,
          level: lecture.section.course.level,
          status: lecture.section.course.status,
          price: lecture.section.course.price,
          currency: lecture.section.course.currency,
          totalSections: lecture.section.course.totalSections,
          totalLectures: lecture.section.course.totalLectures,
          estimatedHours: lecture.section.course.estimatedHours,
          estimatedMinutes: lecture.section.course.estimatedMinutes,
          difficulty: lecture.section.course.difficulty,
          instructorId: lecture.section.course.instructorId,
          instructor: lecture.section.course.instructor,
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get lecture preview: ${error.message}`);
    }
  }

  async getCourseProgress(courseId: string, userId: string) {
    try {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
      });

      if (!enrollment) {
        throw new NotFoundException('User not enrolled in this course');
      }

      const progress = await this.prisma.progress.findMany({
        where: {
          userId,
          course: { id: courseId },
        },
        include: {
          lecture: {
            include: {
              section: true,
            },
          },
        },
      });

      const totalLectures = await this.prisma.lecture.count({
        where: {
          section: { courseId },
        },
      });

      const completedLectures = progress.filter(p => p.completed).length;
      const completedSections = new Set(
        progress.filter(p => p.completed && p.lecture).map(p => p.lecture!.sectionId)
      ).size;

      const totalTimeSpent = progress.reduce((sum, p) => sum + p.timeSpent, 0);
      const watchTime = progress.reduce((sum, p) => sum + (p.watchTime || 0), 0);

      const lastWatchedLecture = progress
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .find(p => p.timeSpent > 0)?.lectureId;

      return {
        completedLectures,
        totalLectures,
        completedSections,
        lastWatchedLecture,
        timeSpent: Math.round(totalTimeSpent / 60), // Convert to minutes
        completionPercentage: totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0,
        certificateEarned: enrollment.certificateEarned || false,
        watchTime,
        interactions: {}, // TODO: Implement interactions tracking
        currentLessonId: enrollment.currentLectureId,
        streakDays: enrollment.streakDays || 0,
        lastAccessedAt: enrollment.lastAccessedAt,
        difficultyRating: null, // TODO: Implement difficulty rating
        aiRecommendations: null, // TODO: Implement AI recommendations
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get course progress: ${error.message}`);
    }
  }

  async getLectureAnalytics(lectureId: string) {
    try {
      const progress = await this.prisma.progress.findMany({
        where: { lectureId },
      });

      const totalViews = progress.length;
      const uniqueViews = new Set(progress.map(p => p.userId)).size;
      const averageWatchTime = progress.length > 0 
        ? progress.reduce((sum, p) => sum + (p.watchTime || 0), 0) / progress.length 
        : 0;
      const completionRate = progress.length > 0 
        ? (progress.filter(p => p.completed).length / progress.length) * 100 
        : 0;

      // TODO: Implement more sophisticated analytics
      const engagementRate = completionRate * 0.8; // Placeholder calculation

      return {
        totalViews,
        uniqueViews,
        averageWatchTime,
        completionRate,
        engagementRate,
        dropOffPoints: [], // TODO: Implement drop-off analysis
        popularSegments: [], // TODO: Implement segment analysis
        userInteractions: [], // TODO: Implement interaction tracking
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get lecture analytics: ${error.message}`);
    }
  }

  async getCourseNavigation(courseId: string, userId?: string) {
    try {
      const sections = await this.prisma.section.findMany({
        where: { courseId },
        include: {
          lectures: {
            include: {
              contentItem: true,
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      });

      let progress: any = null;
      let currentSection: string | null = null;
      let currentLecture: string | null = null;
      let userProgressMap: Map<string, boolean> = new Map();

      if (userId) {
        progress = await this.getCourseProgress(courseId, userId);
        
        // Get completion status for each lecture
        const lectureProgress = await this.prisma.progress.findMany({
          where: {
            userId,
            courseId,
          },
          select: {
            lectureId: true,
            completed: true,
          },
        });
        
        lectureProgress.forEach((p) => {
          if (p.lectureId) {
            userProgressMap.set(p.lectureId, p.completed);
          }
        });
        
        // Find current lecture
        const enrollment = await this.prisma.enrollment.findUnique({
          where: {
            userId_courseId: { userId, courseId },
          },
        });

        if (enrollment?.currentLectureId) {
          const currentLectureData = await this.prisma.lecture.findUnique({
            where: { id: enrollment.currentLectureId },
            include: { section: true },
          });

          if (currentLectureData) {
            currentSection = currentLectureData.sectionId;
            currentLecture = enrollment.currentLectureId;
          }
        }
      }

      // Add computed fields to sections
      const sectionsWithComputed = sections.map(section => {
        const lecturesWithProgress = section.lectures.map(lecture => ({
          ...lecture,
          isCompleted: userProgressMap.get(lecture.id) || false,
          isLocked: this.isLectureLocked(lecture, userId),
        }));
        
        const completedLectures = lecturesWithProgress.filter(l => l.isCompleted).length;
        const completionRate = section.lectures.length > 0 ? (completedLectures / section.lectures.length) * 100 : 0;
        
        return {
          ...section,
          lectures: lecturesWithProgress,
          totalLectures: section.lectures.length,
          totalDuration: section.lectures.reduce((sum, lecture) => sum + lecture.duration, 0),
          completionRate,
        };
      });

      return {
        sections: sectionsWithComputed,
        currentSection,
        currentLecture,
        progress,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get course navigation: ${error.message}`);
    }
  }

  // ============================================
  // LECTURE TRACKING AND INTERACTIONS
  // ============================================

  async trackLectureView(lectureId: string, courseId: string, userId: string) {
    try {
      // Verify user is enrolled
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('User not enrolled in this course');
      }

      // Update or create progress record
      await this.prisma.progress.upsert({
        where: {
          userId_courseId_lectureId: { userId, courseId, lectureId },
        },
        update: {
          updatedAt: new Date(),
        },
        create: {
          userId,
          lectureId,
          courseId,
          completed: false,
          timeSpent: 0,
          watchTime: 0,
        },
      });

      return {
        success: true,
        message: 'Lecture view tracked successfully',
        errors: [],
      };
    } catch (error) {
      throw new BadRequestException(`Failed to track lecture view: ${error.message}`);
    }
  }

  async markLectureComplete(lectureId: string, courseId: string, userId: string, progress: number) {
    try {
      // Verify user is enrolled
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('User not enrolled in this course');
      }

      // Update progress
      const progressRecord = await this.prisma.progress.upsert({
        where: {
          userId_courseId_lectureId: { userId, courseId, lectureId },
        },
        update: {
          completed: progress >= 100,
          completedAt: progress >= 100 ? new Date() : null,
          progress: progress / 100,
          updatedAt: new Date(),
        },
        create: {
          userId,
          lectureId,
          courseId,
          completed: progress >= 100,
          completedAt: progress >= 100 ? new Date() : null,
          progress: progress / 100,
          timeSpent: 0,
          watchTime: 0,
        },
      });

      // Update enrollment progress
      const totalLectures = await this.prisma.lecture.count({
        where: {
          section: { courseId },
        },
      });

      const completedLectures = await this.prisma.progress.count({
        where: {
          userId,
          courseId,
          completed: true,
        },
      });

      const overallProgress = totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;

      await this.prisma.enrollment.update({
        where: {
          userId_courseId: { userId, courseId },
        },
        data: {
          progress: overallProgress,
          currentLectureId: lectureId,
          lastAccessedAt: new Date(),
          completedLectures,
          totalLectures,
        },
      });

      const updatedProgress = await this.getCourseProgress(courseId, userId);

      return {
        success: true,
        message: 'Lecture progress updated successfully',
        progress: updatedProgress,
        errors: [],
      };
    } catch (error) {
      throw new BadRequestException(`Failed to mark lecture complete: ${error.message}`);
    }
  }

  async updateLectureProgress(lectureId: string, courseId: string, userId: string, progress: number, timeSpent: number) {
    try {
      // Verify user is enrolled
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('User not enrolled in this course');
      }

      // Update progress
      await this.prisma.progress.upsert({
        where: {
          userId_courseId_lectureId: { userId, courseId, lectureId },
        },
        update: {
          completed: progress >= 100,
          completedAt: progress >= 100 ? new Date() : null,
          progress: progress / 100,
          timeSpent: Math.round(timeSpent * 60), // Convert to seconds
          watchTime: Math.round(timeSpent * 60), // Convert to seconds
          updatedAt: new Date(),
        },
        create: {
          userId,
          lectureId,
          courseId,
          completed: progress >= 100,
          completedAt: progress >= 100 ? new Date() : null,
          progress: progress / 100,
          timeSpent: Math.round(timeSpent * 60),
          watchTime: Math.round(timeSpent * 60),
        },
      });

      // Update enrollment
      await this.prisma.enrollment.update({
        where: {
          userId_courseId: { userId, courseId },
        },
        data: {
          currentLectureId: lectureId,
          lastAccessedAt: new Date(),
          totalTimeSpent: {
            increment: Math.round(timeSpent),
          },
        },
      });

      const updatedProgress = await this.getCourseProgress(courseId, userId);

      return {
        success: true,
        message: 'Lecture progress updated successfully',
        progress: updatedProgress,
        errors: [],
      };
    } catch (error) {
      throw new BadRequestException(`Failed to update lecture progress: ${error.message}`);
    }
  }

  async trackLectureInteraction(lectureId: string, courseId: string, userId: string, interactionType: string, metadata?: any) {
    try {
      // Verify user is enrolled
      const enrollment = await this.prisma.enrollment.findUnique({
        where: {
          userId_courseId: { userId, courseId },
        },
      });

      if (!enrollment) {
        throw new ForbiddenException('User not enrolled in this course');
      }

      // Update progress with interaction
      await this.prisma.progress.upsert({
        where: {
          userId_courseId_lectureId: { userId, courseId, lectureId },
        },
        update: {
          interactions: {
            ...metadata,
            [interactionType]: {
              count: { increment: 1 },
              lastInteraction: new Date(),
            },
          },
          updatedAt: new Date(),
        },
        create: {
          userId,
          lectureId,
          courseId,
          interactions: {
            [interactionType]: {
              count: 1,
              lastInteraction: new Date(),
            },
          },
          completed: false,
          timeSpent: 0,
          watchTime: 0,
        },
      });

      return {
        success: true,
        message: 'Lecture interaction tracked successfully',
        errors: [],
      };
    } catch (error) {
      throw new BadRequestException(`Failed to track lecture interaction: ${error.message}`);
    }
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  private async getPreviousLecture(lectureId: string, courseId: string) {
    const currentLecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { section: true },
    });

    if (!currentLecture) return null;

    const previousLecture = await this.prisma.lecture.findFirst({
      where: {
        section: { courseId },
        order: { lt: currentLecture.order },
        sectionId: currentLecture.sectionId,
      },
      orderBy: { order: 'desc' },
      take: 1,
    });

    if (previousLecture) {
      return {
        id: previousLecture.id,
        title: previousLecture.title,
        type: previousLecture.type,
        order: previousLecture.order,
        isPreview: previousLecture.isPreview,
        isLocked: this.isLectureLocked(previousLecture),
        isCompleted: false, // TODO: Check user completion
      };
    }

    // Check previous section
    const previousSection = await this.prisma.section.findFirst({
      where: {
        courseId,
        order: { lt: currentLecture.section.order },
      },
      orderBy: { order: 'desc' },
      take: 1,
      include: {
        lectures: {
          orderBy: { order: 'desc' },
          take: 1,
        },
      },
    });

    if (previousSection?.lectures?.[0]) {
      return {
        id: previousSection.lectures[0].id,
        title: previousSection.lectures[0].title,
        type: previousSection.lectures[0].type,
        order: previousSection.lectures[0].order,
        isPreview: previousSection.lectures[0].isPreview,
        isLocked: this.isLectureLocked(previousSection.lectures[0]),
        isCompleted: false,
      };
    }

    return null;
  }

  private async getNextLecture(lectureId: string, courseId: string) {
    const currentLecture = await this.prisma.lecture.findUnique({
      where: { id: lectureId },
      include: { section: true },
    });

    if (!currentLecture) return null;

    const nextLecture = await this.prisma.lecture.findFirst({
      where: {
        section: { courseId },
        order: { gt: currentLecture.order },
        sectionId: currentLecture.sectionId,
      },
      orderBy: { order: 'asc' },
      take: 1,
    });

    if (nextLecture) {
      return {
        id: nextLecture.id,
        title: nextLecture.title,
        type: nextLecture.type,
        order: nextLecture.order,
        isPreview: nextLecture.isPreview,
        isLocked: this.isLectureLocked(nextLecture),
        isCompleted: false,
      };
    }

    // Check next section
    const nextSection = await this.prisma.section.findFirst({
      where: {
        courseId,
        order: { gt: currentLecture.section.order },
      },
      orderBy: { order: 'asc' },
      take: 1,
      include: {
        lectures: {
          orderBy: { order: 'asc' },
          take: 1,
        },
      },
    });

    if (nextSection?.lectures?.[0]) {
      return {
        id: nextSection.lectures[0].id,
        title: nextSection.lectures[0].title,
        type: nextSection.lectures[0].type,
        order: nextSection.lectures[0].order,
        isPreview: nextSection.lectures[0].isPreview,
        isLocked: this.isLectureLocked(nextSection.lectures[0]),
        isCompleted: false,
      };
    }

    return null;
  }

  private isLectureLocked(lecture: any, userId?: string): boolean {
    // TODO: Implement proper locking logic based on course settings
    return false;
  }
}