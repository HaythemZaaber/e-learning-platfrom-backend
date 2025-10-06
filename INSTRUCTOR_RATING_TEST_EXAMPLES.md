# Instructor Rating System - Test Examples

## ✅ Database Setup Complete

The instructor rating system is now fully set up and ready to use! The database table `instructor_ratings` has been created successfully.

## 🧪 Testing the API Endpoints

### 1. Check Rating Eligibility

**GET** `/instructor-ratings/eligibility/{instructorId}`

```bash
curl -X GET "http://localhost:3000/instructor-ratings/eligibility/clr1234567890" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response (if eligible):**

```json
{
  "isEligible": true,
  "reason": "You have enrolled in 2 course(s) and completed 1 live session(s) with this instructor.",
  "courseEnrollments": ["course-id-1", "course-id-2"],
  "completedSessions": ["session-id-1"]
}
```

**Expected Response (if not eligible):**

```json
{
  "isEligible": false,
  "reason": "You can only rate instructors after enrolling in their courses or completing live sessions with them.",
  "courseEnrollments": [],
  "completedSessions": []
}
```

### 2. Create Instructor Rating

**POST** `/instructor-ratings`

```bash
curl -X POST "http://localhost:3000/instructor-ratings" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "instructorId": "clr1234567890",
    "rating": 4.5,
    "comment": "Great instructor! Very knowledgeable and patient.",
    "isPublic": true
  }'
```

**Expected Response:**

```json
{
  "id": "rating-id",
  "instructorId": "clr1234567890",
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

### 3. Get Instructor Ratings

**GET** `/instructor-ratings/instructor/{instructorId}`

```bash
curl -X GET "http://localhost:3000/instructor-ratings/instructor/clr1234567890?page=1&limit=10"
```

### 4. Get Instructor Rating Statistics

**GET** `/instructor-ratings/instructor/{instructorId}/stats`

```bash
curl -X GET "http://localhost:3000/instructor-ratings/instructor/clr1234567890/stats"
```

**Expected Response:**

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

### 5. Get Student's Rating for Instructor

**GET** `/instructor-ratings/student/{instructorId}`

```bash
curl -X GET "http://localhost:3000/instructor-ratings/student/clr1234567890" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 Frontend Integration Example

```javascript
// Check if student can rate instructor
async function checkRatingEligibility(instructorId) {
  try {
    const response = await fetch(
      `/api/instructor-ratings/eligibility/${instructorId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    const eligibility = await response.json();

    if (eligibility.isEligible) {
      console.log('Student can rate this instructor:', eligibility.reason);
      return true;
    } else {
      console.log('Student cannot rate:', eligibility.reason);
      return false;
    }
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return false;
  }
}

// Create a rating
async function createInstructorRating(instructorId, rating, comment) {
  try {
    const response = await fetch('/api/instructor-ratings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instructorId,
        rating,
        comment,
        isPublic: true,
      }),
    });

    if (response.ok) {
      const ratingData = await response.json();
      console.log('Rating created successfully:', ratingData);
      return ratingData;
    } else {
      const error = await response.json();
      console.error('Error creating rating:', error);
      return null;
    }
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}

// Get instructor ratings
async function getInstructorRatings(instructorId, page = 1, limit = 10) {
  try {
    const response = await fetch(
      `/api/instructor-ratings/instructor/${instructorId}?page=${page}&limit=${limit}`,
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return null;
  }
}
```

## 📊 Database Verification

You can verify the database table was created correctly by running:

```sql
-- Check if the table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'instructor_ratings';

-- Check table structure
\d instructor_ratings;

-- Check if there are any ratings (should be empty initially)
SELECT COUNT(*) FROM instructor_ratings;
```

## 🎯 Key Features Verified

✅ **Database Table Created**: `instructor_ratings` table exists  
✅ **Simple Rating System**: Float rating (1.0-5.0) + optional comment  
✅ **Eligibility Checks**: Only students who have enrolled in courses or completed live sessions can rate  
✅ **No Source Tracking**: Removed complexity - just rating and comment  
✅ **Public/Private Ratings**: Ratings can be marked as public or private  
✅ **Type Safety**: All TypeScript types are properly defined  
✅ **API Documentation**: Complete Swagger documentation available

## 🚀 Ready for Production

The instructor rating system is now fully functional and ready to be used in your e-learning platform! Students can rate instructors based on their actual interactions (course enrollments or live sessions), ensuring authentic and meaningful feedback.

