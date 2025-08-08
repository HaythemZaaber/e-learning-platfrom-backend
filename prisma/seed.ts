import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a sample user
  const user = await prisma.user.upsert({
    where: { id: 'user_seed_001' },
    update: {},
    create: {
      id: 'user_seed_001',
      clerkId: 'clerk_user_seed_001',
      email: 'student@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'STUDENT',
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log('✅ Created user:', user.email);

  // Create a sample instructor
  const instructor = await prisma.user.upsert({
    where: { id: 'instructor_seed_001' },
    update: {},
    create: {
      id: 'instructor_seed_001',
      clerkId: 'clerk_instructor_seed_001',
      email: 'instructor@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'INSTRUCTOR',
      isActive: true,
      isEmailVerified: true,
    },
  });

  console.log('✅ Created instructor:', instructor.email);

  // Create a sample course
  const course = await prisma.course.upsert({
    where: { id: 'course_seed_001' },
    update: {},
    create: {
      id: 'course_seed_001',
      title: 'Introduction to Web Development',
      description: 'Learn the basics of web development with HTML, CSS, and JavaScript',
      category: 'Programming',
      level: 'BEGINNER',
      price: 49.99,
      currency: 'USD',
      language: 'English',
      instructorId: instructor.id,
      status: 'PUBLISHED',
      enrollmentType: 'PAID',
      isPublic: true,
      estimatedHours: 10,
      estimatedMinutes: 600,
      difficulty: 2.5,
      views: 150,
      uniqueViews: 120,
      avgRating: 4.5,
      totalRatings: 25,
      completionRate: 0.75,
      currentEnrollments: 50,
      totalSections: 5,
      totalLectures: 20,
      totalQuizzes: 3,
      totalAssignments: 2,
      totalContentItems: 25,
      totalDiscussions: 15,
      totalAnnouncements: 2,
      version: '1.0.0',
      objectives: ['Learn HTML basics', 'Master CSS styling', 'Understand JavaScript fundamentals'],
      prerequisites: ['Basic computer skills', 'No prior programming experience required'],
      whatYouLearn: ['HTML structure', 'CSS styling', 'JavaScript programming'],
      requirements: ['Computer with internet access', 'Text editor'],
      seoTags: ['web development', 'html', 'css', 'javascript', 'beginner'],
      marketingTags: ['popular', 'trending'],
      targetAudience: ['Beginners', 'Students', 'Career changers'],
      galleryImages: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      subtitleLanguages: ['English', 'Spanish'],
      hasLiveSessions: false,
      hasRecordings: true,
      hasDiscussions: true,
      hasAssignments: true,
      hasQuizzes: true,
      downloadableResources: true,
      offlineAccess: false,
      mobileOptimized: true,
      certificate: true,
      passingGrade: 70.0,
      allowRetakes: true,
      maxAttempts: 3,

    },
  });

  console.log('✅ Created course:', course.title);

  // Create a sample section
  const section = await prisma.section.upsert({
    where: { id: 'section_seed_001' },
    update: {},
    create: {
      id: 'section_seed_001',
      title: 'HTML Fundamentals',
      description: 'Learn the basics of HTML markup',
      order: 1,
      isLocked: false,
      isRequired: true,
      estimatedDuration: 120, // 2 hours
      courseId: course.id,
    },
  });

  console.log('✅ Created section:', section.title);

  // Create a sample lecture
  const lecture = await prisma.lecture.upsert({
    where: { id: 'lecture_seed_001' },
    update: {},
    create: {
      id: 'lecture_seed_001',
      title: 'Introduction to HTML',
      description: 'Learn what HTML is and how to create your first HTML document',
      type: 'VIDEO',
      content: 'HTML is the standard markup language for creating web pages...',
      duration: 1800, // 30 minutes
      order: 1,
      isPreview: true,
      isInteractive: false,
      isRequired: true,
      isLocked: false,
      isCompleted: false,
      hasAIQuiz: false,
      autoTranscript: true,
      downloadable: true,
      status: 'published',
      sectionId: section.id,
    },
  });

  console.log('✅ Created lecture:', lecture.title);

  // Create an enrollment
  const enrollment = await prisma.enrollment.upsert({
    where: { 
      userId_courseId: {
        userId: user.id,
        courseId: course.id,
      }
    },
    update: {},
    create: {
      userId: user.id,
      courseId: course.id,
      status: 'ACTIVE',
      progress: 25.0, // 25% complete
      currentLectureId: lecture.id,
      enrollmentSource: 'DIRECT',
      completedLectures: 5,
      totalLectures: 20,
      paymentStatus: 'PAID',
      amountPaid: 49.99,
      discountApplied: 0.0,
      totalTimeSpent: 180, // 3 hours
      streakDays: 7,
      lastAccessedAt: new Date(),
      certificateEarned: false,
      type: 'PAID',
      source: 'DIRECT',
      amount: 49.99,
      currency: 'USD',
      completionPercentage: 25.0,
    },
  });

  console.log('✅ Created enrollment with progress:', enrollment.progress + '%');

  // Create a progress record for the specific lecture
  const progress = await prisma.progress.upsert({
    where: {
      userId_courseId_lectureId: {
        userId: user.id,
        courseId: course.id,
        lectureId: lecture.id,
      }
    },
    update: {},
    create: {
      userId: user.id,
      courseId: course.id,
      lectureId: lecture.id,
      sectionId: section.id,
      progress: 0.75, // 75% complete (0.0-1.0)
      completed: false,
      watchTime: 1350, // 22.5 minutes watched
      timeSpent: 22, // 22 minutes
      lastWatchedAt: new Date(),
      completedAt: null,
      streakDays: 7,
      interactions: {
        playCount: 3,
        pauseCount: 5,
        seekCount: 2,
        noteCount: 1,
      },
      difficultyRating: 2.0,
      aiRecommendations: 'Consider reviewing the HTML structure section',
      certificateEarned: false,
      currentLessonId: lecture.id,
      currentTime: 1350, // 22.5 minutes into the video
    },
  });

  console.log('✅ Created progress record:', {
    lecture: lecture.title,
    progress: progress.progress * 100 + '%',
    watchTime: progress.watchTime + ' seconds',
    completed: progress.completed,
  });



  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
