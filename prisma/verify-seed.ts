import { PrismaClient } from '../generated/prisma';

const prisma = new PrismaClient();

async function verifySeed() {
  console.log('🔍 Verifying seeded data...');

  // Check users
  const users = await prisma.user.findMany();
  console.log('👥 Users found:', users.length);
  users.forEach(user => {
    console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
  });

  // Check courses
  const courses = await prisma.course.findMany();
  console.log('📚 Courses found:', courses.length);
  courses.forEach(course => {
    console.log(`  - ${course.title} by ${course.instructorId}`);
  });

  // Check sections
  const sections = await prisma.section.findMany();
  console.log('📖 Sections found:', sections.length);
  sections.forEach(section => {
    console.log(`  - ${section.title} (${section.estimatedDuration} minutes)`);
  });

  // Check lectures
  const lectures = await prisma.lecture.findMany();
  console.log('🎥 Lectures found:', lectures.length);
  lectures.forEach(lecture => {
    console.log(`  - ${lecture.title} (${lecture.duration} seconds)`);
  });

  // Check enrollments
  const enrollments = await prisma.enrollment.findMany({
    include: {
      user: true,
      course: true,
    }
  });
  console.log('🎓 Enrollments found:', enrollments.length);
  enrollments.forEach(enrollment => {
    console.log(`  - ${enrollment.user.firstName} enrolled in ${enrollment.course.title} (${enrollment.progress}% complete)`);
  });

  // Check progress
  const progress = await prisma.progress.findMany({
    include: {
      user: true,
      course: true,
      lecture: true,
    }
  });
  console.log('📊 Progress records found:', progress.length);
  progress.forEach(prog => {
    console.log(`  - ${prog.user.firstName} progress in ${prog.course.title}: ${prog.lecture?.title || 'Course-level'} (${(prog.progress * 100).toFixed(1)}% complete)`);
  });

  console.log('✅ Verification completed!');
}

verifySeed()
  .catch((e) => {
    console.error('❌ Error during verification:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
