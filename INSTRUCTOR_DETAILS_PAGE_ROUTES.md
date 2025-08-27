# Instructor Details Page Routes Documentation

## Overview

This document outlines all the REST API routes created for the instructor details page. The implementation uses **REST API** endpoints with comprehensive DTOs and proper validation.

## Architecture Decision

**Technology Choice: REST API**

- **Reason**: REST APIs are more suitable for public-facing instructor profile pages as they provide better caching, SEO benefits, and simpler integration with frontend frameworks
- **Alternative Considered**: GraphQL was considered but REST provides better performance for this use case with predictable data structures

## Base URL

```
/api/instructor-profiles
/api/instructor-reviews
```

## Authentication

All endpoints require authentication using Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## 1. Instructor Profile Details

### Get Comprehensive Instructor Details

**Endpoint:** `GET /api/instructor-profiles/details/:instructorId`

**Description:** Retrieves comprehensive instructor information for the public profile page including basic info, profile details, statistics, recent courses, reviews, and availability.

**Parameters:**

- `instructorId` (path): The instructor's user ID

**Response:**

```json
{
  "instructor": {
    "id": "string",
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "profileImage": "string",
    "teachingRating": 4.5,
    "totalStudents": 150,
    "totalCourses": 12,
    "expertise": ["JavaScript", "React", "Node.js"],
    "qualifications": ["MSc Computer Science", "AWS Certified"],
    "experience": 5,
    "bio": "Experienced software engineer..."
  },
  "profile": {
    // Full instructor profile details
  },
  "stats": {
    // Instructor statistics
  },
  "recentCourses": [
    // Array of recent courses (limited to 5)
  ],
  "recentReviews": [
    // Array of recent reviews (limited to 5)
  ],
  "availability": {
    // Availability information
  },
  "summary": {
    "totalCourses": 12,
    "totalReviews": 45,
    "averageRating": 4.5,
    "totalStudents": 150,
    "totalSessions": 89
  }
}
```

**DTO Used:** `InstructorDetailsResponseDto`

---

## 2. Instructor Courses

### Get Instructor Courses

**Endpoint:** `GET /api/instructor-profiles/:instructorId/courses`

**Description:** Retrieves all courses by a specific instructor with pagination and filtering options.

**Parameters:**

- `instructorId` (path): The instructor's user ID
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 10)
- `status` (query, optional): Filter by course status

**Response:**

```json
{
  "courses": [
    {
      "id": "string",
      "title": "Advanced JavaScript",
      "description": "Learn advanced JavaScript concepts",
      "price": 99.99,
      "status": "PUBLISHED",
      "totalLectures": 25,
      "totalDuration": 480,
      "totalEnrollments": 45,
      "averageRating": 4.7,
      "totalReviews": 12,
      "sections": [
        {
          "id": "string",
          "title": "Introduction",
          "lectures": [
            {
              "id": "string",
              "title": "Welcome",
              "duration": 15,
              "isPreview": true
            }
          ]
        }
      ]
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 10,
  "totalPages": 2
}
```

**DTO Used:** `InstructorCoursesQueryDto`

---

## 3. Instructor Reviews

### Get Instructor Reviews

**Endpoint:** `GET /api/instructor-reviews/:instructorId`

**Description:** Retrieves all reviews for a specific instructor with pagination and rating filtering.

**Parameters:**

- `instructorId` (path): The instructor's user ID
- `page` (query, optional): Page number (default: 1)
- `limit` (query, optional): Items per page (default: 10)
- `rating` (query, optional): Filter by specific rating (1-5)

**Response:**

```json
{
  "reviews": [
    {
      "id": "string",
      "overallRating": 5,
      "contentQuality": 5,
      "instructorRating": 5,
      "technicalQuality": 4,
      "valueForMoney": 5,
      "positives": "Great teaching style",
      "improvements": "More examples would be helpful",
      "comment": "Excellent session!",
      "createdAt": "2024-01-15T10:30:00Z",
      "reviewer": {
        "id": "string",
        "firstName": "John",
        "lastName": "Doe",
        "profileImage": "string"
      },
      "session": {
        "id": "string",
        "title": "JavaScript Fundamentals",
        "sessionType": "INDIVIDUAL",
        "scheduledStart": "2024-01-10T14:00:00Z"
      }
    }
  ],
  "stats": {
    "totalReviews": 45,
    "averageOverallRating": 4.5,
    "averageContentQuality": 4.3,
    "averageInstructorRating": 4.7,
    "averageTechnicalQuality": 4.2,
    "averageValueForMoney": 4.4,
    "ratingDistribution": {
      "1": 2,
      "2": 1,
      "3": 3,
      "4": 15,
      "5": 24
    }
  },
  "total": 45,
  "page": 1,
  "limit": 10,
  "totalPages": 5
}
```

