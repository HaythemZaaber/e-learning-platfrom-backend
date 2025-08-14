# Student Enrollment Routes

## Overview

This document outlines all available routes for students to access their enrolled courses and enrollment information. The enrollment data now includes comprehensive course information with all details needed for a rich learning experience.

## 🔗 **Available Routes**

### **REST API Routes**

#### 1. **Get All User Enrollments**

```http
GET /api/payments/enrollments
Authorization: Bearer <token>
```

**Description:** Returns all courses the user is enrolled in with comprehensive course details.

**Response:**

```json
[
  {
    "id": "enrollment_123",
    "userId": "user_456",
    "courseId": "course_789",
    "status": "ACTIVE",
    "progress": 25.5,
    "enrolledAt": "2024-01-15T10:30:00Z",
    "completedAt": null,
    "currentLectureId": "lecture_456",
    "type": "FREE",
    "source": "DIRECT",
    "paymentStatus": "FREE",
    "amountPaid": 0,
    "currency": "USD",
    "completedLectures": 5,
    "totalLectures": 20,
    "totalTimeSpent": 120,
    "streakDays": 3,
    "certificateEarned": false,
    "course": {
      "id": "course_789",
      "title": "JavaScript Fundamentals",
      "description": "Learn JavaScript from scratch",
      "shortDescription": "Master JavaScript basics",
      "thumbnail": "https://example.com/thumb.jpg",
      "trailer": "https://example.com/trailer.mp4",
      "galleryImages": [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg"
      ],
      "category": "Programming",
      "subcategory": "Web Development",
      "level": "BEGINNER",
      "status": "PUBLISHED",
      "price": 0,
      "originalPrice": 99.99,
      "currency": "USD",
      "discountPercent": 0,
      "views": 1250,
      "uniqueViews": 890,
      "completionRate": 78.5,
      "avgRating": 4.8,
      "totalRatings": 156,
      "totalSections": 8,
      "totalLectures": 45,
      "totalQuizzes": 12,
      "totalAssignments": 5,
      "totalContentItems": 62,
      "totalDiscussions": 23,
      "totalAnnouncements": 3,
      "isFeatured": true,
      "isBestseller": false,
      "isTrending": true,
      "instructor": {
        "id": "instructor_123",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "profileImage": "https://example.com/profile.jpg",
        "title": "Senior JavaScript Developer",
        "bio": "10+ years of experience in web development",
        "expertise": ["JavaScript", "React", "Node.js"],
        "rating": 4.9,
        "totalStudents": 15420,
        "totalCourses": 8
      },
      "instructorId": "instructor_123",
      "sections": [
        {
          "id": "section_1",
          "title": "Introduction to JavaScript",
          "description": "Get started with JavaScript basics",
          "order": 1,
          "lectures": [
            {
              "id": "lecture_1",
              "title": "What is JavaScript?",
              "description": "Understanding JavaScript fundamentals",
              "type": "VIDEO",
              "duration": 1200,
              "order": 1,
              "isPreview": true
            }
          ]
        }
      ],
      "requirements": ["Basic computer knowledge", "Web browser"],
      "whatYouLearn": ["JavaScript syntax", "DOM manipulation", "ES6 features"],
      "objectives": [
        "Build interactive websites",
        "Understand JavaScript concepts"
      ],
      "prerequisites": ["HTML basics", "CSS fundamentals"],
      "language": "en",
      "subtitleLanguages": ["es", "fr"],
      "hasLiveSessions": false,
      "hasRecordings": true,
      "hasDiscussions": true,
      "hasAssignments": true,
      "hasQuizzes": true,
      "downloadableResources": true,
      "offlineAccess": false,
      "mobileOptimized": true,
      "enrollmentStartDate": "2024-01-01T00:00:00Z",
      "enrollmentEndDate": null,
      "courseStartDate": "2024-01-15T00:00:00Z",
      "courseEndDate": null,
      "maxStudents": null,
      "currentEnrollments": 1250,
      "waitlistEnabled": false,
      "reviews": [
        {
          "id": "review_1",
          "rating": 5,
          "comment": "Excellent course! Very comprehensive.",
          "user": {
            "id": "user_789",
            "username": "student123",
            "lastName": "Smith"
          }
        }
      ],
      "seoTitle": "Learn JavaScript Fundamentals - Complete Course",
      "seoDescription": "Master JavaScript from scratch with this comprehensive course",
      "seoTags": ["javascript", "programming", "web development"],
      "marketingTags": ["beginner-friendly", "hands-on", "certificate"],
      "targetAudience": ["beginners", "web developers", "students"],
      "estimatedHours": 15,
      "estimatedMinutes": 900,
      "difficulty": 1.5,
      "intensityLevel": "REGULAR",
      "certificate": true,
      "certificateTemplate": "default",
      "passingGrade": 70,
      "allowRetakes": true,
      "maxAttempts": 3,
      "enrollmentType": "FREE",
      "isPublic": true,
      "version": "1.0",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-15T10:30:00Z",
      "publishedAt": "2024-01-01T00:00:00Z",
      "archivedAt": null
    }
  }
]
```

