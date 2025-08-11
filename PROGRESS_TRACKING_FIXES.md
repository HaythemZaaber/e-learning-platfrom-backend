# Progress Tracking and Time Spent Calculation Fixes

## Issues Identified

The progress tracking system had several critical issues causing incorrect time spent calculations:

### 1. **Missing Time Tracking in `markLectureComplete`**

- **Problem**: When lectures were marked complete, `timeSpent` and `watchTime` were set to 0
- **Impact**: Completed lectures showed 0 minutes of time spent regardless of lecture duration
- **Location**: `src/course/course.service.ts:3879-3880`

### 2. **Inconsistent Time Unit Handling**

- **Problem**: The system mixed minutes and seconds inconsistently across different methods
- **Database Schema**:
  - `timeSpent` field stores minutes
  - `watchTime` field stores seconds
- **Previous Issues**:
  - `updateLectureProgress` incorrectly converted minutes to seconds for `timeSpent`
  - `getCourseProgress` incorrectly divided by 60 assuming `timeSpent` was in seconds

### 3. **Missing Time Accumulation**

- **Problem**: `markLectureComplete` didn't update enrollment's `totalTimeSpent`
- **Impact**: Course-level time tracking was incomplete

## Fixes Implemented

### 1. **Fixed `markLectureComplete` Method**

```typescript
// Before: timeSpent and watchTime set to 0
timeSpent: 0,
watchTime: 0,

// After: Calculate based on lecture duration
const timeSpentMinutes = progress >= 100 ? Math.ceil(lecture.duration / 60) : 0;
const watchTimeSeconds = progress >= 100 ? lecture.duration : 0;
```

### 2. **Corrected Time Unit Conversions**

```typescript
// In updateLectureProgress - Fixed unit handling
timeSpent: Math.round(timeSpent), // timeSpent parameter is in minutes
watchTime: Math.round(timeSpent * 60), // convert to seconds for watchTime

// In getCourseProgress - Fixed calculation
timeSpent: totalTimeSpent, // Already in minutes, no conversion needed
```

### 3. **Added Enrollment Time Tracking**

```typescript
// In markLectureComplete - Added time accumulation
totalTimeSpent: {
  increment: progress >= 100 ? timeSpentMinutes : 0,
},
```

### 4. **Data Migration Tools**

#### SQL Migration Script: `prisma/fix-time-spent-data.sql`

- Fixes existing progress records with `timeSpent = 0` for completed lectures
- Recalculates enrollment `totalTimeSpent` based on actual progress data
- Cleans up null and negative values

#### Service Methods for Data Repair

- `recalculateProgressData(courseId)`: Fix data for a specific course
- `recalculateAllProgressData()`: Fix data for all courses

#### GraphQL Mutations for Admins/Instructors

- `recalculateCourseProgressData`: Fix progress data for a course
- `recalculateAllProgressData`: Fix all progress data (admin only)

## Database Schema Clarification

The `Progress` model uses these time fields consistently:

```prisma
model Progress {
  // ...
  watchTime Int @default(0) // in seconds
  timeSpent Int @default(0) // in minutes
  // ...
}
```

## How to Apply Fixes

### 1. **Code Changes**

The code changes are already applied to:

- `src/course/course.service.ts`
- `src/course/course.resolver.ts`

### 2. **Fix Existing Data**

#### Option A: SQL Script (Recommended for production)

```bash
# Run the SQL migration script
psql -d your_database < prisma/fix-time-spent-data.sql
```

#### Option B: GraphQL Mutation (For specific courses)

```graphql
mutation RecalculateCourseProgress {
  recalculateCourseProgressData(courseId: "your-course-id") {
    success
    message
    errors
    metadata
  }
}
```

#### Option C: Fix All Data (Admin only)

```graphql
mutation RecalculateAllProgress {
  recalculateAllProgressData {
    success
    message
    errors
    metadata
  }
}
```

## Verification

After applying fixes, verify the results:

1. **Check Course Progress**:

```graphql
query GetCourseProgress {
  getCourseProgress(courseId: "your-course-id") {
    completedLectures
    totalLectures
    timeSpent # Should now show correct minutes
    completionPercentage
  }
}
```

2. **Check Individual Progress Records**:

```sql
SELECT
  l.title,
  l.duration as lecture_duration_seconds,
  p.timeSpent as time_spent_minutes,
  p.watchTime as watch_time_seconds,
  p.completed
FROM progress p
JOIN lectures l ON p.lectureId = l.id
WHERE p.courseId = 'your-course-id' AND p.completed = true;
```

## Expected Results

After applying fixes:

- ✅ Completed lectures show time spent equal to lecture duration (in minutes)
- ✅ Course progress shows total time spent as sum of all completed lecture durations
- ✅ Time units are consistent (minutes for `timeSpent`, seconds for `watchTime`)
- ✅ Enrollment `totalTimeSpent` reflects actual time spent on completed lectures

## Future Improvements

1. **Real-time Tracking**: Implement actual video/content consumption tracking
2. **Partial Progress**: Better handling of partially completed lectures
3. **Time Validation**: Add validation to prevent time spent exceeding lecture duration
4. **Analytics**: Enhanced time-based learning analytics