**DTO Used:** `InstructorReviewsQueryDto`

### Get Review Statistics

**Endpoint:** `GET /api/instructor-reviews/:instructorId/stats`

**Description:** Retrieves comprehensive review statistics for an instructor.

**Response:**

```json
{
  "totalReviews": 45,
  "averageOverallRating": 4.5,
  "averageContentQuality": 4.3,
  "averageInstructorRating": 4.7,
  "averageTechnicalQuality": 4.2,
  "averageValueForMoney": 4.4,
  "ratingDistribution": {
    "1": 2,
    "2": 1,
    "3": 3,
    "4": 15,
    "5": 24
  },
  "recentReviews": [
    // Array of 5 most recent reviews
  ]
}
```

---

## 4. Instructor Availability

### Get Instructor Availability

**Endpoint:** `GET /api/instructor-profiles/:instructorId/availability`

**Description:** Retrieves instructor availability information including time slots and default settings.

**Parameters:**

- `instructorId` (path): The instructor's user ID
- `startDate` (query, optional): Start date filter (YYYY-MM-DD)
- `endDate` (query, optional): End date filter (YYYY-MM-DD)

**Response:**

```json
{
  "availabilities": [
    {
      "id": "string",
      "specificDate": "2024-01-20",
      "startTime": "09:00",
      "endTime": "17:00",
      "isActive": true,
      "maxSessionsInSlot": 3,
      "defaultSlotDuration": 60,
      "generatedSlots": [
        {
          "id": "string",
          "startTime": "09:00",
          "endTime": "10:00",
          "isBooked": false
        }
      ]
    }
  ],
  "defaultSettings": {
    "defaultSessionDuration": 60,
    "defaultSessionType": "INDIVIDUAL",
    "individualSessionRate": 50,
    "groupSessionRate": 30,
    "currency": "USD",
    "bufferBetweenSessions": 15,
    "maxSessionsPerDay": 8,
    "preferredSchedule": {},
    "availableTimeSlots": []
  },
  "summary": {
    "totalAvailabilities": 15,
    "activeAvailabilities": 12,
    "upcomingAvailabilities": 8
  }
}
```

**DTO Used:** `InstructorAvailabilityQueryDto`

---

## 5. Instructor Statistics

### Get Instructor Statistics

**Endpoint:** `GET /api/instructor-profiles/:instructorId/stats`

**Description:** Retrieves comprehensive statistics for an instructor including session data, earnings, and ratings.

**Response:**

```json
{
  "totalSessions": 89,
  "totalRevenue": 4450.0,
  "averageRating": 4.5,
  "totalLiveSessions": 67,
  "averageSessionRating": 4.6,
  "totalStudents": 150,
  "totalCourses": 12,
  "completionRate": 94.5,
  "totalEarnings": 3560.0
}
```

---

## 6. Search Instructors

### Search Instructors

**Endpoint:** `GET /api/instructor-profiles`

**Description:** Search and filter instructors with various criteria.

**Parameters:**

- `search` (query, optional): Search term
- `subjects` (query, optional): Subject filters (array)
- `categories` (query, optional): Category filters (array)
- `minRating` (query, optional): Minimum rating filter
- `maxPrice` (query, optional): Maximum price filter
- `availability` (query, optional): Has availability filter
- `page` (query, optional): Page number
- `limit` (query, optional): Items per page

**Response:**