#### 2. **Get Specific Course Enrollment**

```http
GET /api/payments/enrollments/course/:courseId
Authorization: Bearer <token>
```

**Description:** Returns enrollment details for a specific course if the user is enrolled.

**Response:** Same structure as above, but for a single enrollment.

### **GraphQL Routes**

#### 1. **Get All User Enrollments**

```graphql
query GetMyEnrollments {
  myEnrollments {
    id
    userId
    courseId
    status
    progress
    enrolledAt
    completedAt
    currentLectureId
    type
    source
    paymentStatus
    amountPaid
    currency
    completedLectures
    totalLectures
    totalTimeSpent
    streakDays
    certificateEarned
    course {
      id
      title
      description
      shortDescription
      thumbnail
      trailer
      galleryImages
      category
      subcategory
      level
      status
      price
      originalPrice
      currency
      discountPercent
      views
      uniqueViews
      completionRate
      avgRating
      totalRatings
      totalSections
      totalLectures
      totalQuizzes
      totalAssignments
      totalContentItems
      totalDiscussions
      totalAnnouncements
      isFeatured
      isBestseller
      isTrending
      instructor {
        id
        firstName
        lastName
        email
        profileImage
        title
        bio
        expertise
        rating
        totalStudents
        totalCourses
      }
      instructorId
      sections {
        id
        title
        description
        order
        lectures {
          id
          title
          description
          type
          duration
          order
          isPreview
        }
      }
      requirements
      whatYouLearn
      objectives
      prerequisites
      language
      subtitleLanguages
      hasLiveSessions
      hasRecordings
      hasDiscussions
      hasAssignments
      hasQuizzes
      downloadableResources
      offlineAccess
      mobileOptimized
      enrollmentStartDate
      enrollmentEndDate
      courseStartDate
      courseEndDate
      maxStudents
      currentEnrollments
      waitlistEnabled
      reviews {
        id
        rating
        comment
        user {
          id
          username
          lastName
        }
      }
      seoTitle
      seoDescription
      seoTags
      marketingTags
      targetAudience
      estimatedHours
      estimatedMinutes
      difficulty
      intensityLevel
      certificate
      certificateTemplate
      passingGrade
      allowRetakes
      maxAttempts
      enrollmentType
      isPublic
      version
      createdAt
      updatedAt
      publishedAt
      archivedAt
    }
  }
}
```

#### 2. **Get Specific Course Enrollment**

```graphql
query GetMyEnrollment($courseId: String!) {
  myEnrollment(courseId: $courseId) {
    id
    userId
    courseId
    status
    progress
    enrolledAt
    completedAt
    currentLectureId
    type
    source
    paymentStatus
    amountPaid
    currency
    completedLectures
    totalLectures
    totalTimeSpent
    streakDays
    certificateEarned
    course {
      # Same course fields as above
      id
      title
      description
      # ... (all course fields)
    }
  }
}
```

#### 3. **Track Course View**

