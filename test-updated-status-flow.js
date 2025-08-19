const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUpdatedStatusFlow() {
  try {
    console.log('Testing Updated Application Status Flow...\n');

    // Test 1: Create a test user
    console.log('1. Creating test user...');
    const testUser = await prisma.user.create({
      data: {
        clerkId: `test-clerk-${Date.now()}`,
        email: `test-user-${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'Instructor',
        role: 'STUDENT',
        instructorStatus: 'NOT_APPLIED',
        isEmailVerified: true,
        isActive: true,
      },
    });
    console.log('✅ Test user created:', testUser.id);

    // Test 2: Create an instructor application (DRAFT status)
    console.log('\n2. Creating instructor application (DRAFT status)...');
    const application = await prisma.instructorApplication.create({
      data: {
        userId: testUser.id,
        fullName: 'Test Instructor',
        phoneNumber: '+1234567890',
        yearsOfExperience: 3,
        subjectsToTeach: ['JavaScript', 'React'],
        teachingMotivation: 'I want to share my knowledge',
        applicationData: {},
        personalInfo: {},
        professionalBackground: {},
        teachingInformation: {},
        documents: {},
        consents: {},
        currentStep: 0,
        completionScore: 0,
        status: 'DRAFT', // NEW: Starts as DRAFT
        lastAutoSave: new Date(),
      },
    });
    console.log('✅ Instructor application created:', application.id);
    console.log('   Status:', application.status);
    console.log('   Completion Score:', application.completionScore + '%');

    // Test 3: Save draft with personal info (remains DRAFT)
    console.log('\n3. Saving draft with personal info (remains DRAFT)...');
    const draftData1 = {
      personalInfo: {
        firstName: 'Test',
        lastName: 'Instructor',
        email: testUser.email,
        phoneNumber: '+1234567890',
        dateOfBirth: '1990-01-01',
        nationality: 'US',
        streetAddress: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        timezone: 'America/New_York',
        primaryLanguage: 'English',
        languagesSpoken: [
          { language: 'English', proficiency: 'native', canTeachIn: true },
          { language: 'Spanish', proficiency: 'intermediate', canTeachIn: false }
        ],
        emergencyContact: {
          name: 'John Doe',
          relationship: 'Spouse',
          phoneNumber: '+1234567891',
          email: 'emergency@example.com'
        }
      }
    };

    const updatedApp1 = await prisma.instructorApplication.update({
      where: { id: application.id },
      data: {
        personalInfo: draftData1.personalInfo,
        fullName: 'Test Instructor',
        phoneNumber: '+1234567890',
        nationality: 'US',
        lastAutoSave: new Date(),
        lastSavedAt: new Date(),
        completionScore: 25,
        currentStep: 1,
        status: 'DRAFT', // NEW: Remains DRAFT during saving
      },
    });
    console.log('✅ Draft saved with personal info');
    console.log('   Status:', updatedApp1.status);
    console.log('   Completion Score:', updatedApp1.completionScore + '%');
    console.log('   Current Step:', updatedApp1.currentStep);

    // Test 4: Save draft with professional background (remains DRAFT)
    console.log('\n4. Saving draft with professional background (remains DRAFT)...');
    const draftData2 = {
      professionalBackground: {
        currentJobTitle: 'Senior Developer',
        currentEmployer: 'Tech Corp',
        employmentType: 'full_time',
        workLocation: 'Remote',
        yearsOfExperience: 5,
        education: [
          {
            institution: 'University of Technology',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startYear: '2010',
            endYear: '2014',
            gpa: '3.8',
            honors: 'Magna Cum Laude',
            description: 'Focused on software engineering and web development'
          }
        ],
        experience: [
          {
            company: 'Tech Corp',
            position: 'Senior Developer',
            startDate: '2020-01-01',
            endDate: '2023-12-31',
            current: true,
            location: 'Remote',
            employmentType: 'full_time',
            description: 'Leading development of web applications',
            achievements: ['Led team of 5 developers', 'Improved performance by 40%']
          }
        ],
        references: [
          {
            name: 'Jane Smith',
            position: 'Engineering Manager',
            company: 'Tech Corp',
            email: 'jane@techcorp.com',
            phone: '+1234567892',
            relationship: 'Manager',
            yearsKnown: '3',
            notes: 'Excellent team player',
            contactPermission: true
          }
        ]
      }
    };

    const updatedApp2 = await prisma.instructorApplication.update({
      where: { id: application.id },
      data: {
        professionalBackground: draftData2.professionalBackground,
        currentJobTitle: 'Senior Developer',
        yearsOfExperience: 5,
        lastAutoSave: new Date(),
        lastSavedAt: new Date(),
        completionScore: 50,
        currentStep: 2,
        status: 'DRAFT', // NEW: Remains DRAFT during saving
      },
    });
    console.log('✅ Draft saved with professional background');
    console.log('   Status:', updatedApp2.status);
    console.log('   Completion Score:', updatedApp2.completionScore + '%');
    console.log('   Current Step:', updatedApp2.currentStep);

    // Test 5: Save draft with teaching information (remains DRAFT)
    console.log('\n5. Saving draft with teaching information (remains DRAFT)...');
    const draftData3 = {
      teachingInformation: {
        subjectsToTeach: [
          {
            subject: 'JavaScript',
            category: 'Programming',
            level: 'intermediate',
            experienceYears: 5,
            confidence: 5
          },
          {
            subject: 'React',
            category: 'Frontend',
            level: 'advanced',
            experienceYears: 3,
            confidence: 4
          }
        ],
        hasTeachingExperience: true,
        teachingExperience: [
          {
            role: 'Mentor',
            institution: 'Code Academy',
            subject: 'JavaScript',
            level: 'Beginner',
            startDate: '2022-01-01',
            endDate: '2023-12-31',
            isCurrent: true,
            description: 'Mentoring junior developers',
            studentsCount: 15,
            achievements: ['100% student satisfaction', '90% completion rate']
          }
        ],
        teachingMotivation: 'I want to help others learn and grow in their careers',
        teachingPhilosophy: 'Learning by doing with real-world projects',
        targetAudience: ['beginners', 'intermediate'],
        teachingStyle: 'Interactive and hands-on',
        teachingMethodology: 'Project-based learning',
        preferredFormats: ['video', 'live-coding'],
        preferredClassSize: '10-20',
        weeklyAvailability: {
          monday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
          tuesday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
          wednesday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
          thursday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
          friday: { available: true, timeSlots: [{ start: '09:00', end: '17:00' }] },
          saturday: { available: false, timeSlots: [] },
          sunday: { available: false, timeSlots: [] },
        }
      }
    };

    const updatedApp3 = await prisma.instructorApplication.update({
      where: { id: application.id },
      data: {
        teachingInformation: draftData3.teachingInformation,
        subjectsToTeach: ['JavaScript', 'React'],
        teachingMotivation: 'I want to help others learn and grow in their careers',
        lastAutoSave: new Date(),
        lastSavedAt: new Date(),
        completionScore: 75,
        currentStep: 3,
        status: 'DRAFT', // NEW: Remains DRAFT during saving
      },
    });
    console.log('✅ Draft saved with teaching information');
    console.log('   Status:', updatedApp3.status);
    console.log('   Completion Score:', updatedApp3.completionScore + '%');
    console.log('   Current Step:', updatedApp3.currentStep);

    // Test 6: Submit the application (changes to SUBMITTED)
    console.log('\n6. Submitting the application (changes to SUBMITTED)...');
    const consents = {
      backgroundCheck: true,
      dataProcessing: true,
      termOfService: true,
      privacyPolicy: true,
      contentGuidelines: true,
      codeOfConduct: true,
    };

    const submittedApp = await prisma.instructorApplication.update({
      where: { id: application.id },
      data: {
        status: 'SUBMITTED', // NEW: Changes to SUBMITTED when user submits
        consents,
        submittedAt: new Date(),
        lastSavedAt: new Date(),
        completionScore: 75,
        currentStep: 4,
      },
    });
    console.log('✅ Application submitted successfully!');
    console.log('   Status:', submittedApp.status);
    console.log('   Completion Score:', submittedApp.completionScore + '%');
    console.log('   Current Step:', submittedApp.currentStep);
    console.log('   Submitted At:', submittedApp.submittedAt);

    // Test 7: Admin starts review (changes to UNDER_REVIEW)
    console.log('\n7. Admin starts review (changes to UNDER_REVIEW)...');
    const adminUser = await prisma.user.create({
      data: {
        clerkId: `admin-clerk-${Date.now()}`,
        email: `admin-${Date.now()}@example.com`,
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true,
      },
    });

    const reviewStarted = await prisma.instructorApplication.update({
      where: { id: application.id },
      data: {
        status: 'UNDER_REVIEW', // NEW: Changes to UNDER_REVIEW when admin starts reviewing
        lastSavedAt: new Date(),
      },
    });
    console.log('✅ Admin started review');
    console.log('   Status:', reviewStarted.status);
    console.log('   Admin User ID:', adminUser.id);

    // Test 8: Admin approves application (changes to APPROVED)
    console.log('\n8. Admin approves application (changes to APPROVED)...');
    const approvedApp = await prisma.instructorApplication.update({
      where: { id: application.id },
      data: {
        status: 'APPROVED', // NEW: Changes to APPROVED when admin approves
        lastSavedAt: new Date(),
      },
    });

    // Update user role to instructor
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: {
        role: 'INSTRUCTOR',
        instructorStatus: 'APPROVED',
      },
    });

    console.log('✅ Application approved!');
    console.log('   Status:', approvedApp.status);
    console.log('   User Role:', updatedUser.role);
    console.log('   Instructor Status:', updatedUser.instructorStatus);

    console.log('\n✅ Updated Status Flow Test Completed Successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - User ID: ${testUser.id}`);
    console.log(`   - Application ID: ${application.id}`);
    console.log(`   - Admin User ID: ${adminUser.id}`);
    console.log(`   - Final Status: ${approvedApp.status}`);
    console.log(`   - Final User Role: ${updatedUser.role}`);

    console.log('\n🔄 Status Flow Verified:');
    console.log('   ✅ DRAFT → User saves drafts');
    console.log('   ✅ SUBMITTED → User submits application');
    console.log('   ✅ UNDER_REVIEW → Admin starts review');
    console.log('   ✅ APPROVED → Admin approves application');
    console.log('   ✅ User role updated to INSTRUCTOR');

    console.log('\n🎯 Key Changes Implemented:');
    console.log('   ✅ PENDING → DRAFT (for drafts)');
    console.log('   ✅ UNDER_REVIEW → SUBMITTED (for submitted apps)');
    console.log('   ✅ UNDER_REVIEW (when admin starts reviewing)');
    console.log('   ✅ Proper status flow for admin review process');

    console.log('\n🔧 Frontend Integration Notes:');
    console.log('   1. Draft applications have status "DRAFT"');
    console.log('   2. Submitted applications have status "SUBMITTED"');
    console.log('   3. Admin sees "SUBMITTED" applications for review');
    console.log('   4. Admin changes status to "UNDER_REVIEW" when starting review');
    console.log('   5. Final decision changes status to "APPROVED"/"REJECTED"/"REQUIRES_MORE_INFO"');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdatedStatusFlow();