```json
{
  "profiles": [
    {
      "id": "string",
      "title": "Senior Software Engineer",
      "bio": "Experienced instructor...",
      "subjectsTeaching": ["JavaScript", "React"],
      "averageSessionRating": 4.5,
      "individualSessionRate": 50,
      "user": {
        "id": "string",
        "firstName": "John",
        "lastName": "Doe",
        "profileImage": "string",
        "teachingRating": 4.5
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

## DTOs and Entities

### DTOs Created:

1. **InstructorDetailsResponseDto**
   - Comprehensive response structure for instructor details page
   - Includes instructor info, profile, stats, recent courses, reviews, and availability

2. **InstructorCoursesQueryDto**
   - Query parameters for instructor courses endpoint
   - Includes pagination and status filtering

3. **InstructorReviewsQueryDto**
   - Query parameters for instructor reviews endpoint
   - Includes pagination and rating filtering

4. **InstructorAvailabilityQueryDto**
   - Query parameters for instructor availability endpoint
   - Includes date range filtering

5. **SessionStatsDto**
   - Response structure for session statistics
   - Includes earnings, ratings, completion rates, etc.

### Entities Used:

1. **User Entity** (from existing schema)
   - Basic instructor information
   - Teaching ratings and statistics

2. **InstructorProfile Entity** (from existing schema)
   - Detailed instructor profile information
   - Teaching preferences and settings

3. **Course Entity** (from existing schema)
   - Course information and statistics
   - Section and lecture details

4. **SessionReview Entity** (from existing schema)
   - Review information and ratings
   - Reviewer and session details

5. **InstructorAvailability Entity** (from existing schema)
   - Availability time slots
   - Booking information

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- **200**: Success
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (missing or invalid token)
- **404**: Not Found (instructor not found)
- **500**: Internal Server Error

Error Response Format:

```json
{
  "statusCode": 404,
  "message": "Instructor not found",
  "error": "Not Found"
}
```

---

## Usage Examples

### Frontend Integration Examples:

1. **Get Instructor Details Page:**

```javascript
const response = await fetch('/api/instructor-profiles/details/instructor123', {
  headers: {
    Authorization: 'Bearer ' + token,
  },
});
const instructorDetails = await response.json();
```

2. **Get Instructor Courses:**

```javascript
const response = await fetch(
  '/api/instructor-profiles/instructor123/courses?page=1&limit=5',
  {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  },
);
const courses = await response.json();
```

3. **Get Instructor Reviews:**

```javascript
const response = await fetch(
  '/api/instructor-reviews/instructor123?page=1&limit=10&rating=5',
  {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  },
);
const reviews = await response.json();
```

4. **Get Instructor Availability:**

```javascript
const response = await fetch(
  '/api/instructor-profiles/instructor123/availability?startDate=2024-01-20&endDate=2024-01-27',
  {
    headers: {
      Authorization: 'Bearer ' + token,
    },
  },
);
const availability = await response.json();
```

---

## Performance Considerations

1. **Database Optimization:**
   - Used Prisma's include and select for efficient queries
   - Implemented pagination to limit data transfer
   - Added proper indexing on frequently queried fields

2. **Caching Strategy:**
   - Instructor profile data can be cached for 15 minutes
   - Course listings can be cached for 5 minutes
   - Review statistics can be cached for 10 minutes

3. **Response Optimization:**
   - Limited recent courses and reviews to 5 items in details endpoint
   - Used selective field inclusion to reduce payload size
   - Implemented proper error handling to prevent unnecessary database calls

---

## Security Considerations

1. **Authentication:**
   - All endpoints require valid Bearer token
   - Token validation through RestAuthGuard

2. **Authorization:**
   - Public instructor profiles accessible to all authenticated users
   - Private instructor data protected through proper filtering

3. **Input Validation:**
   - All query parameters validated using class-validator
   - SQL injection prevention through Prisma ORM
   - XSS protection through proper data sanitization

---

## Future Enhancements

1. **GraphQL Alternative:**
   - Could implement GraphQL schema for more flexible queries
   - Would allow clients to request only needed fields

2. **Real-time Updates:**
   - WebSocket integration for live availability updates
   - Real-time review notifications

3. **Advanced Filtering:**
   - Geographic location filtering
   - Language preference filtering
   - Price range filtering

4. **Analytics Integration:**
   - View tracking for instructor profiles
   - Engagement metrics
   - Conversion tracking

---

## Conclusion

The instructor details page routes provide a comprehensive REST API solution that efficiently serves all the data needed for a modern instructor profile page. The implementation prioritizes performance, security, and maintainability while providing a clean and intuitive API interface for frontend integration.