```graphql
mutation TrackCourseView($courseId: String!) {
  trackCourseView(courseId: $courseId) {
    success
    message
    errors
  }
}
```

**Description:** Tracks when a student views a course. This updates the course's view count and the student's last accessed time.

**Response:**

```json
{
  "data": {
    "trackCourseView": {
      "success": true,
      "message": "Course view tracked successfully",
      "errors": []
    }
  }
}
```

**Note:** Course view tracking only works for enrolled students. Non-enrolled users will receive a success response but no tracking will occur.

## 🔐 **Authentication**

### **REST API Authentication**

- Uses `RestAuthGuard`
- Requires Bearer token in Authorization header
- Compatible with Clerk authentication

### **GraphQL Authentication**

- Uses `AuthGuard` and `RolesGuard`
- Works with existing GraphQL authentication system
- Requires valid user session

## 📊 **Response Fields**

### **Enrollment Fields**

- `id`: Unique enrollment identifier
- `userId`: User ID
- `courseId`: Course ID
- `status`: Enrollment status (ACTIVE, COMPLETED, CANCELLED, etc.)
- `progress`: Progress percentage (0-100)
- `enrolledAt`: Enrollment date
- `completedAt`: Completion date (if completed)
- `currentLectureId`: Current lecture being watched
- `type`: Enrollment type (FREE, PAID, SUBSCRIPTION)
- `source`: Enrollment source (DIRECT, REFERRAL, etc.)
- `paymentStatus`: Payment status (FREE, PAID, PENDING, etc.)
- `amountPaid`: Amount paid for the course
- `currency`: Payment currency
- `completedLectures`: Number of completed lectures
- `totalLectures`: Total number of lectures
- `totalTimeSpent`: Total time spent in minutes
- `streakDays`: Current learning streak
- `certificateEarned`: Whether certificate was earned

### **Comprehensive Course Fields**

#### **Basic Information**

- `id`, `title`, `description`, `shortDescription`
- `thumbnail`, `trailer`, `galleryImages`

#### **Categorization**

- `category`, `subcategory`, `level`, `status`

#### **Pricing & Analytics**

- `price`, `originalPrice`, `currency`, `discountPercent`
- `views`, `uniqueViews`, `completionRate`, `avgRating`, `totalRatings`

#### **Content Structure**

- `sections` with nested `lectures`
- Content counts: `totalSections`, `totalLectures`, `totalQuizzes`, etc.

#### **Instructor Information**

- Complete instructor profile with expertise, ratings, and statistics

#### **Course Features**

- `hasLiveSessions`, `hasRecordings`, `hasDiscussions`, etc.
- `downloadableResources`, `offlineAccess`, `mobileOptimized`

#### **Requirements & Outcomes**

- `requirements`, `whatYouLearn`, `objectives`, `prerequisites`

#### **Reviews & Social Proof**

- Recent reviews with user information
- Limited to 5 most recent reviews for performance

#### **SEO & Marketing**

- `seoTitle`, `seoDescription`, `seoTags`, `marketingTags`

#### **Scheduling & Capacity**

- Enrollment dates, course dates, capacity limits

#### **Certificates & Completion**

- Certificate settings, passing grades, retake policies

## 🚀 **Usage Examples**

### **JavaScript/Fetch Example**

```javascript
// Get all enrollments with comprehensive course data
async function getMyEnrollments() {
  const response = await fetch('/api/payments/enrollments', {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const enrollments = await response.json();
  return enrollments;
}

// Get specific course enrollment
async function getCourseEnrollment(courseId) {
  const response = await fetch(`/api/payments/enrollments/course/${courseId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const enrollment = await response.json();
  return enrollment;
}

// Track course view
async function trackCourseView(courseId) {
  const response = await fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: `
        mutation TrackCourseView($courseId: String!) {
          trackCourseView(courseId: $courseId) {
            success
            message
            errors
          }
        }
      `,
      variables: { courseId },
    }),
  });

  const result = await response.json();
  return result.data?.trackCourseView;
}
```

### **React Hook Example**

```javascript
import { useState, useEffect } from 'react';
import { useMutation, gql } from '@apollo/client';

