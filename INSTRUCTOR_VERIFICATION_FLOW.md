# Instructor Verification System - Complete Flow Documentation

## 📋 Overview

This document outlines the complete instructor verification workflow, including all GraphQL mutations, queries, and the application status flow for frontend integration.

## 🔄 Application Status Flow

```
DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED/REJECTED/REQUIRES_MORE_INFO
```

### Status Descriptions:

- **DRAFT**: Application is being worked on by the user (not visible to admin)
- **SUBMITTED**: Application is submitted and waiting for admin review
- **UNDER_REVIEW**: Admin is currently reviewing the application
- **APPROVED**: Application approved, user becomes instructor
- **REJECTED**: Application rejected with reason
- **REQUIRES_MORE_INFO**: Admin requested additional information
- **INTERVIEW_SCHEDULED**: Interview scheduled for further evaluation

## 🎯 User Flow (Frontend Integration)

### 1. Application Creation & Draft Management

#### Create New Application

```graphql
mutation CreateInstructorVerification(
  $input: CreateInstructorVerificationInput!
) {
  createInstructorVerification(input: $input) {
    success
    message
    data {
      id
      status
      currentStep
      completionScore
      # ... other fields
    }
    errors
  }
}
```

**Input:**

```json
{
  "input": {
    "userId": "user_id_here",
    "metadata": {}
  }
}
```

#### Save Draft

```graphql
mutation SaveVerificationDraft($input: SaveVerificationDraftInput!) {
  saveVerificationDraft(input: $input) {
    success
    message
    data {
      id
      status
      currentStep
      completionScore
      personalInfo
      professionalBackground
      teachingInformation
      documents
      consents
    }
    errors
  }
}
```

**Input:**

```json
{
  "input": {
    "id": "application_id",
    "draftData": {
      "personalInfo": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phoneNumber": "+1234567890",
        "dateOfBirth": "1990-01-01",
        "nationality": "US",
        "streetAddress": "123 Main St",
        "city": "New York",
        "state": "NY",
        "postalCode": "10001",
        "country": "USA",
        "timezone": "America/New_York",
        "primaryLanguage": "English",
        "languagesSpoken": [
          {
            "language": "English",
            "proficiency": "native",
            "canTeachIn": true
          }
        ],
        "emergencyContact": {
          "name": "Jane Doe",
          "relationship": "Spouse",
          "phoneNumber": "+1234567891",
          "email": "jane@example.com"
        }
      },
      "professionalBackground": {
        "currentJobTitle": "Senior Developer",
        "currentEmployer": "Tech Corp",
        "employmentType": "full_time",
        "workLocation": "Remote",
        "yearsOfExperience": 5,
        "education": [
          {
            "institution": "University of Technology",
            "degree": "Bachelor of Science",
            "field": "Computer Science",
            "startYear": "2010",
            "endYear": "2014",
            "gpa": "3.8",
            "honors": "Magna Cum Laude",
            "description": "Focused on software engineering"
          }
        ],
        "experience": [
          {
            "company": "Tech Corp",
            "position": "Senior Developer",
            "startDate": "2020-01-01",
            "endDate": "2023-12-31",
            "current": true,
            "location": "Remote",
            "employmentType": "full_time",
            "description": "Leading development of web applications",
            "achievements": [
              "Led team of 5 developers",
              "Improved performance by 40%"
            ]
          }
        ],
        "references": [
          {
            "name": "Jane Smith",
            "position": "Engineering Manager",
            "company": "Tech Corp",
            "email": "jane@techcorp.com",
            "phone": "+1234567892",
            "relationship": "Manager",
            "yearsKnown": "3",
            "notes": "Excellent team player",
            "contactPermission": true
          }
        ]
      },
      "teachingInformation": {
        "subjectsToTeach": [
          {
            "subject": "JavaScript",
            "category": "Programming",
            "level": "intermediate",
            "experienceYears": 5,
            "confidence": 5
          }
        ],
        "hasTeachingExperience": true,
        "teachingExperience": [
          {
            "role": "Mentor",
            "institution": "Code Academy",
            "subject": "JavaScript",
            "level": "Beginner",
            "startDate": "2022-01-01",
            "endDate": "2023-12-31",
            "isCurrent": true,
            "description": "Mentoring junior developers",
            "studentsCount": 15,
            "achievements": ["100% student satisfaction", "90% completion rate"]
          }
        ],
        "teachingMotivation": "I want to help others learn and grow in their careers",
        "teachingPhilosophy": "Learning by doing with real-world projects",
        "targetAudience": ["beginners", "intermediate"],
        "teachingStyle": "Interactive and hands-on",
        "teachingMethodology": "Project-based learning",
        "preferredFormats": ["video", "live-coding"],
        "preferredClassSize": "10-20",
        "weeklyAvailability": {
          "monday": {
            "available": true,
            "timeSlots": [{ "start": "09:00", "end": "17:00" }]
          },
          "tuesday": {
            "available": true,
            "timeSlots": [{ "start": "09:00", "end": "17:00" }]
          },
          "wednesday": {
            "available": true,
            "timeSlots": [{ "start": "09:00", "end": "17:00" }]
          },
          "thursday": {
            "available": true,
            "timeSlots": [{ "start": "09:00", "end": "17:00" }]
          },
          "friday": {
            "available": true,
            "timeSlots": [{ "start": "09:00", "end": "17:00" }]
          },
          "saturday": { "available": false, "timeSlots": [] },
          "sunday": { "available": false, "timeSlots": [] }
        }
      },
      "documents": {
        "resume": {
          "url": "https://example.com/resume.pdf",
          "verified": false
        },
        "identityDocument": {
          "url": "https://example.com/id.jpg",
          "verified": false
        },
        "educationCertificate": {
          "url": "https://example.com/certificate.pdf",
          "verified": false
        }
      }
    }
  }
}
```

