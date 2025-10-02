import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { AIAssistantService } from './ai-assistant.service';
  import { AuthGuard } from '../auth/auth.guard';
  import {
    GenerateSuggestionsDto,
    AnalyzeCourseDto,
    ChatDto,
    GenerateContentDto,
  } from './dto';
  import { Throttle } from '@nestjs/throttler';
  
  @Controller('ai-assistant')
  @UseGuards(AuthGuard)
  export class AIAssistantController {
    constructor(private readonly aiAssistantService: AIAssistantService) {}
  
    @Post('suggestions')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 60 } }) // 10 requests per minute
    async generateSuggestions(
      @Body() dto: GenerateSuggestionsDto,
      @Req() req: any,
    ) {
      return this.aiAssistantService.generateSuggestions(dto, req.user.id);
    }
  
    @Post('analyze')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 5, ttl: 60 } }) // 5 requests per minute
    async analyzeCourse(@Body() dto: AnalyzeCourseDto, @Req() req: any) {
      return this.aiAssistantService.analyzeCourse(dto, req.user.id);
    }
  
    @Post('chat')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 20, ttl: 60 } }) // 20 requests per minute
    async chat(@Body() dto: ChatDto, @Req() req: any) {
      const response = await this.aiAssistantService.chatWithAI(dto, req.user.id);
      return { response };
    }
  
    @Post('generate')
    @HttpCode(HttpStatus.OK)
    @Throttle({ default: { limit: 10, ttl: 60 } }) // 10 requests per minute
    async generateContent(@Body() dto: GenerateContentDto, @Req() req: any) {
      return this.aiAssistantService.generateContent(dto, req.user.id);
    }
  }