const TRACK_COURSE_VIEW = gql`
  mutation TrackCourseView($courseId: String!) {
    trackCourseView(courseId: $courseId) {
      success
      message
      errors
    }
  }
`;

function useEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchEnrollments() {
      try {
        const response = await fetch('/api/payments/enrollments', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch enrollments');
        }

        const data = await response.json();
        setEnrollments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEnrollments();
  }, []);

  return { enrollments, loading, error };
}

function useCourseViewTracking() {
  const [trackView] = useMutation(TRACK_COURSE_VIEW, {
    onError: (error) => {
      console.error('Failed to track course view:', error);
    },
  });

  const trackCourseView = async (courseId) => {
    try {
      const result = await trackView({
        variables: { courseId },
      });

      if (result.data?.trackCourseView?.success) {
        console.log(
          'Course view tracked successfully:',
          result.data.trackCourseView.message,
        );
      } else {
        console.warn(
          'Course view tracking failed:',
          result.data?.trackCourseView?.message,
        );
      }

      return result.data?.trackCourseView;
    } catch (error) {
      console.error('Error tracking course view:', error);
      throw error;
    }
  };

  return { trackCourseView };
}
```

### **GraphQL Example (Apollo Client)**

```javascript
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_MY_ENROLLMENTS = gql`
  query GetMyEnrollments {
    myEnrollments {
      id
      progress
      enrolledAt
      course {
        id
        title
        thumbnail
        description
        instructor {
          firstName
          lastName
          rating
        }
        totalLectures
        totalSections
        avgRating
        completionRate
        views
        sections {
          id
          title
          lectures {
            id
            title
            duration
            isPreview
          }
        }
      }
    }
  }
`;

const TRACK_COURSE_VIEW = gql`
  mutation TrackCourseView($courseId: String!) {
    trackCourseView(courseId: $courseId) {
      success
      message
      errors
    }
  }
`;

function MyEnrollments() {
  const { loading, error, data } = useQuery(GET_MY_ENROLLMENTS);
  const [trackView] = useMutation(TRACK_COURSE_VIEW);

  const handleCourseClick = async (courseId) => {
    try {
      await trackView({ variables: { courseId } });
    } catch (error) {
      console.error('Failed to track course view:', error);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.myEnrollments.map((enrollment) => (
        <div
          key={enrollment.id}
          onClick={() => handleCourseClick(enrollment.course.id)}
        >
          <h3>{enrollment.course.title}</h3>
          <p>Progress: {enrollment.progress}%</p>
          <p>
            Instructor: {enrollment.course.instructor.firstName}{' '}
            {enrollment.course.instructor.lastName}
          </p>
          <p>Rating: {enrollment.course.avgRating}/5</p>
          <p>Completion Rate: {enrollment.course.completionRate}%</p>
          <p>Total Lectures: {enrollment.course.totalLectures}</p>
          <p>Views: {enrollment.course.views}</p>
        </div>
      ))}
    </div>
  );
}
```

## 🔍 **Error Handling**

### **Common Error Responses**

#### **401 Unauthorized**

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

#### **404 Not Found**

```json
{
  "statusCode": 400,
  "message": "Enrollment not found for this course"
}
```

#### **500 Internal Server Error**

```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

### **Course View Tracking Responses**

#### **Success (Enrolled User)**

```json
{
  "data": {
    "trackCourseView": {
      "success": true,
      "message": "Course view tracked successfully",
      "errors": []
    }
  }
}
```

#### **Skipped (Non-enrolled User)**

```json
{
  "data": {
    "trackCourseView": {
      "success": true,
      "message": "Course view tracking skipped - user not enrolled",
      "errors": []
    }
  }
}
```

#### **Error (Invalid Course)**

```json
{
  "data": {
    "trackCourseView": {
      "success": false,
      "message": "Course not found",
      "errors": ["Course not found"]
    }
  }
}
```

## 📱 **Frontend Integration Tips**