#### Get Draft Applications

```graphql
query GetDraftApplications($userId: String!) {
  getDraftApplications(userId: $userId) {
    id
    status
    currentStep
    completionScore
    personalInfo
    professionalBackground
    teachingInformation
    documents
    consents
    lastSavedAt
  }
}
```

### 2. Document Upload

#### Add Document URL

```graphql
mutation AddDocumentUrl($input: AddDocumentUrlInput!) {
  addDocumentUrl(input: $input) {
    success
    message
    document {
      id
      documentType
      fileName
      fileUrl
      verificationStatus
      uploadedAt
    }
    errors
  }
}
```

**Input:**

```json
{
  "input": {
    "verificationId": "application_id",
    "documentType": "RESUME",
    "fileUrl": "https://example.com/resume.pdf",
    "fileName": "resume.pdf",
    "originalName": "John_Doe_Resume.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf",
    "metadata": {}
  }
}
```

### 3. Application Submission

#### Submit Application

```graphql
mutation SubmitInstructorVerification(
  $input: SubmitInstructorVerificationInput!
) {
  submitInstructorVerification(input: $input) {
    success
    message
    data {
      id
      status
      submittedAt
      completionScore
      currentStep
    }
    errors
  }
}
```

**Input:**

```json
{
  "input": {
    "id": "application_id",
    "consents": {
      "backgroundCheck": true,
      "dataProcessing": true,
      "termOfService": true,
      "privacyPolicy": true,
      "contentGuidelines": true,
      "codeOfConduct": true
    }
  }
}
```

### 4. Application Status Tracking

#### Get Application Status

```graphql
query GetVerificationStatus($userId: String!) {
  getVerificationStatus(userId: $userId) {
    success
    message
    data {
      id
      status
      submittedAt
      lastSavedAt
      currentStep
      completionScore
    }
    errors
  }
}
```

#### Get Application Details

```graphql
query GetInstructorVerification($userId: String!) {
  getInstructorVerification(userId: $userId) {
    success
    message
    data {
      id
      status
      personalInfo
      professionalBackground
      teachingInformation
      documents
      consents
      currentStep
      completionScore
      submittedAt
      lastSavedAt
      applicationDocuments {
        id
        documentType
        fileName
        fileUrl
        verificationStatus
        uploadedAt
      }
      aiVerification {
        id
        overallScore
        recommendation
        recommendationReason
        processedAt
      }
      manualReview {
        id
        overallScore
        decision
        decisionReason
        strengths
        weaknesses
        recommendations
        reviewedAt
      }
      interview {
        id
        scheduledAt
        format
        meetingLink
        passed
        feedback
        overallScore
      }
    }
    errors
  }
}
```

## 🔧 Admin Flow (Admin Dashboard)

### 1. View Submitted Applications

#### Get All Applications (Admin)

