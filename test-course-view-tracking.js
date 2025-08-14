// Test file for course view tracking functionality
// This demonstrates how to track course views using the new GraphQL mutation

const API_BASE_URL = 'http://localhost:3000/graphql';

// Example GraphQL mutation for tracking course views
const TRACK_COURSE_VIEW_MUTATION = `
  mutation TrackCourseView($courseId: String!) {
    trackCourseView(courseId: $courseId) {
      success
      message
      errors
    }
  }
`;

// Example usage scenarios
const testScenarios = {
  // Scenario 1: Track course view for enrolled student
  trackCourseView: async (courseId, token) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: TRACK_COURSE_VIEW_MUTATION,
          variables: { courseId },
        }),
      });

      const data = await response.json();
      console.log('Course view tracking result:', data);
      return data;
    } catch (error) {
      console.error('Error tracking course view:', error);
      throw error;
    }
  },

  // Scenario 2: Track course view for non-enrolled user (will be skipped)
  trackCourseViewNonEnrolled: async (courseId, token) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: TRACK_COURSE_VIEW_MUTATION,
          variables: { courseId },
        }),
      });

      const data = await response.json();
      console.log('Course view tracking result (non-enrolled):', data);
      return data;
    } catch (error) {
      console.error('Error tracking course view:', error);
      throw error;
    }
  },

  // Scenario 3: Track course view for non-existent course
  trackCourseViewInvalidCourse: async (courseId, token) => {
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          query: TRACK_COURSE_VIEW_MUTATION,
          variables: { courseId },
        }),
      });

      const data = await response.json();
      console.log('Course view tracking result (invalid course):', data);
      return data;
    } catch (error) {
      console.error('Error tracking course view:', error);
      throw error;
    }
  },
};

// React Hook example for tracking course views
const useCourseViewTracking = () => {
  const [trackView] = useMutation(TRACK_COURSE_VIEW_MUTATION, {
    onError: (error) => {
      console.error("Failed to track course view:", error);
    },
  });

  const trackCourseView = async (courseId) => {
    try {
      const result = await trackView({
        variables: { courseId },
      });
      
      if (result.data?.trackCourseView?.success) {
        console.log('Course view tracked successfully:', result.data.trackCourseView.message);
      } else {
        console.warn('Course view tracking failed:', result.data?.trackCourseView?.message);
      }
      
      return result.data?.trackCourseView;
    } catch (error) {
      console.error('Error tracking course view:', error);
      throw error;
    }
  };

  return { trackCourseView };
};

// Usage examples
console.log('=== Course View Tracking Examples ===');

// Example 1: Track course view when student visits course page
console.log('1. Student visits course page - tracking view...');
// testScenarios.trackCourseView('course_123', 'user_token_here');

// Example 2: Non-enrolled user visits course (tracking will be skipped)
console.log('2. Non-enrolled user visits course - tracking will be skipped...');
// testScenarios.trackCourseViewNonEnrolled('course_123', 'user_token_here');

// Example 3: Invalid course ID
console.log('3. Invalid course ID - should return error...');
// testScenarios.trackCourseViewInvalidCourse('invalid_course_id', 'user_token_here');

console.log('\n=== React Hook Usage ===');
console.log('const { trackCourseView } = useCourseViewTracking();');
console.log('await trackCourseView("course_123");');

console.log('\n=== Expected Responses ===');
console.log('Success response:');
console.log(JSON.stringify({
  data: {
    trackCourseView: {
      success: true,
      message: "Course view tracked successfully",
      errors: []
    }
  }
}, null, 2));

console.log('\nSkipped response (non-enrolled):');
console.log(JSON.stringify({
  data: {
    trackCourseView: {
      success: true,
      message: "Course view tracking skipped - user not enrolled",
      errors: []
    }
  }
}, null, 2));

console.log('\nError response:');
console.log(JSON.stringify({
  data: {
    trackCourseView: {
      success: false,
      message: "Course not found",
      errors: ["Course not found"]
    }
  }
}, null, 2));

module.exports = {
  testScenarios,
  useCourseViewTracking,
  TRACK_COURSE_VIEW_MUTATION,
};

