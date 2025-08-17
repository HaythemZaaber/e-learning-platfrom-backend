const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testInstructorVerification() {
  try {
    console.log('🧪 Testing Instructor Verification System...\n');

    // 1. Create a test user
    console.log('1. Creating test user...');
    const user = await prisma.user.create({
      data: {
        clerkId: 'test-clerk-id-' + Date.now(),
        email: 'test-instructor-' + Date.now() + '@example.com',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: 'STUDENT',
        instructorStatus: 'NOT_APPLIED',
      },
    });
    console.log('✅ User created:', user.id);

    // 2. Create instructor application
    console.log('\n2. Creating instructor application...');
    const application = await prisma.instructorApplication.create({
      data: {
        userId: user.id,
        fullName: 'John Doe',
        phoneNumber: '+1234567890',
        nationality: 'US',
        currentJobTitle: 'Software Developer',
        yearsOfExperience: 5,
        subjectsToTeach: ['JavaScript', 'React', 'Node.js'],
        teachingMotivation: 'I want to share my knowledge and help others learn programming.',
        personalInfo: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phoneNumber: '+1234567890',
          dateOfBirth: '1990-01-01',
          nationality: 'US',
          address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        },
        professionalBackground: {
          currentJobTitle: 'Software Developer',
          currentEmployer: 'Tech Corp',
          employmentType: 'full_time',
          workLocation: 'New York, NY',
          yearsOfExperience: 5,
          education: [
            {
              institution: 'University of Technology',
              degree: 'Bachelor of Science',
              field: 'Computer Science',
              startYear: '2010',
              endYear: '2014',
              gpa: '3.8',
            },
          ],
          experience: [
            {
              company: 'Tech Corp',
              position: 'Software Developer',
              startDate: '2019-01-01',
              endDate: '2024-01-01',
              current: true,
              description: 'Full-stack development with React and Node.js',
            },
          ],
        },
        teachingInformation: {
          subjectsToTeach: [
            {
              subject: 'JavaScript',
              category: 'Programming',
              level: 'beginner',
              experienceYears: 5,
              confidence: 5,
            },
            {
              subject: 'React',
              category: 'Frontend',
              level: 'intermediate',
              experienceYears: 3,
              confidence: 4,
            },
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
              isCurrent: false,
              description: 'Mentored 20+ students in JavaScript fundamentals',
              studentsCount: 20,
            },
          ],
          teachingMotivation: 'I want to share my knowledge and help others learn programming.',
          teachingPhilosophy: 'Learning by doing with practical examples and real-world projects.',
          targetAudience: ['beginners', 'intermediate'],
          teachingStyle: 'Interactive and hands-on',
          teachingMethodology: 'Project-based learning with step-by-step guidance',
          preferredFormats: ['video', 'live-coding', 'exercises'],
          preferredClassSize: '10-15 students',
        },
        documents: {
          resumeUrl: 'https://example.com/resume.pdf',
          portfolioUrl: 'https://example.com/portfolio',
          identityDocument: {
            type: 'passport',
            url: 'https://example.com/passport.pdf',
          },
          educationCerts: [
            {
              name: 'Computer Science Degree',
              url: 'https://example.com/degree.pdf',
            },
          ],
          professionalCerts: [
            {
              name: 'AWS Certified Developer',
              url: 'https://example.com/aws-cert.pdf',
            },
          ],
        },
        consents: {
          backgroundCheck: true,
          dataProcessing: true,
          termOfService: true,
          privacyPolicy: true,
          contentGuidelines: true,
          codeOfConduct: true,
        },
        currentStep: 4,
        completionScore: 100,
        status: 'PENDING',
        lastAutoSave: new Date(),
      },
    });
    console.log('✅ Application created:', application.id);

    // 3. Add a document URL
    console.log('\n3. Adding document URL...');
    const document = await prisma.applicationDocument.create({
      data: {
        applicationId: application.id,
        documentType: 'RESUME',
        fileName: 'resume.pdf',
        originalName: 'John_Doe_Resume.pdf',
        fileSize: 1024 * 1024, // 1MB
        mimeType: 'application/pdf',
        fileUrl: 'https://example.com/resume.pdf',
        verificationStatus: 'DRAFT',
        metadata: {
          uploadedBy: user.id,
          uploadDate: new Date(),
        },
      },
    });
    console.log('✅ Document added:', document.id);

    // 4. Create AI verification
    console.log('\n4. Creating AI verification...');
    const aiVerification = await prisma.instructorAIVerification.create({
      data: {
        applicationId: application.id,
        identityVerified: true,
        identityConfidence: 0.95,
        educationVerified: true,
        educationConfidence: 0.90,
        experienceVerified: true,
        experienceConfidence: 0.88,
        contentQualityScore: 0.85,
        languageProficiency: 0.92,
        professionalismScore: 0.88,
        riskScore: 0.10,
        overallScore: 0.87,
        recommendation: 'APPROVE',
        recommendationReason: 'Application meets all requirements with high confidence scores',
        verificationProvider: 'internal',
        processingTime: 5000,
        processedAt: new Date(),
      },
    });
    console.log('✅ AI verification created:', aiVerification.id);

    // 5. Create manual review
    console.log('\n5. Creating manual review...');
    const manualReview = await prisma.instructorManualReview.create({
      data: {
        applicationId: application.id,
        reviewerId: user.id, // Using same user as reviewer for test
        documentationScore: 9,
        experienceScore: 8,
        communicationScore: 9,
        technicalScore: 9,
        professionalismScore: 9,
        overallScore: 8.8,
        strengths: 'Strong technical background, clear teaching philosophy, good communication skills',
        weaknesses: 'Limited formal teaching experience',
        concerns: 'None',
        recommendations: 'Approve with recommendation to start with beginner courses',
        decision: 'APPROVE',
        decisionReason: 'Application demonstrates strong qualifications and commitment to teaching',
        requiresInterview: false,
        requiresAdditionalDocs: false,
        reviewedAt: new Date(),
      },
    });
    console.log('✅ Manual review created:', manualReview.id);

    // 6. Query the complete application
    console.log('\n6. Querying complete application...');
    const completeApplication = await prisma.instructorApplication.findUnique({
      where: { id: application.id },
      include: {
        applicationDocuments: true,
        aiVerification: true,
        manualReview: true,
        interview: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    console.log('✅ Complete application retrieved');
    console.log('   - Status:', completeApplication.status);
    console.log('   - Documents:', completeApplication.applicationDocuments.length);
    console.log('   - AI Verification:', completeApplication.aiVerification ? 'Yes' : 'No');
    console.log('   - Manual Review:', completeApplication.manualReview ? 'Yes' : 'No');

    // 7. Update application status to approved
    console.log('\n7. Updating application status to approved...');
    const updatedApplication = await prisma.instructorApplication.update({
      where: { id: application.id },
      data: {
        status: 'APPROVED',
        lastSavedAt: new Date(),
      },
    });
    console.log('✅ Application status updated to:', updatedApplication.status);

    // 8. Update user role to instructor
    console.log('\n8. Updating user role to instructor...');
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: 'INSTRUCTOR',
        instructorStatus: 'APPROVED',
      },
    });
    console.log('✅ User role updated to:', updatedUser.role);

    console.log('\n🎉 All tests passed successfully!');
    console.log('\n📊 Test Summary:');
    console.log('   - User created and updated');
    console.log('   - Application created with full data');
    console.log('   - Document URL added');
    console.log('   - AI verification completed');
    console.log('   - Manual review completed');
    console.log('   - Application approved');
    console.log('   - User role updated to instructor');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testInstructorVerification();