```graphql
query GetAllInstructorApplications($filters: ApplicationFiltersInput) {
  getAllInstructorApplications(filters: $filters) {
    id
    status
    fullName
    phoneNumber
    currentJobTitle
    yearsOfExperience
    subjectsToTeach
    teachingMotivation
    currentStep
    completionScore
    submittedAt
    lastSavedAt
    user {
      id
      email
      firstName
      lastName
      profileImage
    }
    applicationDocuments {
      id
      documentType
      fileName
      fileUrl
      verificationStatus
      uploadedAt
    }
    aiVerification {
      id
      overallScore
      recommendation
      processedAt
    }
    manualReview {
      id
      overallScore
      decision
      decisionReason
      reviewedAt
    }
  }
}
```

**Filters:**

```json
{
  "filters": {
    "status": "SUBMITTED",
    "search": "John Doe",
    "dateFrom": "2024-01-01",
    "dateTo": "2024-12-31",
    "minCompletionScore": 80
  }
}
```

#### Get Only Submitted Applications

```graphql
query GetSubmittedApplications($filters: ApplicationFiltersInput) {
  getSubmittedApplications(filters: $filters) {
    id
    status
    fullName
    phoneNumber
    currentJobTitle
    yearsOfExperience
    subjectsToTeach
    teachingMotivation
    currentStep
    completionScore
    submittedAt
    user {
      id
      email
      firstName
      lastName
      profileImage
    }
    applicationDocuments {
      id
      documentType
      fileName
      fileUrl
      verificationStatus
      uploadedAt
    }
  }
}
```

### 2. Start Application Review

#### Start Review

```graphql
mutation StartApplicationReview($input: StartReviewInput!) {
  startApplicationReview(input: $input) {
    success
    message
    data {
      id
      status
      lastSavedAt
    }
    errors
  }
}
```

**Input:**

```json
{
  "input": {
    "applicationId": "application_id"
  }
}
```

### 3. Review Documents

#### Review Individual Document

```graphql
mutation ReviewDocument($input: ReviewDocumentInput!) {
  reviewDocument(input: $input) {
    id
    documentType
    fileName
    fileUrl
    verificationStatus
    metadata
    uploadedAt
  }
}
```

**Input:**

```json
{
  "input": {
    "documentId": "document_id",
    "verificationStatus": "APPROVED",
    "notes": "Document looks good, relevant experience"
  }
}
```

### 4. Create Manual Review

#### Create Manual Review

```graphql
mutation CreateManualReview($input: CreateManualReviewInput!) {
  createManualReview(input: $input) {
    id
    applicationId
    reviewerId
    documentationScore
    experienceScore
    communicationScore
    technicalScore
    professionalismScore
    overallScore
    strengths
    weaknesses
    concerns
    recommendations
    decision
    decisionReason
    conditionalRequirements
    requiresInterview
    requiresAdditionalDocs
    requiredDocuments
    reviewedAt
  }
}
```

**Input:**

```json
{
  "input": {
    "applicationId": "application_id",
    "reviewerId": "admin_user_id",
    "documentationScore": 9,
    "experienceScore": 8,
    "communicationScore": 9,
    "technicalScore": 9,
    "professionalismScore": 9,
    "overallScore": 8.8,
    "strengths": "Strong technical background, good communication skills",
    "weaknesses": "Limited teaching experience in formal settings",
    "concerns": "None",
    "recommendations": "Approve with monitoring of first few courses",
    "decision": "APPROVE",
    "decisionReason": "Applicant meets all requirements and shows strong potential",
    "requiresInterview": false,
    "requiresAdditionalDocs": false
  }
}
```

### 5. Final Decision

#### Approve Application

```graphql
mutation ApproveApplication($input: ApproveApplicationInput!) {
  approveApplication(input: $input) {
    success
    message
    data {
      id
      status
      lastSavedAt
    }
    errors
  }
}
```

**Input:**

```json
{
  "input": {
    "applicationId": "application_id",
    "notes": "Excellent candidate, approved"
  }
}
```

#### Reject Application

```graphql
mutation RejectApplication($input: RejectApplicationInput!) {
  rejectApplication(input: $input) {
    success
    message
    data {
      id
      status
      lastSavedAt
    }
    errors
  }
}
```

**Input:**

