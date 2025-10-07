import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import {
  ChatMessageDto,
  ChatResponseDto,
  CourseRecommendationDto,
  LearningPathDto,
  StudyPlanDto,
  ChatHistoryDto,
} from './dto/ai-chat.dto';
import * as crypto from 'crypto';

@Injectable()
export class AIChatService {
  private readonly logger = new Logger(AIChatService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
    });
  }

  private generateCacheKey(data: any): string {
    return crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  }

  private async getCachedResponse(cacheKey: string): Promise<any | null> {
    const cached = await this.prisma.aICacheEntry.findUnique({
      where: { cacheKey },
    });

    if (cached && cached.expiresAt > new Date()) {
      return cached.response;
    }

    if (cached) {
      await this.prisma.aICacheEntry.delete({ where: { cacheKey } });
    }

    return null;
  }

  private async setCachedResponse(
    cacheKey: string,
    response: any,
    ttl: number = 1800, // 30 minutes for chat
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + ttl * 1000);
    await this.prisma.aICacheEntry.upsert({
      where: { cacheKey },
      create: { cacheKey, response, expiresAt },
      update: { response, expiresAt },
    });
  }

  private async callGemini(
    prompt: string,
    useCache: boolean = false, // Don't cache chat responses
  ): Promise<string> {
    const cacheKey = this.generateCacheKey(prompt);

    if (useCache) {
      const cached = await this.getCachedResponse(cacheKey);
      if (cached) {
        this.logger.log('Returning cached AI response');
        return cached;
      }
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      if (useCache) {
        await this.setCachedResponse(cacheKey, response);
      }

      return response;
    } catch (error) {
      this.logger.error('Gemini API error:', error);
      throw new HttpException(
        'AI assistant is temporarily unavailable. Please try again later.',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async saveInteraction(
    userId: string,
    type: string,
    request: any,
    response: any,
  ): Promise<void> {
    try {
      await this.prisma.aIInteraction.create({
        data: {
          userId,
          courseId: null, // General AI chat doesn't need courseId
          type,
          request,
          response,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save AI interaction:', error);
    }
  }

  async chatWithAI(dto: ChatMessageDto, user: User): Promise<ChatResponseDto> {
    const { message, context } = dto;

    // Get user's learning profile and preferences
    const userProfile = await this.getUserProfile(user);
    const recentCourses = await this.getUserRecentCourses(user.id);
    const learningGoals = await this.getUserLearningGoals(user.id);

    const prompt = this.buildChatPrompt(
      message,
      user,
      userProfile,
      recentCourses,
      learningGoals,
      context,
    );

    const response = await this.callGemini(prompt, false);

    // Save the interaction
    await this.saveInteraction(
      user.id,
      'general_chat',
      { message, context },
      { response },
    );

    return {
      message: response,
      suggestions: this.extractSuggestions(response),
      relatedCourses: await this.getRelatedCourses(user.id, message),
      timestamp: new Date(),
    };
  }

  private buildChatPrompt(
    message: string,
    user: User,
    userProfile: any,
    recentCourses: any[],
    learningGoals: any,
    context: any,
  ): string {
    const userRole = user.role;
    const userType = this.getUserTypeDescription(userRole);

    const learningContext = `
User Profile:
- Role: ${userType}
- Name: ${user.firstName || 'User'} ${user.lastName || ''}
- Learning Style: ${userProfile?.learningStyle || 'Not specified'}
- Skill Level: ${userProfile?.skillLevel || 'Not specified'}
- Interests: ${userProfile?.interests?.join(', ') || 'Not specified'}
- Learning Goals: ${learningGoals || 'Not specified'}

Recent Learning Activity:
${recentCourses.map((course) => `- ${course.title} (${course.progress}% complete)`).join('\n') || 'No recent courses'}

Current Context: ${context?.currentPage || 'General platform usage'}
`;

    return `You are an intelligent AI assistant for an e-learning platform. You help users with:

1. Course recommendations and selection
2. Learning path guidance
3. Study strategies and techniques
4. Platform navigation and features
5. Educational content explanations
6. Career guidance and skill development
7. Learning motivation and goal setting

${learningContext}

User Message: "${message}"

Guidelines:
- Be helpful, encouraging, and supportive
- Provide specific, actionable advice
- Suggest relevant courses when appropriate
- Consider the user's learning level and goals
- Be conversational but professional
- If you recommend courses, mention why they're suitable
- Ask follow-up questions to better understand their needs
- Provide study tips and learning strategies
- Be encouraging about their learning journey

Respond in a friendly, helpful tone. Keep responses concise but informative.`;
  }

  private getUserTypeDescription(role: string): string {
    const descriptions = {
      STUDENT: 'Student looking to learn and grow',
      INSTRUCTOR: 'Instructor creating and teaching courses',
      ADMIN: 'Platform administrator',
      VISITOR: 'New user exploring the platform',
    };
    return descriptions[role] || 'Platform user';
  }

  private async getUserProfile(user: User): Promise<any> {
    try {
      if (user.role === 'STUDENT') {
        return await this.prisma.studentProfile.findUnique({
          where: { userId: user.id },
        });
      } else if (user.role === 'INSTRUCTOR') {
        return await this.prisma.instructorProfile.findUnique({
          where: { userId: user.id },
        });
      }
      return null;
    } catch (error) {
      this.logger.error('Failed to get user profile:', error);
      return null;
    }
  }

  private async getUserRecentCourses(userId: string): Promise<any[]> {
    try {
      return await this.prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            select: {
              id: true,
              title: true,
              category: true,
              level: true,
            },
          },
        },
        orderBy: { enrolledAt: 'desc' },
        take: 5,
      });
    } catch (error) {
      this.logger.error('Failed to get recent courses:', error);
      return [];
    }
  }

  private async getUserLearningGoals(userId: string): Promise<string> {
    try {
      const profile = await this.prisma.studentProfile.findUnique({
        where: { userId },
        select: { learningGoals: true },
      });
      return profile?.learningGoals?.join(', ') || 'Not specified';
    } catch (error) {
      this.logger.error('Failed to get learning goals:', error);
      return 'Not specified';
    }
  }

  private extractSuggestions(response: string): string[] {
    // Extract actionable suggestions from the AI response
    const suggestions: string[] = [];

    // Look for numbered lists or bullet points
    const lines = response.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (
        (trimmed.match(/^\d+\./) ||
          trimmed.startsWith('-') ||
          trimmed.startsWith('•')) &&
        trimmed.length > 10
      ) {
        suggestions.push(
          trimmed.replace(/^\d+\.\s*/, '').replace(/^[-•]\s*/, ''),
        );
      }
    }

    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private async getRelatedCourses(
    userId: string,
    message: string,
  ): Promise<any[]> {
    try {
      // Extract keywords from the message
      const keywords = this.extractKeywords(message);

      if (keywords.length === 0) return [];

      // Search for courses matching the keywords
      const courses = await this.prisma.course.findMany({
        where: {
          AND: [
            { isPublic: true },
            { status: 'PUBLISHED' },
            {
              OR: keywords.flatMap((keyword) => [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
                { category: { contains: keyword, mode: 'insensitive' } },
              ]),
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          level: true,
          price: true,
          avgRating: true,
          thumbnail: true,
        },
        take: 3,
      });

      return courses;
    } catch (error) {
      this.logger.error('Failed to get related courses:', error);
      return [];
    }
  }

  private extractKeywords(message: string): string[] {
    // Simple keyword extraction - in a real implementation, you might use NLP
    const commonWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'can',
      'must',
      'i',
      'you',
      'he',
      'she',
      'it',
      'we',
      'they',
      'me',
      'him',
      'her',
      'us',
      'them',
    ];

    return message
      .toLowerCase()
      .split(/\W+/)
      .filter((word) => word.length > 3 && !commonWords.includes(word))
      .slice(0, 5);
  }

  async getCourseRecommendations(
    dto: CourseRecommendationDto,
    user: User,
  ): Promise<any[]> {
    const { interests, skillLevel, timeCommitment, budget } = dto;

    const prompt = `
Based on the user's preferences, recommend courses:

User Preferences:
- Interests: ${interests.join(', ')}
- Skill Level: ${skillLevel}
- Time Commitment: ${timeCommitment} hours per week
- Budget: $${budget}

Provide 5-8 course recommendations with:
- Course title and brief description
- Why it's suitable for this user
- Estimated time to complete
- Skill level match
- Price range

Format as JSON array with course recommendations.
`;

    const response = await this.callGemini(prompt, true);
    const recommendations = this.parseRecommendations(response);

    // Get actual courses from database
    const courses = await this.getCoursesByRecommendations(recommendations);

    await this.saveInteraction(user.id, 'course_recommendations', dto, {
      recommendations: courses,
    });

    return courses;
  }

  private parseRecommendations(response: string): any[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to parse recommendations:', error);
      return [];
    }
  }

  private async getCoursesByRecommendations(
    recommendations: any[],
  ): Promise<any[]> {
    try {
      const courseTitles = recommendations.map((r) => r.title);

      return await this.prisma.course.findMany({
        where: {
          title: { in: courseTitles },
          isPublic: true,
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          level: true,
          price: true,
          avgRating: true,
          thumbnail: true,
          estimatedHours: true,
        },
        take: 8,
      });
    } catch (error) {
      this.logger.error('Failed to get courses by recommendations:', error);
      return [];
    }
  }

  async createLearningPath(dto: LearningPathDto, user: User): Promise<any> {
    const { goal, currentSkills, timeFrame, interests } = dto;

    const prompt = `
Create a personalized learning path for the user:

Goal: ${goal}
Current Skills: ${currentSkills.join(', ')}
Time Frame: ${timeFrame}
Interests: ${interests.join(', ')}

Create a structured learning path with:
1. Learning objectives
2. Recommended courses in order
3. Skills to develop at each stage
4. Estimated timeline
5. Milestones and checkpoints
6. Practice projects or assignments

Format as a comprehensive JSON learning path.
`;

    const response = await this.callGemini(prompt, true);
    const learningPath = this.parseLearningPath(response);

    await this.saveInteraction(user.id, 'learning_path_creation', dto, {
      learningPath,
    });

    return learningPath;
  }

  private parseLearningPath(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to parse learning path:', error);
      return {};
    }
  }

  async createStudyPlan(dto: StudyPlanDto, user: User): Promise<any> {
    const { courseId, studyHours, studyDays, deadline } = dto;

    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lectures: true,
          },
        },
      },
    });

    if (!course) {
      throw new HttpException('Course not found', HttpStatus.NOT_FOUND);
    }

    const prompt = `
Create a personalized study plan for this course:

Course: ${course.title}
Description: ${course.description}
Sections: ${course.sections.length}
Total Lectures: ${course.sections.reduce((total, section) => total + section.lectures.length, 0)}

User Preferences:
- Study Hours per Week: ${studyHours}
- Study Days: ${studyDays.join(', ')}
- Target Completion: ${deadline}

Create a detailed study plan with:
1. Weekly schedule
2. Daily study goals
3. Section-by-section breakdown
4. Review and practice sessions
5. Milestone checkpoints
6. Tips for effective studying

Format as a comprehensive JSON study plan.
`;

    const response = await this.callGemini(prompt, true);
    const studyPlan = this.parseStudyPlan(response);

    await this.saveInteraction(user.id, 'study_plan_creation', dto, {
      studyPlan,
    });

    return studyPlan;
  }

  private parseStudyPlan(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to parse study plan:', error);
      return {};
    }
  }

  async getChatHistory(
    userId: string,
    limit: number = 20,
  ): Promise<ChatHistoryDto[]> {
    try {
      const interactions = await this.prisma.aIInteraction.findMany({
        where: {
          userId,
          type: 'general_chat',
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          request: true,
          response: true,
          createdAt: true,
        },
      });

      return interactions.map((interaction) => ({
        id: interaction.id,
        message: (interaction.request as any)?.message || 'Unknown message',
        response: (interaction.response as any)?.response || 'No response',
        timestamp: interaction.createdAt,
      }));
    } catch (error) {
      this.logger.error('Failed to get chat history:', error);
      return [];
    }
  }

  async clearChatHistory(userId: string): Promise<void> {
    try {
      await this.prisma.aIInteraction.deleteMany({
        where: {
          userId,
          type: 'general_chat',
        },
      });
    } catch (error) {
      this.logger.error('Failed to clear chat history:', error);
      throw new HttpException(
        'Failed to clear chat history',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLearningInsights(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          studentProfile: true,
          enrollments: {
            include: {
              course: true,
            },
          },
          progress: true,
        },
      });

      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const prompt = `
Analyze this user's learning data and provide insights:

User Profile:
- Learning Style: ${user.studentProfile?.learningStyle || 'Not specified'}
- Skill Level: ${user.studentProfile?.skillLevel || 'Not specified'}
- Interests: ${user.studentProfile?.interests?.join(', ') || 'Not specified'}
- Learning Goals: ${user.studentProfile?.learningGoals?.join(', ') || 'Not specified'}

Learning Activity:
- Total Courses Enrolled: ${user.enrollments.length}
- Completed Courses: ${user.enrollments.filter((e) => e.status === 'COMPLETED').length}
- Average Progress: ${user.progress.length > 0 ? user.progress.reduce((sum, p) => sum + p.progress, 0) / user.progress.length : 0}%
- Total Time Spent: ${user.totalTimeSpent} minutes

Recent Course Activity:
${user.enrollments
  .slice(0, 5)
  .map(
    (enrollment) =>
      `- ${enrollment.course.title}: ${enrollment.progress}% complete`,
  )
  .join('\n')}

Provide personalized insights including:
1. Learning strengths and areas for improvement
2. Recommended next steps
3. Study habit suggestions
4. Course recommendations based on progress
5. Motivation and goal-setting advice

Format as a comprehensive JSON insights report.
`;

      const response = await this.callGemini(prompt, true);
      const insights = this.parseInsights(response);

      await this.saveInteraction(
        userId,
        'learning_insights',
        { userId },
        { insights },
      );

      return insights;
    } catch (error) {
      this.logger.error('Failed to get learning insights:', error);
      throw new HttpException(
        'Failed to generate learning insights',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private parseInsights(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return {};

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to parse insights:', error);
      return {};
    }
  }
}
