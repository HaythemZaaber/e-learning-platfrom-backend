# Instructor Module Documentation

## Overview

The Instructor Module is a dedicated module that handles all instructor-related operations in the e-learning platform. It provides comprehensive functionality for managing instructor profiles, statistics, search, and discovery features.

## Module Structure

```
src/instructor/
├── instructor.module.ts          # Module definition
├── instructor.service.ts         # Business logic
├── instructor.resolver.ts        # GraphQL resolvers
├── entities/
│   └── instructor.entity.ts      # GraphQL object types
└── dto/
    └── instructor.dto.ts         # GraphQL input types
```

## Features

### 1. Instructor Profile Management

- **Create Profile**: Automatically creates comprehensive profiles from application data
- **Update Profile**: Allows instructors to update their profile information
- **Get Profile**: Retrieve instructor profile data
- **Delete Profile**: Admin-only profile deletion

### 2. Instructor Statistics & Analytics

- **Course Statistics**: Total courses, published courses, enrollments
- **Revenue Analytics**: Total revenue, average revenue per enrollment
- **Performance Metrics**: Ratings, completion rates, student satisfaction
- **Content Analytics**: Lectures, video hours, quizzes, assignments

### 3. Instructor Search & Discovery

- **Advanced Search**: Filter by expertise, categories, ratings, experience
- **Language Filtering**: Search by teaching languages
- **Verification Status**: Filter by verification level
- **Availability**: Search for instructors accepting students

## API Endpoints

### Queries

#### Get Instructor Profile

```graphql
query GetInstructorProfile($userId: String!) {
  getInstructorProfile(userId: $userId) {
    id
    userId
    title
    bio
    expertise
    experience
    isVerified
    verificationLevel
    # ... all profile fields
  }
}
```

#### Get My Instructor Profile

```graphql
query GetMyInstructorProfile {
  getMyInstructorProfile {
    id
    userId
    title
    bio
    expertise
    experience
    # ... profile fields
  }
}
```

#### Get Instructor Statistics

```graphql
query GetInstructorStats($userId: String!) {
  getInstructorStats(userId: $userId) {
    profile {
      id
      userId
      title
      bio
      expertise
      experience
      # ... profile fields
    }
    statistics {
      totalCourses
      publishedCourses
      totalEnrollments
      totalRevenue
      averageRating
      courses {
        id
        title
        status
        avgRating
        currentEnrollments
        price
      }
    }
  }
}
```

#### Get My Instructor Statistics

```graphql
query GetMyInstructorStats {
  getMyInstructorStats {
    profile { ... }
    statistics { ... }
  }
}
```

#### Search Instructors

```graphql
query SearchInstructors($filters: InstructorSearchFiltersInput) {
  searchInstructors(filters: $filters) {
    instructors {
      id
      userId
      title
      bio
      expertise
      experience
      isVerified
      teachingRating
      totalStudents
      totalCourses
      featuredInstructor
      badgesEarned
      user {
        id
        email
        firstName
        lastName
        profileImage
      }
    }
    total
    hasMore
  }
}
```

### Mutations

#### Update Instructor Profile

```graphql
mutation UpdateInstructorProfile($input: UpdateInstructorProfileInput!) {
  updateInstructorProfile(input: $input) {
    id
    userId
    title
    bio
    expertise
    experience
    isVerified
    verificationLevel
    updatedAt
  }
}
```

#### Update Instructor Profile (Admin)

```graphql
mutation UpdateInstructorProfileByUserId(
  $userId: String!
  $input: UpdateInstructorProfileInput!
) {
  updateInstructorProfileByUserId(userId: $userId, input: $input) {
    id
    userId
    title
    bio
    expertise
    experience
    isVerified
    verificationLevel
    updatedAt
  }
}
```

#### Delete Instructor Profile (Admin)

```graphql
mutation DeleteInstructorProfile($userId: String!) {
  deleteInstructorProfile(userId: $userId) {
    success
    message
  }
}
```

## Data Types

### InstructorProfile

Complete instructor profile with all fields:

```typescript
{
  id: string
  userId: string
  title?: string
  bio?: string
  shortBio?: string
  expertise: string[]
  qualifications: string[]
  experience?: number
  socialLinks: any
  personalWebsite?: string
  linkedinProfile?: string
  subjectsTeaching: string[]
  teachingCategories: string[]
  languagesSpoken: any
  teachingStyle?: string
  targetAudience?: string[]
  teachingMethodology?: string
  teachingRating?: number
  totalStudents: number
  totalCourses: number
  totalRevenue: number
  currency: string
  averageCourseRating: number
  studentRetentionRate: number
  courseCompletionRate: number
  responseTime: number
  studentSatisfaction: number
  isAcceptingStudents: boolean
  maxStudentsPerCourse?: number
  preferredSchedule: any
  availableTimeSlots: any
  isVerified: boolean
  verificationLevel?: string
  lastVerificationDate?: Date
  complianceStatus: string
  totalLectures: number
  totalVideoHours: number
  totalQuizzes: number
  totalAssignments: number
  contentUpdateFreq: number
  payoutSettings: any
  taxInformation: any
  paymentPreferences: any
  revenueSharing?: number
  isPromotionEligible: boolean
  marketingConsent: boolean
  featuredInstructor: boolean
  badgesEarned: string[]
  lastCourseUpdate?: Date
  lastStudentReply?: Date
  lastContentCreation?: Date
  createdAt: Date
  updatedAt: Date
  user?: User
}
```

### InstructorStats

Statistics and analytics data:

```typescript
{
  profile: InstructorProfile
  statistics: {
    totalCourses: number
    publishedCourses: number
    totalEnrollments: number
    totalRevenue: number
    averageRating: number
    courses: Course[]
  }
}
```

### InstructorSearchResponse

Search results with pagination:

```typescript
{
  instructors: InstructorProfile[]
  total: number
  hasMore: boolean
}
```

## Search Filters

### InstructorSearchFiltersInput

```typescript
{
  expertise?: string[]
  teachingCategories?: string[]
  minRating?: number
  minExperience?: number
  languages?: string[]
  isVerified?: boolean
  isAcceptingStudents?: boolean
  featuredInstructor?: boolean
  limit?: number
  offset?: number
}
```

### UpdateInstructorProfileInput

```typescript
{
  title?: string
  bio?: string
  shortBio?: string
  expertise?: string[]
  qualifications?: string[]
  experience?: number
  socialLinks?: any
  personalWebsite?: string
  linkedinProfile?: string
  subjectsTeaching?: string[]
  teachingCategories?: string[]
  languagesSpoken?: any
  teachingStyle?: string
  targetAudience?: string[]
  teachingMethodology?: string
  isAcceptingStudents?: boolean
  maxStudentsPerCourse?: number
  preferredSchedule?: any
  availableTimeSlots?: any
  payoutSettings?: any
  taxInformation?: any
  paymentPreferences?: any
  revenueSharing?: number
  isPromotionEligible?: boolean
  marketingConsent?: boolean
  featuredInstructor?: boolean
  badgesEarned?: string[]
}
```

## Integration with Verification Module

The Instructor Module integrates seamlessly with the Instructor Verification Module:

1. **Profile Creation**: When an admin approves an instructor application, the verification service calls the instructor service to create a comprehensive profile
2. **Data Mapping**: All application data is automatically mapped to the instructor profile structure
3. **Verification Status**: Profile verification status is properly set during creation

## Usage Examples

### 1. Creating an Instructor Profile (from verification)

```typescript
// In InstructorVerificationService
async approveInstructor(userId: string, application: any) {
  // Update user role
  await this.prisma.user.update({
    where: { id: userId },
    data: { role: 'INSTRUCTOR', instructorStatus: 'APPROVED' }
  });

  // Create comprehensive profile
  await this.instructorService.createInstructorProfile(userId, application);
}
```

### 2. Searching for Instructors

```typescript
// Search for verified instructors with specific expertise
const filters = {
  expertise: ['JavaScript', 'React'],
  isVerified: true,
  minRating: 4.0,
  limit: 10,
};

const results = await instructorService.searchInstructors(filters);
```

### 3. Getting Instructor Statistics

```typescript
// Get comprehensive statistics for an instructor
const stats = await instructorService.getInstructorStats(userId);
console.log(`Total Revenue: $${stats.statistics.totalRevenue}`);
console.log(`Average Rating: ${stats.statistics.averageRating}`);
```

## Testing

Use the provided test script to verify the module functionality:

```bash
node test-instructor-module.js
```

This will test:

- Profile retrieval
- Statistics calculation
- Instructor search
- Profile updates
- Error handling

## Benefits

1. **Separation of Concerns**: Instructor operations are properly separated from verification
2. **Comprehensive Functionality**: All instructor-related features in one module
3. **Scalable Architecture**: Easy to extend with new instructor features
4. **Type Safety**: Full TypeScript support with GraphQL types
5. **Performance**: Optimized queries and caching strategies
6. **Maintainability**: Clean, well-documented code structure

## Future Enhancements

1. **Instructor Dashboard**: Real-time analytics and insights
2. **Performance Tracking**: Advanced metrics and KPIs
3. **Communication Tools**: Messaging and notification systems
4. **Content Management**: Course creation and management tools
5. **Financial Tools**: Payout tracking and tax reporting
6. **Collaboration Features**: Team teaching and co-instructor support