1. **Loading States**: Always show loading indicators while fetching data
2. **Error Handling**: Implement proper error handling for failed requests
3. **Caching**: Consider caching enrollment data to improve performance
4. **Real-time Updates**: Use WebSocket or polling for real-time progress updates
5. **Pagination**: For users with many enrollments, consider implementing pagination
6. **Course Previews**: Use the comprehensive course data to show rich course cards
7. **Progress Visualization**: Use the detailed progress data for progress bars and charts
8. **Instructor Profiles**: Display instructor information prominently
9. **Reviews Display**: Show recent reviews to build trust
10. **Content Navigation**: Use the sections and lectures data for course navigation
11. **View Tracking**: Track course views when students visit course pages
12. **Analytics Integration**: Use view tracking data for course popularity metrics

## 🔄 **Data Refresh**

- Enrollment data is updated in real-time as users progress through courses
- Progress tracking happens automatically when users watch lectures
- Certificate status updates when course completion requirements are met
- Payment status updates when payments are processed
- Course analytics (views, ratings, etc.) are updated regularly
- Course view counts are incremented when enrolled students visit courses

## 📈 **Analytics Integration**

The comprehensive enrollment data can be used for:

- **Learning Analytics**: Track user progress, engagement, and completion rates
- **Course Performance**: Monitor course popularity, ratings, and completion rates
- **Instructor Analytics**: Track instructor performance and student satisfaction
- **Content Optimization**: Identify popular and challenging content
- **Revenue Analytics**: Track enrollment trends and revenue for paid courses
- **User Experience**: Improve course discovery and navigation
- **Gamification**: Implement learning streaks, achievements, and leaderboards
- **View Analytics**: Track course popularity and engagement through view counts

## 🎯 **Performance Considerations**

- **Large Data Sets**: The comprehensive course data can be large, consider implementing pagination
- **Caching Strategy**: Cache course data that doesn't change frequently
- **Lazy Loading**: Load detailed course information only when needed
- **Image Optimization**: Optimize course thumbnails and gallery images
- **CDN Usage**: Use CDN for static assets like images and videos
- **Database Indexing**: Ensure proper indexing on frequently queried fields
- **View Tracking**: Implement rate limiting for view tracking to prevent abuse

## 🔧 **Advanced Features**

### **Filtering & Sorting**

```javascript
// Filter by course level
const beginnerCourses = enrollments.filter(
  (e) => e.course.level === 'BEGINNER',
);

// Sort by progress
const sortedByProgress = enrollments.sort((a, b) => b.progress - a.progress);

// Filter by instructor
const instructorCourses = enrollments.filter(
  (e) => e.course.instructor.id === instructorId,
);

// Sort by popularity (views)
const sortedByViews = enrollments.sort(
  (a, b) => b.course.views - a.course.views,
);
```

### **Search Functionality**

```javascript
// Search by course title or description
const searchCourses = (query) => {
  return enrollments.filter(
    (enrollment) =>
      enrollment.course.title.toLowerCase().includes(query.toLowerCase()) ||
      enrollment.course.description.toLowerCase().includes(query.toLowerCase()),
  );
};
```

### **Progress Analytics**

```javascript
// Calculate overall learning progress
const overallProgress =
  enrollments.reduce((total, enrollment) => total + enrollment.progress, 0) /
  enrollments.length;

// Get learning streak
const currentStreak = enrollments.reduce(
  (max, enrollment) => Math.max(max, enrollment.streakDays),
  0,
);

// Get total course views
const totalViews = enrollments.reduce(
  (total, enrollment) => total + enrollment.course.views,
  0,
);
```

### **View Tracking Integration**

```javascript
// Track course view when student visits course page
const handleCourseVisit = async (courseId) => {
  try {
    const result = await trackCourseView(courseId);
    if (result.success) {
      console.log('Course view tracked successfully');
      // Optionally refresh course data to get updated view count
      refetch();
    }
  } catch (error) {
    console.error('Failed to track course view:', error);
  }
};
```

This comprehensive enrollment system provides everything needed to build a rich, engaging learning experience for students! 🎓
