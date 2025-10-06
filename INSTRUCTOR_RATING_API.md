# Instructor Rating System API

This document describes the simple instructor rating system that allows students to rate instructors only if they have enrolled in their courses or completed live sessions with them.

## Features

- **Simple Rating**: Float rating from 1.0 to 5.0 stars
- **Optional Comment**: Students can leave a comment with their rating
- **Eligibility Check**: Students can only rate instructors they have interacted with
- **Public/Private Ratings**: Ratings can be marked as public or private

## API Endpoints

### 1. Check Rating Eligibility

**GET** `/instructor-ratings/eligibility/{instructorId}`

Check if a student can rate an instructor.

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "isEligible": true,
  "reason": "You have enrolled in 2 course(s) and completed 1 live session(s) with this instructor.",
  "courseEnrollments": ["course-id-1", "course-id-2"],
  "completedSessions": ["session-id-1"]
}
```

### 2. Create Instructor Rating

**POST** `/instructor-ratings`

Create a new rating for an instructor.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "instructorId": "instructor-id",
  "rating": 4.5,
  "comment": "Great instructor! Very knowledgeable and patient.",
  "isPublic": true
}
```

**Response:**

```json
{
  "id": "rating-id",
  "instructorId": "instructor-id",
  "studentId": "student-id",
  "rating": 4.5,
  "comment": "Great instructor! Very knowledgeable and patient.",
  "isVerified": true,
  "isPublic": true,
  "helpfulVotes": 0,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "student": {
    "id": "student-id",
    "firstName": "John",
    "lastName": "Doe",
    "profileImage": "https://example.com/image.jpg"
  }
}
```

### 3. Update Instructor Rating

**PUT** `/instructor-ratings/{ratingId}`

Update an existing rating.

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "rating": 4.8,
  "comment": "Updated: Even better than I thought!",
  "isPublic": true
}
```

### 4. Delete Instructor Rating

**DELETE** `/instructor-ratings/{ratingId}`

Delete a rating (only the student who created it can delete it).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Rating deleted successfully"
}
```

### 5. Get Instructor Ratings

**GET** `/instructor-ratings/instructor/{instructorId}`

Get all public ratings for an instructor.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `minRating` (optional): Minimum rating filter
- `maxRating` (optional): Maximum rating filter

**Response:**

```json
{
  "ratings": [
    {
      "id": "rating-id",
      "rating": 4.5,
      "comment": "Great instructor!",
      "createdAt": "2024-01-15T10:30:00Z",
      "student": {
        "firstName": "John",
        "lastName": "Doe"
      }
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

### 6. Get Instructor Rating Statistics

**GET** `/instructor-ratings/instructor/{instructorId}/stats`

Get rating statistics for an instructor.

**Response:**

```json
{
  "totalRatings": 25,
  "averageRating": 4.2,
  "ratingDistribution": {
    "1": 1,
    "2": 2,
    "3": 5,
    "4": 8,
    "5": 9
  }
}
```

### 7. Get Student's Rating for Instructor

**GET** `/instructor-ratings/student/{instructorId}`

Get a student's rating for a specific instructor (if it exists).

**Headers:**

```
Authorization: Bearer <token>
```

**Response:**

```json
{
  "id": "rating-id",
  "rating": 4.5,
  "comment": "Great instructor!",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

## Error Responses

### 403 Forbidden - Not Eligible to Rate

```json
{
  "statusCode": 403,
  "message": "You can only rate instructors after enrolling in their courses or completing live sessions with them.",
  "error": "Forbidden"
}
```

### 400 Bad Request - Rating Already Exists

```json
{
  "statusCode": 400,
  "message": "You have already rated this instructor. You can update your existing rating instead.",
  "error": "Bad Request"
}
```

### 404 Not Found - Instructor Not Found

```json
{
  "statusCode": 404,
  "message": "Instructor not found",
  "error": "Not Found"
}
```

## Database Schema

The system uses a simple `InstructorRating` table:

```sql
CREATE TABLE instructor_ratings (
  id TEXT PRIMARY KEY,
  instructor_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  rating REAL NOT NULL, -- 1.0 to 5.0
  comment TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  helpful_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(instructor_id, student_id)
);
```

## Usage Examples

### Frontend Integration

```javascript
// Check if student can rate instructor
const eligibility = await fetch(
  '/api/instructor-ratings/eligibility/instructor-id',
  {
    headers: { Authorization: `Bearer ${token}` },
  },
);

// Create a rating
const rating = await fetch('/api/instructor-ratings', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    instructorId: 'instructor-id',
    rating: 4.5,
    comment: 'Great instructor!',
    isPublic: true,
  }),
});

// Get instructor ratings
const ratings = await fetch(
  '/api/instructor-ratings/instructor/instructor-id?page=1&limit=10',
);
```

This simple rating system ensures that only students who have actually interacted with instructors can rate them, providing more meaningful and authentic feedback.
