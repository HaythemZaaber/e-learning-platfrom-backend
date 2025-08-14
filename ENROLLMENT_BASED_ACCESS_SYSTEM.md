# Enrollment-Based Access System

## Overview

The e-learning platform now uses a unified enrollment-based access system for both free and paid courses. This approach provides a consistent user experience and better tracking capabilities.

## Key Changes

### 🔒 **All Courses Require Enrollment**

- **Free Courses**: Users must enroll to access content (no payment required)
- **Paid Courses**: Users must enroll and complete payment to access content
- **Consistent Experience**: Same enrollment flow for all course types

### 🎯 **Benefits**

1. **Clear User Journey**: Users understand they need to enroll to access content
2. **Better Tracking**: All user interactions are tracked through enrollment records
3. **Progress Management**: Consistent progress tracking for all course types
4. **Analytics**: Better insights into user engagement and course performance
5. **Content Protection**: Prevents unauthorized access to course materials

## User Experience Flow

### For Free Courses

1. **User browses course catalog**
   - Sees course preview with locked lectures
   - Can view course information, instructor details, and preview content

2. **User clicks "Enroll"**
   - System validates course is free
   - Creates enrollment record immediately
   - Unlocks all course content

3. **User accesses course content**
   - All lectures are now unlocked
   - Progress tracking begins
   - User can start learning immediately

### For Paid Courses

1. **User browses course catalog**
   - Sees course preview with locked lectures
   - Can view course information and pricing

2. **User clicks "Enroll"**
   - System creates payment session
   - Redirects to payment gateway

3. **User completes payment**
   - Payment webhook creates enrollment
   - Unlocks course content

4. **User accesses course content**
   - All lectures are now unlocked
   - Progress tracking begins

## Technical Implementation

### Course Access Control

```typescript
// All courses require enrollment for access
private async checkCourseAccess(courseId: string, userId?: string) {
  // Check if course exists and is public
  // Check if user is enrolled (for both free and paid courses)
  // Return access status and enrollment details
}
```

### Lecture Locking Logic

```typescript
// Lectures are locked unless user is enrolled
private isLectureLockedSync(lecture: any, userId?: string, accessInfo?: any) {
  // Preview lectures are always unlocked
  // All other lectures require enrollment
  // Return true if locked, false if unlocked
}
```

### Progress Tracking

```typescript
// Progress only tracked for enrolled users
async getCourseProgress(courseId: string, userId: string) {
  // Check enrollment status
  // Return progress data only if enrolled
  // Return default locked state if not enrolled
}
```

## API Endpoints

### Free Course Enrollment

```http
POST /api/payments/enrollments/free
Content-Type: application/json
Authorization: Bearer <token>

{
  "courseId": "course-123",
  "notes": "Optional enrollment notes"
}
```

### Validate Free Course Enrollment

```http
GET /api/payments/enrollments/free/validate/:courseId
Authorization: Bearer <token>
```

### Payment Session (Handles Both Free and Paid)

```http
POST /api/payments/sessions
Content-Type: application/json
Authorization: Bearer <token>

{
  "courseId": "course-123",
  "couponCode": "optional-coupon",
  "returnUrl": "https://example.com/success",
  "cancelUrl": "https://example.com/cancel"
}
```

## Database Schema

### Enrollment Model

```prisma
model Enrollment {
  id               String           @id @default(cuid())
  userId           String
  courseId         String
  status           EnrollmentStatus @default(ACTIVE)
  type             EnrollmentType   @default(FREE)
  source           EnrollmentSource @default(DIRECT)
  paymentStatus    PaymentStatus    @default(FREE)
  paymentId        String?
  amountPaid       Float?
  currency         String           @default("USD")
  enrolledAt       DateTime         @default(now())
  progress         Float            @default(0)

  // Relations
  user             User             @relation(fields: [userId], references: [id])
  course           Course           @relation(fields: [courseId], references: [id])

  @@unique([userId, courseId])
}
```

## Frontend Integration

### Course Preview Component

```typescript
// Show course information but lock lectures
const CoursePreview = ({ course, user }) => {
  const isEnrolled = user?.enrollments?.some(e => e.courseId === course.id);

  return (
    <div>
      <CourseInfo course={course} />
      <CourseSections
        sections={course.sections}
        isEnrolled={isEnrolled}
        showLockedState={!isEnrolled}
      />
      <EnrollButton
        course={course}
        isEnrolled={isEnrolled}
        onEnroll={handleEnroll}
      />
    </div>
  );
};
```

### Enrollment Button Component

```typescript
const EnrollButton = ({ course, isEnrolled, onEnroll }) => {
  if (isEnrolled) {
    return <ContinueLearningButton course={course} />;
  }

  if (course.enrollmentType === 'FREE') {
    return (
      <button onClick={() => onEnroll('free')}>
        Enroll for Free
      </button>
    );
  }

  return (
    <button onClick={() => onEnroll('paid')}>
      Enroll for ${course.price}
    </button>
  );
};
```

## Migration Guide

### For Existing Users

1. **Free Course Users**: Will need to re-enroll to access content
2. **Paid Course Users**: No changes required (enrollment already exists)
3. **Progress Data**: Preserved for existing enrollments

### For Developers

1. **Update Frontend**: Modify course preview to show locked state
2. **Update Enrollment Flow**: Ensure free courses go through enrollment process
3. **Update Progress Tracking**: Verify progress only shows for enrolled users

## Testing Scenarios

### Free Course Enrollment

```javascript
// Test free course enrollment flow
describe('Free Course Enrollment', () => {
  it('should create enrollment for free course', async () => {
    const result = await enrollInFreeCourse('free-course-id', userToken);
    expect(result.success).toBe(true);
    expect(result.enrollment.type).toBe('FREE');
  });

  it('should unlock lectures after enrollment', async () => {
    await enrollInFreeCourse('free-course-id', userToken);
    const course = await getCoursePreview('free-course-id', userToken);
    expect(course.sections[0].lectures[0].isLocked).toBe(false);
  });
});
```

### Paid Course Enrollment

```javascript
// Test paid course enrollment flow
describe('Paid Course Enrollment', () => {
  it('should create payment session for paid course', async () => {
    const result = await createPaymentSession('paid-course-id', userToken);
    expect(result.success).toBe(true);
    expect(result.isFreeCourse).toBe(false);
    expect(result.redirectUrl).toBeDefined();
  });
});
```

## Benefits Summary

✅ **Consistent UX**: Same enrollment flow for all courses  
✅ **Better Tracking**: All user interactions tracked through enrollment  
✅ **Content Protection**: Prevents unauthorized access  
✅ **Analytics**: Improved insights into user behavior  
✅ **Scalability**: Easy to add new enrollment types in the future  
✅ **Progress Management**: Unified progress tracking system

## Future Enhancements

- **Trial Enrollments**: Time-limited access for course previews
- **Guest Access**: Limited preview content for non-enrolled users
- **Enrollment Expiry**: Automatic expiration for inactive enrollments
- **Bulk Enrollment**: Enroll multiple users at once
- **Enrollment Analytics**: Detailed insights into enrollment patterns

