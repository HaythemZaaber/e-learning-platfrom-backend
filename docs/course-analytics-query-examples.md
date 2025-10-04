# Course Analytics GraphQL Query Examples

## Basic Course Analytics Query

```graphql
query GetCourseAnalytics($courseId: String!) {
  courseAnalytics(courseId: $courseId) {
    success
    message
    analytics {
      courseId
      courseTitle
      courseStatus
      createdAt

      # Enrollment Analytics
      totalEnrollments
      activeStudents
      completedStudents
      enrollmentTrend {
        date
        enrollments
        cumulative
      }
      completionStats {
        totalEnrollments
        completedEnrollments
        completionRate
        averageCompletionTime
      }

      # Rating & Review Analytics
      averageRating
      totalRatings
      ratingDistribution {
        one
        two
        three
        four
        five
      }
      recentReviews {
        id
        userId
        userName
        userProfileImage
        rating
        comment
        courseQuality
        instructorRating
        difficultyRating
        valueForMoney
        createdAt
        updatedAt
      }

      # Engagement Analytics
      engagementMetrics {
        totalViews
        uniqueViewers
        averageSessionDuration
        averageProgressRate
        totalInteractions
      }
      popularContent {
        id
        title
        type
        views
        completionRate
        averageRating
      }

      # Revenue Analytics
      revenueStats {
        totalRevenue
        averageRevenuePerStudent
        totalPaidEnrollments
        conversionRate
      }

      # Student Progress
      studentProgress {
        userId
        userName
        userProfileImage
        progressPercentage
        lecturesCompleted
        totalLectures
        timeSpent
        enrolledAt
        lastAccessedAt
        status
      }

      # Performance Metrics
      courseQualityScore
      instructorRating
      totalRevenue
      currency

      # Additional Metrics
      additionalMetrics
    }
    errors
  }
}
```

## Course Analytics with Filters

```graphql
query GetCourseAnalyticsWithFilters(
  $courseId: String!
  $filters: AnalyticsFilters
) {
  courseAnalytics(courseId: $courseId, filters: $filters) {
    success
    message
    analytics {
      courseId
      courseTitle

      # Enrollment trend based on time range
      enrollmentTrend {
        date
        enrollments
        cumulative
      }

      # Other analytics...
      averageRating
      totalRatings
      revenueStats {
        totalRevenue
        conversionRate
      }
    }
    errors
  }
}
```

## Variables Examples

### Basic Query Variables

```json
{
  "courseId": "course_123"
}
```

### Query with Time Range Filter

```json
{
  "courseId": "course_123",
  "filters": {
    "timeRange": "30d",
    "limit": 50
  }
}
```

### Query with Date Range Filter

```json
{
  "courseId": "course_123",
  "filters": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31",
    "limit": 100
  }
}
```

## Available Time Range Options

- `"7d"` - Last 7 days
- `"30d"` - Last 30 days
- `"90d"` - Last 90 days
- `"1y"` - Last year
- `"all"` - All time

## Response Data Structure

The analytics response includes:

### Enrollment Analytics

- Total enrollments count
- Active vs completed students
- Enrollment trend over time
- Completion statistics

### Rating & Review Analytics

- Average rating and total ratings
- Rating distribution (1-5 stars)
- Recent reviews with detailed ratings

### Engagement Analytics

- Total views and unique viewers
- Average session duration
- Average progress rate
- Popular content performance

### Revenue Analytics

- Total revenue generated
- Average revenue per student
- Conversion rate from free to paid
- Total paid enrollments

### Student Progress

- Individual student progress tracking
- Time spent on course
- Last access dates
- Completion status

### Performance Metrics

- Course quality score (0-100)
- Instructor rating
- Overall performance indicators

## Usage in Frontend

This query is perfect for creating instructor dashboards with:

1. **Charts and Graphs**
   - Enrollment trend charts
   - Rating distribution pie charts
   - Revenue growth graphs
   - Student progress bars

2. **Review Management**
   - Recent reviews display
   - Rating analytics
   - Student feedback analysis

3. **Performance Tracking**
   - Course quality metrics
   - Student engagement rates
   - Completion statistics

4. **Revenue Analytics**
   - Revenue tracking
   - Conversion rate monitoring
   - Student value analysis
