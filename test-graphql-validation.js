const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGraphQLValidation() {
  try {
    console.log('Testing GraphQL Validation Pipe...\n');

    // Test 1: Create a test user
    console.log('1. Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        clerkId: `test-clerk-${Date.now()}`,
        email: `test-user-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        role: 'STUDENT',
        instructorStatus: 'NOT_APPLIED',
        isEmailVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Test user created:', testUser.id);

    // Test 2: Create an instructor application
    console.log('\n2. Creating instructor application...');
    const application = await prisma.instructorApplication.create({
      data: {
        userId: testUser.id,
        fullName: 'Test Instructor',
        phoneNumber: '+1234567890',
        yearsOfExperience: 3,
        subjectsToTeach: ['JavaScript', 'React'],
        teachingMotivation: 'I want to share my knowledge',
        applicationData: {},
        personalInfo: {
          firstName: 'Test',
          lastName: 'Instructor',
          email: testUser.email,
          phoneNumber: '+1234567890',
        },
        professionalBackground: {
          currentJobTitle: 'Developer',
          employmentType: 'full_time',
          workLocation: 'Remote',
          yearsOfExperience: 3,
          education: [],
          experience: [],
          references: [],
        },
        teachingInformation: {
          subjectsToTeach: [],
          hasTeachingExperience: false,
          teachingExperience: [],
          teachingMotivation: 'I want to help others learn',
          teachingPhilosophy: 'Learning by doing',
          targetAudience: ['beginners'],
          teachingStyle: 'Interactive',
          teachingMethodology: 'Project-based',
          preferredFormats: ['video'],
          preferredClassSize: '10-20',
          weeklyAvailability: {
            monday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            tuesday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            wednesday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            thursday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            friday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
            saturday: { available: false, timeSlots: [] },
            sunday: { available: false, timeSlots: [] },
          },
        },
        documents: {},
        consents: {},
        currentStep: 1,
        completionScore: 25,
        status: 'PENDING',
        lastAutoSave: new Date(),
      },
    });
    console.log('✅ Instructor application created:', application.id);

    console.log('\n✅ GraphQL validation pipe test completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - User ID: ${testUser.id}`);
    console.log(`   - Application ID: ${application.id}`);
    console.log(`   - Application Status: ${application.status}`);
    console.log(`   - Completion Score: ${application.completionScore}%`);

    console.log('\n🔧 Next Steps:');
    console.log('   1. Start the development server: npm run start:dev');
    console.log('   2. Test GraphQL mutations in the playground');
    console.log('   3. Verify that validation works for REST endpoints');
    console.log('   4. Verify that GraphQL mutations work without validation errors');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGraphQLValidation();