```json
{
  "input": {
    "applicationId": "application_id",
    "reason": "Insufficient experience and documentation for instructor role",
    "requiresResubmission": false
  }
}
```

#### Request More Information

```graphql
mutation RequestMoreInformation($input: RequestMoreInfoInput!) {
  requestMoreInformation(input: $input) {
    success
    message
    data {
      id
      status
      lastSavedAt
    }
    errors
  }
}
```

**Input:**

```json
{
  "input": {
    "applicationId": "application_id",
    "requiredInfo": [
      "Additional teaching experience documentation",
      "Updated resume with recent experience",
      "Reference letters from previous teaching positions"
    ],
    "deadline": "2024-12-31"
  }
}
```

## 📊 Frontend Implementation Guide

### 1. Application Form Steps

#### Step 1: Personal Information

- Form fields for personal details
- Language proficiency selection
- Emergency contact information
- Auto-save functionality

#### Step 2: Professional Background

- Education history (add/remove entries)
- Work experience (add/remove entries)
- References (add/remove entries)
- Employment details

#### Step 3: Teaching Information

- Subjects to teach selection
- Teaching experience details
- Teaching philosophy and motivation
- Weekly availability schedule
- Target audience selection

#### Step 4: Documents & Submission

- Document upload interface
- Consent checkboxes
- Final review before submission
- Submit button (changes status to SUBMITTED)

### 2. Progress Tracking

#### Progress Bar

```javascript
const progressSteps = [
  { step: 1, title: 'Personal Information', status: 'completed' },
  { step: 2, title: 'Professional Background', status: 'current' },
  { step: 3, title: 'Teaching Information', status: 'pending' },
  { step: 4, title: 'Documents & Submit', status: 'pending' },
];
```

#### Completion Score

- Calculate based on filled sections
- Update in real-time as user fills forms
- Show percentage completion

### 3. Status-Based UI

#### Draft Status (DRAFT)

- Show "Save Draft" button
- Auto-save functionality
- Allow editing all sections
- Show completion progress

#### Submitted Status (SUBMITTED)

- Show "Application Submitted" message
- Disable editing
- Show estimated review time
- Display application ID

#### Under Review Status (UNDER_REVIEW)

- Show "Under Review" message
- Disable editing
- Show review progress if available

#### Approved Status (APPROVED)

- Show congratulations message
- Provide next steps for instructor setup
- Link to instructor dashboard

#### Rejected Status (REJECTED)

- Show rejection reason
- Provide feedback
- Option to reapply if allowed

#### More Info Required (REQUIRES_MORE_INFO)

- Show required information list
- Allow editing specific sections
- Show deadline if provided

### 4. Admin Dashboard Features

#### Application List View

- Filter by status
- Search by name/email
- Sort by submission date
- Bulk actions

#### Application Detail View

- Complete application data
- Document viewer
- Review form
- Decision buttons

#### Review Interface

- Document verification checkboxes
- Scoring system (1-10)
- Feedback text areas
- Decision buttons

## 🔔 Notification System

### User Notifications

- Application status changes
- Document verification updates
- Review completion
- Final decision

### Admin Notifications

- New application submissions
- Document verification requests
- Review assignments

## 🚀 Testing

### Test Scripts

1. `test-draft-submit-workflow.js` - Tests user flow
2. `test-admin-review-workflow.js` - Tests admin flow

### Manual Testing

1. Create application as user
2. Save drafts at each step
3. Submit application
4. Review as admin
5. Test all decision paths

## 📝 Error Handling

### Common Errors

- Validation errors for required fields
- File upload errors
- Permission errors for admin actions
- Network errors

### Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": ["Specific error details"]
}
```

## 🔒 Security Considerations

### Authentication

- All mutations require valid user token
- Admin mutations require admin role
- User can only access their own applications

### Authorization

- Admin role required for review functions
- Users can only edit their own applications
- Status-based access control

### Data Validation

- Input validation on all fields
- File type and size validation
- XSS protection on text inputs

## 📈 Performance Optimization

### Frontend

- Lazy loading for large forms
- Debounced auto-save
- Optimistic updates
- Caching of application data

### Backend

- Database indexing on status and dates
- Pagination for application lists
- Efficient queries with proper includes
- Background processing for notifications

This documentation provides a complete guide for implementing the instructor verification system in your frontend application. The system supports a comprehensive workflow from application creation to final approval, with proper status tracking and admin review capabilities.

