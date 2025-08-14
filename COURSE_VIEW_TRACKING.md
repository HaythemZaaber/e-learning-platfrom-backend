# Course View Tracking

## Overview

The course view tracking system allows you to track when students view courses, providing valuable analytics data for course popularity and engagement metrics.

## 🔗 **GraphQL Mutation**

### **Track Course View**

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

## 📊 **Response Examples**

### **Success Response (Enrolled User)**

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

### **Skipped Response (Non-enrolled User)**

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

### **Error Response (Invalid Course)**

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

## 🚀 **Usage Examples**

### **React Hook Example**

```javascript
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

### **JavaScript/Fetch Example**

```javascript
async function trackCourseView(courseId, token) {
  try {
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
  } catch (error) {
    console.error('Error tracking course view:', error);
    throw error;
  }
}
```

### **Integration in Course Component**

```javascript
import React, { useEffect } from 'react';
import { useCourseViewTracking } from './hooks/useCourseViewTracking';

function CoursePage({ courseId }) {
  const { trackCourseView } = useCourseViewTracking();

  useEffect(() => {
    // Track course view when component mounts
    trackCourseView(courseId);
  }, [courseId, trackCourseView]);

  return (
    <div>
      <h1>Course Content</h1>
      {/* Course content here */}
    </div>
  );
}
```

## 🔐 **Authentication**

- Requires valid user authentication
- Uses `AuthGuard` and `RolesGuard`
- Works with existing GraphQL authentication system

## 📈 **Analytics Benefits**

### **Course Popularity**

- Track which courses are most viewed
- Identify trending courses
- Monitor course engagement over time

### **Student Engagement**

- Understand student behavior patterns
- Track course completion rates vs. view counts
- Identify courses that need improvement

### **Instructor Insights**

- Help instructors understand course popularity
- Provide data for course optimization
- Track instructor performance metrics

## ⚠️ **Important Notes**

1. **Enrollment Required**: Course view tracking only works for enrolled students
2. **Non-enrolled Users**: Will receive success response but no tracking occurs
3. **Rate Limiting**: Consider implementing rate limiting to prevent abuse
4. **Privacy**: View tracking respects user privacy and enrollment status
5. **Performance**: View tracking is optimized for minimal database impact

## 🔧 **Implementation Details**

### **What Gets Updated**

- Course `views` count (incremented)
- Course `uniqueViews` count (incremented)
- Enrollment `lastAccessedAt` timestamp
- Course analytics data

### **When to Track**

- When student visits course page
- When student navigates to course content
- When student returns to course after break

### **Error Handling**

- Invalid course IDs return error response
- Non-published courses return error response
- Network errors are handled gracefully

## 📱 **Best Practices**

1. **Track on Page Load**: Call the mutation when course page loads
2. **Handle Errors Gracefully**: Don't block UI if tracking fails
3. **Respect User Privacy**: Only track for enrolled students
4. **Optimize Performance**: Don't track too frequently
5. **Provide Feedback**: Log tracking results for debugging

## 🎯 **Use Cases**

### **Course Discovery**

- Show most viewed courses on homepage
- Display trending courses
- Highlight popular courses in categories

### **Instructor Dashboard**

- Show course view analytics
- Track course popularity trends
- Identify courses needing attention

### **Student Dashboard**

- Show recently viewed courses
- Track learning progress
- Provide course recommendations

This course view tracking system provides valuable insights for both students and instructors while maintaining privacy and performance standards! 📊

