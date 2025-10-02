import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import {
  GenerateSuggestionsDto,
  AnalyzeCourseDto,
  ChatDto,
  GenerateContentDto,
  SuggestionType,
  ContentType,
} from './dto';
import { CourseSuggestion, CourseAnalysis } from './types/ai-assistant.types';
import * as crypto from 'crypto';

@Injectable()
export class AIAssistantService {
  private readonly logger = new Logger(AIAssistantService.name);
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
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
    ttl: number = 3600,
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
    useCache: boolean = true,
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
        'AI service temporarily unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async saveInteraction(
    userId: string,
    courseId: string | null,
    type: string,
    request: any,
    response: any,
  ): Promise<void> {
    try {
      await this.prisma.aIInteraction.create({
        data: {
          userId,
          courseId,
          type,
          request,
          response,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save AI interaction:', error);
    }
  }

  async generateSuggestions(
    dto: GenerateSuggestionsDto,
    userId: string,
  ): Promise<CourseSuggestion[]> {
    const { type, context } = dto;
    const { courseData, currentStep } = context;

    const prompt = this.buildSuggestionsPrompt(type, courseData, currentStep);
    const response = await this.callGemini(prompt);

    const suggestions = this.parseSuggestions(response, type);

    await this.saveInteraction(
      userId,
      courseData.id || null,
      'suggestion',
      dto,
      suggestions,
    );

    return suggestions;
  }

  private buildSuggestionsPrompt(
    type: SuggestionType,
    courseData: any,
    currentStep?: number,
  ): string {
    const baseContext = `
Course Information:
- Title: ${courseData.title || 'Not set'}
- Description: ${courseData.description || 'Not set'}
- Category: ${courseData.category || 'Not set'}
- Level: ${courseData.level || 'Not set'}
- Price: ${courseData.price !== undefined ? courseData.price : 'Not set'}
- Sections: ${courseData.sections?.length || 0}
- Total Lectures: ${this.countLectures(courseData.sections)}
- Current Step: ${currentStep !== undefined ? currentStep + 1 : 'Unknown'}/4

Analyze this course and provide 3-5 actionable suggestions to improve it.
`;

    const typeSpecificPrompts = {
      [SuggestionType.GENERAL]: 'Focus on overall course quality and completeness.',
      [SuggestionType.TITLE]: 'Focus specifically on improving the course title to be more compelling and SEO-friendly.',
      [SuggestionType.DESCRIPTION]: 'Focus on enhancing the course description to be more engaging and informative.',
      [SuggestionType.STRUCTURE]: 'Focus on improving the course structure, sections, and lecture organization.',
      [SuggestionType.SEO]: 'Focus on SEO optimization including keywords, tags, and discoverability.',
      [SuggestionType.PRICING]: 'Focus on pricing strategy based on course content and market positioning.',
      [SuggestionType.CONTENT]: 'Focus on content quality and completeness.',
    };

    return `${baseContext}

${typeSpecificPrompts[type] || typeSpecificPrompts[SuggestionType.GENERAL]}

Return your response as a JSON array with this exact structure:
[
  {
    "type": "${type}",
    "title": "Brief suggestion title",
    "content": "Detailed suggestion content",
    "reasoning": "Why this suggestion helps",
    "confidence": 0.85,
    "actionable": true,
    "metadata": {}
  }
]

Ensure confidence is between 0 and 1. Make suggestions practical and specific.`;
  }

  private parseSuggestions(
    response: string,
    type: SuggestionType,
  ): CourseSuggestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.map((s: any, index: number) => ({
        id: `${type}-${Date.now()}-${index}`,
        type: s.type || type,
        title: s.title || 'Suggestion',
        content: s.content || '',
        reasoning: s.reasoning || '',
        confidence: Math.min(Math.max(s.confidence || 0.7, 0), 1),
        actionable: s.actionable !== false,
        metadata: s.metadata || {},
      }));
    } catch (error) {
      this.logger.error('Failed to parse suggestions:', error);
      // Return fallback suggestion
      return [
        {
          id: `${type}-${Date.now()}-fallback`,
          type,
          title: 'Continue developing your course',
          content: 'Add more details to your course information.',
          reasoning: 'Complete course information helps students make informed decisions.',
          confidence: 0.8,
          actionable: true,
          metadata: {},
        },
      ];
    }
  }

  async analyzeCourse(
    dto: AnalyzeCourseDto,
    userId: string,
  ): Promise<CourseAnalysis> {
    const { courseData, contentByLecture } = dto;

    const prompt = `
Analyze this course comprehensively and provide scores and insights:

Course Data:
${JSON.stringify(courseData, null, 2)}

Content by Lecture:
${JSON.stringify(contentByLecture, null, 2)}

Provide a detailed analysis in the following JSON format:
{
  "completeness": {
    "score": 85,
    "missingElements": ["element1", "element2"],
    "recommendations": ["rec1", "rec2"]
  },
  "quality": {
    "score": 75,
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"]
  },
  "marketability": {
    "score": 80,
    "competitiveness": "Medium competition, good niche opportunity",
    "targetAudience": ["audience1", "audience2"],
    "pricingRecommendation": "$49-79"
  },
  "seo": {
    "score": 70,
    "keywords": ["keyword1", "keyword2"],
    "optimizations": ["optimization1", "optimization2"]
  }
}

All scores should be 0-100. Be specific and actionable.`;

    const response = await this.callGemini(prompt);
    const analysis = this.parseAnalysis(response);

    await this.saveInteraction(
      userId,
      courseData.id || null,
      'analysis',
      dto,
      analysis,
    );

    return analysis;
  }

  private parseAnalysis(response: string): CourseAnalysis {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      this.logger.error('Failed to parse analysis:', error);
      // Return default analysis
      return {
        completeness: {
          score: 50,
          missingElements: ['Complete all course sections'],
          recommendations: ['Add more course details'],
        },
        quality: {
          score: 50,
          strengths: ['Course structure is started'],
          improvements: ['Add more comprehensive content'],
        },
        marketability: {
          score: 50,
          competitiveness: 'Unable to analyze at this time',
          targetAudience: ['General learners'],
          pricingRecommendation: '$29-49',
        },
        seo: {
          score: 50,
          keywords: ['online course'],
          optimizations: ['Add relevant keywords'],
        },
      };
    }
  }

  async chatWithAI(dto: ChatDto, userId: string): Promise<string> {
    const { message, context } = dto;
    const { courseData, chatHistory } = context;

    const conversationContext = chatHistory
      ?.map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n') || '';

    const prompt = `
You are an expert course creation assistant helping instructors build better online courses.

Current Course Context:
- Title: ${courseData.title || 'Not set'}
- Description: ${courseData.description || 'Not set'}
- Category: ${courseData.category || 'Not set'}
- Sections: ${courseData.sections?.length || 0}

Previous Conversation:
${conversationContext}

User Question: ${message}

Provide helpful, specific, and actionable advice. Be concise but thorough.`;

    const response = await this.callGemini(prompt, false);

    await this.saveInteraction(
      userId,
      courseData.id || null,
      'chat',
      { message, context },
      { response },
    );

    return response;
  }

  async generateContent(
    dto: GenerateContentDto,
    userId: string,
  ): Promise<any> {
    const { type, context } = dto;
    const { courseData } = context;

    const prompt = this.buildContentGenerationPrompt(type, courseData);
    const response = await this.callGemini(prompt);

    await this.saveInteraction(
      userId,
      courseData.id || null,
      'generation',
      dto,
      { type, response },
    );

    return { type, content: response };
  }

  private buildContentGenerationPrompt(
    type: ContentType,
    courseData: any,
  ): string {
    const baseContext = `
Course: ${courseData.title || 'Untitled Course'}
Description: ${courseData.description || 'No description'}
Category: ${courseData.category || 'General'}
Level: ${courseData.level || 'beginner'}
`;

    const prompts = {
      [ContentType.LECTURE_OUTLINE]: `${baseContext}
Generate detailed lecture outlines for each section. Include:
- Learning objectives per lecture
- Key topics to cover
- Estimated duration
- Teaching methods
Format as structured markdown.`,

      [ContentType.ASSESSMENT_QUESTIONS]: `${baseContext}
Create 10-15 assessment questions:
- Mix of multiple choice, true/false, and short answer
- Progressive difficulty
- Clear correct answers
- Explanations for each answer
Format as JSON array.`,

      [ContentType.SEO_CONTENT]: `${baseContext}
Optimize for SEO:
- 5-10 relevant keywords
- Meta description (150-160 chars)
- Optimized title variations
- Tags for better discoverability
Format as JSON object.`,

      [ContentType.MARKETING_COPY]: `${baseContext}
Create marketing materials:
- Compelling course tagline
- 3 key benefits
- Social media post (280 chars)
- Email subject lines (3 variations)
Format as JSON object.`,

      [ContentType.TITLE_SUGGESTIONS]: `${baseContext}
Generate 5 alternative course titles that are:
- Clear and compelling
- SEO-friendly
- Accurately represent content
- Appealing to target audience
Format as JSON array of strings.`,

      [ContentType.DESCRIPTION_IMPROVEMENT]: `${baseContext}
Improve the course description:
- Make it more engaging
- Highlight benefits
- Include clear structure
- Add call-to-action
Provide 2-3 variations. Format as JSON array.`,

      [ContentType.LEARNING_OBJECTIVES]: `${baseContext}
Create 5-8 clear learning objectives:
- Use action verbs (apply, analyze, create)
- Be specific and measurable
- Align with course content
- Progressive difficulty
Format as JSON array of strings.`,

      [ContentType.TARGET_AUDIENCE]: `${baseContext}
Define target audience:
- Demographics
- Prior knowledge level
- Career goals
- Learning motivations
- Pain points this course solves
Format as structured JSON object.`,
    };

    return prompts[type] || prompts[ContentType.TITLE_SUGGESTIONS];
  }

  private countLectures(sections: any[]): number {
    if (!sections) return 0;
    return sections.reduce(
      (total, section) => total + (section.lectures?.length || 0),
      0,
    );
  }

  async clearOldCache(): Promise<void> {
    await this.prisma.aICacheEntry.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    this.logger.log('Cleared expired AI cache entries');
  }
}