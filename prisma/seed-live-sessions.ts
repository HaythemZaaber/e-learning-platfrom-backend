import {
  PrismaClient,
  TopicDifficulty,
  SessionType,
  SessionFormat,
} from '@prisma/client';

const prisma = new PrismaClient();

async function seedLiveSessions() {
  console.log('🌱 Starting live sessions seed...\n');

  try {
    // 1. Find or create an instructor
    console.log('📝 Step 1: Setting up instructor...');

    let instructor = await prisma.user.findFirst({
      where: { role: 'INSTRUCTOR' },
    });

    if (!instructor) {
      instructor = await prisma.user.create({
        data: {
          clerkId: `clerk_test_instructor_${Date.now()}`,
          email: 'instructor@test.com',
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe_instructor',
          role: 'INSTRUCTOR',
          isEmailVerified: true,
          profileImage: 'https://via.placeholder.com/150',
          bio: 'Experienced instructor specializing in web development',
          title: 'Senior Web Developer & Instructor',
          expertise: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          // Add mock Stripe account ID for testing
          stripeAccountId: `acct_test_${Date.now()}`,
        },
      });
      console.log(
        `✅ Created instructor: ${instructor.email} (ID: ${instructor.id})`,
      );
    } else {
      // Update existing instructor with Stripe account if missing
      if (!instructor.stripeAccountId) {
        instructor = await prisma.user.update({
          where: { id: instructor.id },
          data: {
            stripeAccountId: `acct_test_${Date.now()}`,
          },
        });
        console.log(
          `✅ Updated instructor with Stripe account: ${instructor.email}`,
        );
      } else {
        console.log(
          `✅ Found existing instructor: ${instructor.email} (ID: ${instructor.id})`,
        );
      }
    }

    // 2. Create instructor profile if not exists
    console.log('\n📝 Step 2: Setting up instructor profile...');

    let instructorProfile = await prisma.instructorProfile.findUnique({
      where: { userId: instructor.id },
    });

    if (!instructorProfile) {
      instructorProfile = await prisma.instructorProfile.create({
        data: {
          userId: instructor.id,
          bio: 'Passionate about teaching and helping students succeed',
          shortBio: 'Learn from the best',
          expertise: ['Web Development', 'JavaScript', 'React', 'Node.js'],
          experience: 8,
          liveSessionsEnabled: true,
          autoAcceptBookings: true,
          minAdvanceBooking: 2,
        },
      });
      console.log('✅ Created instructor profile');
    } else {
      // Update to enable live sessions
      await prisma.instructorProfile.update({
        where: { userId: instructor.id },
        data: {
          isAcceptingStudents: true,
          autoAcceptBookings: true,
          liveSessionsEnabled: true,
        },
      });
      console.log('✅ Updated instructor profile');
    }

    // 3. Find or create a student
    console.log('\n📝 Step 3: Setting up student...');

    let student = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
    });

    if (!student) {
      student = await prisma.user.create({
        data: {
          clerkId: `clerk_test_student_${Date.now()}`,
          email: 'student@test.com',
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'janesmith_student',
          role: 'STUDENT',
          isEmailVerified: true,
          profileImage: 'https://via.placeholder.com/150',
        },
      });
      console.log(`✅ Created student: ${student.email} (ID: ${student.id})`);
    } else {
      console.log(
        `✅ Found existing student: ${student.email} (ID: ${student.id})`,
      );
    }

    // 4. Create session topics
    console.log('\n📝 Step 4: Creating session topics...');

    const topics = [
      {
        name: 'Web Development Fundamentals',
        description: 'Learn the basics of HTML, CSS, and JavaScript',
        category: 'Programming',
        difficulty: TopicDifficulty.BEGINNER,
      },
      {
        name: 'React Advanced Concepts',
        description:
          'Deep dive into React hooks, context, and performance optimization',
        category: 'Frontend Development',
        difficulty: TopicDifficulty.ADVANCED,
      },
      {
        name: 'Node.js Backend Development',
        description:
          'Build scalable backend applications with Node.js and Express',
        category: 'Backend Development',
        difficulty: TopicDifficulty.INTERMEDIATE,
      },
    ];

    const createdTopics: any[] = [];
    for (const topic of topics) {
      const existing = await prisma.sessionTopic.findFirst({
        where: {
          name: topic.name,
          instructorId: instructor.id,
        },
      });

      if (!existing) {
        const created = await prisma.sessionTopic.create({
          data: {
            ...topic,
            instructorId: instructor.id,
            isActive: true,
          },
        });
        createdTopics.push(created);
        console.log(`✅ Created topic: ${created.name}`);
      } else {
        createdTopics.push(existing);
        console.log(`✅ Found existing topic: ${existing.name}`);
      }
    }

    // 5. Create session offerings
    console.log('\n📝 Step 5: Creating session offerings...');

    const offerings = [
      {
        title: '1-on-1 Web Development Mentoring',
        description: 'Personalized mentoring session for web development',
        sessionType: SessionType.INDIVIDUAL,
        sessionFormat: SessionFormat.ONLINE,
        duration: 60,
        basePrice: 50,
        capacity: 1,
        minParticipants: 1,
      },
      {
        title: 'React Workshop - Small Group',
        description: 'Interactive React workshop for small groups',
        sessionType: SessionType.SMALL_GROUP,
        sessionFormat: SessionFormat.ONLINE,
        duration: 90,
        basePrice: 75,
        capacity: 5,
        minParticipants: 2,
      },
      {
        title: 'Quick Code Review Session',
        description: '30-minute code review and feedback session',
        sessionType: SessionType.INDIVIDUAL,
        sessionFormat: SessionFormat.ONLINE,
        duration: 30,
        basePrice: 30,
        capacity: 1,
        minParticipants: 1,
      },
    ];

    const createdOfferings: any[] = [];
    for (let i = 0; i < offerings.length; i++) {
      const offering = offerings[i];
      const topic = createdTopics[i % createdTopics.length];

      const existing = await prisma.sessionOffering.findFirst({
        where: {
          title: offering.title,
          instructorId: instructor.id,
        },
      });

      if (!existing) {
        const created = await prisma.sessionOffering.create({
          data: {
            ...offering,
            instructorId: instructor.id,
            topicId: topic.id,
            currency: 'USD',
            isActive: true,
            recordingEnabled: true,
            materials: ['Slides will be shared', 'Code examples provided'],
          },
        });
        createdOfferings.push(created);
        console.log(
          `✅ Created offering: ${created.title} - $${created.basePrice}`,
        );
      } else {
        createdOfferings.push(existing);
        console.log(`✅ Found existing offering: ${existing.title}`);
      }
    }

    // 6. Create availability slots (next 7 days)
    console.log('\n📝 Step 6: Creating availability slots...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);

      // Check if availability already exists for this date
      const existingAvailability =
        await prisma.instructorAvailability.findFirst({
          where: {
            instructorId: instructor.id,
            specificDate: date,
          },
        });

      if (!existingAvailability) {
        const availability = await prisma.instructorAvailability.create({
          data: {
            instructorId: instructor.id,
            specificDate: date,
            startTime: '09:00',
            endTime: '17:00',
            isActive: true,
            autoAcceptBookings: true,
            minAdvanceHours: 2,
            maxAdvanceHours: 168,
          },
        });

        // Create time slots for this day (9 AM to 5 PM, every hour)
        const slots: any[] = [];
        for (let hour = 9; hour < 17; hour++) {
          const startTime = new Date(date);
          startTime.setHours(hour, 0, 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(hour + 1, 0, 0, 0);

          slots.push({
            availabilityId: availability.id,
            date: date,
            startTime: startTime,
            endTime: endTime,
            dayOfWeek: date.getDay(),
            slotDuration: 60,
            timezone: 'UTC',
            maxBookings: 1,
            currentBookings: 0,
            isAvailable: true,
            isBlocked: false,
            isBooked: false,
          });
        }

        await prisma.timeSlot.createMany({
          data: slots,
        });

        console.log(
          `✅ Created availability with ${slots.length} time slots for ${date.toDateString()}`,
        );
      } else {
        console.log(
          `✅ Availability already exists for ${date.toDateString()}`,
        );
      }
    }

    // 7. Create sample booking requests and live sessions
    console.log(
      '\n📝 Step 7: Creating sample booking requests and live sessions...',
    );

    // Get some available time slots
    const availableSlots = await prisma.timeSlot.findMany({
      where: {
        isAvailable: true,
        isBooked: false,
        isBlocked: false,
      },
      take: 3,
      orderBy: {
        startTime: 'asc',
      },
    });

    const createdBookings: any[] = [];
    const createdSessions: any[] = [];

    if (availableSlots.length > 0 && createdOfferings.length > 0) {
      // Create a pending booking request
      const pendingBooking = await prisma.bookingRequest.create({
        data: {
          offeringId: createdOfferings[0].id,
          studentId: student.id,
          timeSlotId: availableSlots[0].id,
          bookingMode: 'DIRECT',
          customTopic: 'Need help with React hooks and state management',
          studentMessage:
            'I am struggling with useEffect and would love some guidance',
          offeredPrice: createdOfferings[0].basePrice,
          finalPrice: createdOfferings[0].basePrice,
          currency: 'USD',
          status: 'PENDING',
          paymentStatus: 'PENDING',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          priority: 1,
        },
      });
      createdBookings.push(pendingBooking);
      console.log(
        `✅ Created PENDING booking request (ID: ${pendingBooking.id})`,
      );

      // Create an accepted booking request with live session
      if (availableSlots.length > 1) {
        const acceptedBooking = await prisma.bookingRequest.create({
          data: {
            offeringId: createdOfferings[1].id,
            studentId: student.id,
            timeSlotId: availableSlots[1].id,
            bookingMode: 'DIRECT',
            customTopic: 'React Workshop for Beginners',
            studentMessage: 'Excited to learn React in a group setting!',
            offeredPrice: createdOfferings[1].basePrice,
            finalPrice: createdOfferings[1].basePrice,
            currency: 'USD',
            status: 'ACCEPTED',
            paymentStatus: 'PAID',
            acceptedAt: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            priority: 1,
          },
        });
        createdBookings.push(acceptedBooking);
        console.log(
          `✅ Created ACCEPTED booking request (ID: ${acceptedBooking.id})`,
        );

        // Create corresponding live session
        const liveSession = await prisma.liveSession.create({
          data: {
            bookingRequestId: acceptedBooking.id,
            offeringId: createdOfferings[1].id,
            instructorId: instructor.id,
            timeSlotId: availableSlots[1].id,
            sessionType: 'CUSTOM',
            title: 'React Workshop for Beginners',
            description: 'Interactive React workshop covering fundamentals',
            finalTopic: 'React Workshop for Beginners',
            format: createdOfferings[1].sessionType,
            sessionFormat: createdOfferings[1].sessionFormat,
            sessionMode: 'LIVE',
            maxParticipants: createdOfferings[1].capacity,
            minParticipants: createdOfferings[1].minParticipants || 1,
            currentParticipants: 1,
            scheduledStart: availableSlots[1].startTime,
            scheduledEnd: availableSlots[1].endTime,
            duration: createdOfferings[1].duration,
            pricePerPerson: createdOfferings[1].basePrice,
            totalPrice: createdOfferings[1].basePrice,
            totalRevenue: createdOfferings[1].basePrice,
            platformFee: createdOfferings[1].basePrice * 0.2,
            instructorPayout: createdOfferings[1].basePrice * 0.8,
            currency: 'USD',
            status: 'SCHEDULED',
            meetingRoomId: `session-${Date.now()}`,
            meetingLink: `https://getstream.io/call/session-${Date.now()}`,
            materials: createdOfferings[1].materials,
            recordingEnabled: createdOfferings[1].recordingEnabled,
          },
        });
        createdSessions.push(liveSession);
        console.log(
          `✅ Created SCHEDULED live session (ID: ${liveSession.id})`,
        );

        // Create session participant
        await prisma.sessionParticipant.create({
          data: {
            sessionId: liveSession.id,
            userId: student.id,
            role: 'STUDENT',
            status: 'ENROLLED',
            paidAmount: createdOfferings[1].basePrice,
            currency: 'USD',
            paymentDate: new Date(),
          },
        });

        // Create session reservation
        await prisma.sessionReservation.create({
          data: {
            sessionId: liveSession.id,
            learnerId: student.id,
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            agreedPrice: createdOfferings[1].basePrice,
            currency: 'USD',
            confirmedAt: new Date(),
          },
        });

        // Update time slot
        await prisma.timeSlot.update({
          where: { id: availableSlots[1].id },
          data: {
            currentBookings: { increment: 1 },
            isBooked: true,
          },
        });
      }

      // Create a completed session with review
      if (availableSlots.length > 2) {
        const completedBooking = await prisma.bookingRequest.create({
          data: {
            offeringId: createdOfferings[2].id,
            studentId: student.id,
            timeSlotId: availableSlots[2].id,
            bookingMode: 'DIRECT',
            customTopic: 'Code Review - React Project',
            studentMessage: 'Need review of my React code',
            offeredPrice: createdOfferings[2].basePrice,
            finalPrice: createdOfferings[2].basePrice,
            currency: 'USD',
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            priority: 1,
          },
        });
        createdBookings.push(completedBooking);
        console.log(
          `✅ Created COMPLETED booking request (ID: ${completedBooking.id})`,
        );

        // Create past time for completed session
        const pastStart = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours ago
        const pastEnd = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

        const completedSession = await prisma.liveSession.create({
          data: {
            bookingRequestId: completedBooking.id,
            offeringId: createdOfferings[2].id,
            instructorId: instructor.id,
            timeSlotId: availableSlots[2].id,
            sessionType: 'CUSTOM',
            title: 'Code Review Session',
            description: 'Quick code review and feedback',
            finalTopic: 'Code Review - React Project',
            format: createdOfferings[2].sessionType,
            sessionFormat: createdOfferings[2].sessionFormat,
            sessionMode: 'LIVE',
            maxParticipants: 1,
            minParticipants: 1,
            currentParticipants: 1,
            scheduledStart: pastStart,
            scheduledEnd: pastEnd,
            actualStart: pastStart,
            actualEnd: pastEnd,
            duration: createdOfferings[2].duration,
            actualDuration: 30,
            pricePerPerson: createdOfferings[2].basePrice,
            totalPrice: createdOfferings[2].basePrice,
            totalRevenue: createdOfferings[2].basePrice,
            platformFee: createdOfferings[2].basePrice * 0.2,
            instructorPayout: createdOfferings[2].basePrice * 0.8,
            currency: 'USD',
            status: 'COMPLETED',
            meetingRoomId: `session-completed-${Date.now()}`,
            meetingLink: `https://getstream.io/call/session-completed-${Date.now()}`,
            materials: createdOfferings[2].materials,
            recordingEnabled: false,
            summary:
              'Great session! Reviewed React component structure and provided feedback.',
          },
        });
        createdSessions.push(completedSession);
        console.log(
          `✅ Created COMPLETED live session (ID: ${completedSession.id})`,
        );

        // Create session participant
        await prisma.sessionParticipant.create({
          data: {
            sessionId: completedSession.id,
            userId: student.id,
            role: 'STUDENT',
            status: 'ATTENDED',
            paidAmount: createdOfferings[2].basePrice,
            currency: 'USD',
            paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            joinedAt: pastStart,
            leftAt: pastEnd,
            totalTime: 30,
          },
        });

        // Create session reservation
        await prisma.sessionReservation.create({
          data: {
            sessionId: completedSession.id,
            learnerId: student.id,
            status: 'COMPLETED',
            paymentStatus: 'PAID',
            agreedPrice: createdOfferings[2].basePrice,
            currency: 'USD',
            confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    // 8. Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   - Instructor: ${instructor.email} (ID: ${instructor.id})`);
    console.log(`   - Stripe Account: ${instructor.stripeAccountId}`);
    console.log(`   - Student: ${student.email} (ID: ${student.id})`);
    console.log(`   - Topics created: ${createdTopics.length}`);
    console.log(`   - Offerings created: ${createdOfferings.length}`);
    console.log(`   - Booking Requests: ${createdBookings.length}`);
    console.log(`   - Live Sessions: ${createdSessions.length}`);
    console.log(`   - Availability: Next 7 days (9 AM - 5 PM)`);

    console.log('\n📝 Test Data Created:');
    console.log(`   - Student ID: ${student.id}`);
    console.log(`   - Instructor ID: ${instructor.id}`);

    if (createdBookings.length > 0) {
      console.log('\n   Booking Requests:');
      createdBookings.forEach((booking, index) => {
        console.log(
          `   ${index + 1}. ${booking.status} - ${booking.customTopic} (ID: ${booking.id})`,
        );
      });
    }

    if (createdSessions.length > 0) {
      console.log('\n   Live Sessions:');
      createdSessions.forEach((session, index) => {
        console.log(
          `   ${index + 1}. ${session.status} - ${session.title} (ID: ${session.id})`,
        );
      });
    }

    // Get first available time slot for new bookings
    const firstTimeSlot = await prisma.timeSlot.findFirst({
      where: {
        isAvailable: true,
        isBooked: false,
        isBlocked: false,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    if (firstTimeSlot && createdOfferings.length > 0) {
      console.log('\n   Available for New Booking:');
      console.log(`   - Time Slot ID: ${firstTimeSlot.id}`);
      console.log(
        `   - Slot Time: ${firstTimeSlot.startTime.toLocaleString()}`,
      );
      console.log(`   - Offering ID: ${createdOfferings[0].id}`);
      console.log(
        `   - Offering: ${createdOfferings[0].title} ($${createdOfferings[0].basePrice})`,
      );
    }

    console.log('\n📋 Example Booking Request:');
    console.log(`
POST /session-bookings
Content-Type: application/json
Authorization: Bearer <student_token>

{
  "timeSlotId": "${firstTimeSlot?.id || 'TIME_SLOT_ID'}",
  "offeringId": "${createdOfferings[0]?.id || 'OFFERING_ID'}",
  "studentId": "${student.id}",
  "agreedPrice": ${createdOfferings[0]?.basePrice || 50},
  "currency": "USD",
  "customTopic": "Help with React project",
  "studentMessage": "Looking forward to learning!",
  "returnUrl": "http://localhost:3000/payment/success",
  "cancelUrl": "http://localhost:3000/payment/cancel"
}
    `);

    console.log('\n⚠️  Note: The Stripe account ID is for TESTING only.');
    console.log('For production, use: POST /payments/connect/accounts\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLiveSessions().catch((e) => {
  console.error(e);
  process.exit(1);
});
