-- Fix Time Spent Data Migration Script
-- This script fixes progress data that may have incorrect timeSpent values
-- due to the previous bug where timeSpent was not properly recorded

-- 1. Update progress records where lectures are completed but timeSpent is 0
-- Set timeSpent based on the lecture duration
UPDATE progress 
SET timeSpent = CEIL(l.duration / 60.0),
    watchTime = l.duration,
    updatedAt = NOW()
FROM lectures l
WHERE progress.lectureId = l.id 
  AND progress.completed = true 
  AND progress.timeSpent = 0;

-- 2. Recalculate enrollment totalTimeSpent based on actual progress records
UPDATE enrollments 
SET totalTimeSpent = subquery.total_time_spent
FROM (
  SELECT 
    courseId,
    userId,
    COALESCE(SUM(timeSpent), 0) as total_time_spent
  FROM progress 
  WHERE completed = true
  GROUP BY courseId, userId
) as subquery
WHERE enrollments.courseId = subquery.courseId 
  AND enrollments.userId = subquery.userId;

-- 3. Update any remaining null or inconsistent values
UPDATE progress 
SET timeSpent = 0 
WHERE timeSpent IS NULL;

UPDATE progress 
SET watchTime = 0 
WHERE watchTime IS NULL;

-- 4. Fix any negative values that might exist
UPDATE progress 
SET timeSpent = 0 
WHERE timeSpent < 0;

UPDATE progress 
SET watchTime = 0 
WHERE watchTime < 0;

UPDATE enrollments 
SET totalTimeSpent = 0 
WHERE totalTimeSpent < 0;

