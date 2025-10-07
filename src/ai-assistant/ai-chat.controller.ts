import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Query,
  Param,
} from '@nestjs/common';
import { RestAuthGuard } from '../auth/rest-auth.guard';
import { AIChatService } from './ai-chat.service';
import {
  ChatMessageDto,
  ChatResponseDto,
  CourseRecommendationDto,
  LearningPathDto,
  StudyPlanDto,
  ChatHistoryDto,
  LearningInsightsDto,
} from './dto/ai-chat.dto';

@Controller('ai-chat')
@UseGuards(RestAuthGuard)
export class AIChatController {
  constructor(private readonly aiChatService: AIChatService) {}

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  async chatWithAI(
    @Body() dto: ChatMessageDto,
    @Request() req: any,
  ): Promise<ChatResponseDto> {
    return this.aiChatService.chatWithAI(dto, req.user);
  }

  @Post('recommendations')
  @HttpCode(HttpStatus.OK)
  async getCourseRecommendations(
    @Body() dto: CourseRecommendationDto,
    @Request() req: any,
  ): Promise<any[]> {
    return this.aiChatService.getCourseRecommendations(dto, req.user);
  }

  @Post('learning-path')
  @HttpCode(HttpStatus.OK)
  async createLearningPath(
    @Body() dto: LearningPathDto,
    @Request() req: any,
  ): Promise<any> {
    return this.aiChatService.createLearningPath(dto, req.user);
  }

  @Post('study-plan')
  @HttpCode(HttpStatus.OK)
  async createStudyPlan(
    @Body() dto: StudyPlanDto,
    @Request() req: any,
  ): Promise<any> {
    return this.aiChatService.createStudyPlan(dto, req.user);
  }

  @Get('history')
  async getChatHistory(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<ChatHistoryDto[]> {
    return this.aiChatService.getChatHistory(req.user.id, limit || 20);
  }

  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearChatHistory(@Request() req: any): Promise<void> {
    return this.aiChatService.clearChatHistory(req.user.id);
  }

  @Get('insights')
  async getLearningInsights(@Request() req: any): Promise<LearningInsightsDto> {
    return this.aiChatService.getLearningInsights(req.user.id);
  }

  @Get('help')
  async getHelpTopics(): Promise<any> {
    return {
      topics: [
        {
          category: 'Course Selection',
          questions: [
            'What courses should I take?',
            'How do I choose the right course for my level?',
            'What are the best courses for beginners?',
            'Can you recommend courses based on my interests?',
          ],
        },
        {
          category: 'Learning Guidance',
          questions: [
            'How can I improve my study habits?',
            'What learning strategies work best?',
            'How do I stay motivated while learning?',
            'How can I track my learning progress?',
          ],
        },
        {
          category: 'Platform Features',
          questions: [
            'How do I navigate the platform?',
            'What features are available for students?',
            'How do I access my courses?',
            'How do I track my progress?',
          ],
        },
        {
          category: 'Career Development',
          questions: [
            'What skills should I learn for my career?',
            'How do I create a learning path?',
            'What courses will help me get a job?',
            'How do I build a portfolio?',
          ],
        },
        {
          category: 'Technical Support',
          questions: [
            'How do I troubleshoot video playback issues?',
            "Why can't I access my course materials?",
            'How do I update my profile?',
            'How do I change my password?',
          ],
        },
      ],
      examples: [
        'I want to learn web development. What courses do you recommend?',
        "I'm a beginner in programming. Where should I start?",
        'How can I create a study schedule for my courses?',
        'What are the best practices for online learning?',
        "I'm struggling with motivation. Can you help?",
        'How do I track my learning progress?',
        'What skills should I learn to become a data scientist?',
        'Can you help me create a learning path for machine learning?',
      ],
    };
  }
}
