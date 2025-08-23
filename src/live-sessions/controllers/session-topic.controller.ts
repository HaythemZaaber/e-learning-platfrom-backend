import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    HttpStatus,
    HttpCode,
  } from '@nestjs/common';
  import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
  import { SessionTopicService } from '../services/session-topic.service';
  import { 
    CreateSessionTopicDto, 
    UpdateSessionTopicDto,
    GetSessionTopicsFilterDto
  } from '../dto/session-topic.dto';
  import { TopicDifficulty } from '../dto/common.dto';
  import { RestAuthGuard } from '../../auth/rest-auth.guard';
import { GetUser } from '../../auth/get-user.decorator';
  
  @ApiTags('Session Topics')
  @ApiBearerAuth()
  @UseGuards(RestAuthGuard)
  @Controller('session-topics')
  export class SessionTopicController {
    constructor(private readonly sessionTopicService: SessionTopicService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get session topics with filters' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session topics retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: true, description: 'Instructor ID' })
    @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
    @ApiQuery({ name: 'difficulty', required: false, enum: TopicDifficulty, description: 'Filter by difficulty' })
    @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', type: Boolean })
    @ApiQuery({ name: 'isApproved', required: false, description: 'Filter by approved status', type: Boolean })
    async getSessionTopics(
      @Query('instructorId') instructorId: string,
      @Query('category') category?: string,
      @Query('difficulty') difficulty?: TopicDifficulty,
      @Query('isActive') isActive?: boolean,
      @Query('isApproved') isApproved?: boolean,
    ) {
      const filter: GetSessionTopicsFilterDto = {
        instructorId,
        category,
        difficulty,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        isApproved: isApproved !== undefined ? Boolean(isApproved) : undefined,
      };
  
      return this.sessionTopicService.getSessionTopics(filter);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get session topic by ID' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session topic retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session topic not found' 
    })
    async getSessionTopic(@Param('id') id: string) {
      return this.sessionTopicService.getSessionTopic(id);
    }
  
    @Post()
    @ApiOperation({ summary: 'Create session topic' })
    @ApiResponse({ 
      status: 201, 
      description: 'Session topic created successfully' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Bad request - validation errors or duplicate name' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    async createSessionTopic(@Body() createSessionTopicDto: CreateSessionTopicDto) {
      return this.sessionTopicService.createSessionTopic(createSessionTopicDto);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update session topic' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session topic updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session topic not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Validation errors or duplicate name' 
    })
    async updateSessionTopic(
      @Param('id') id: string,
      @Body() updateSessionTopicDto: UpdateSessionTopicDto
    ) {
      return this.sessionTopicService.updateSessionTopic(id, updateSessionTopicDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete session topic' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session topic deleted successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session topic not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Cannot delete topic with active sessions or offerings' 
    })
    @HttpCode(HttpStatus.OK)
    async deleteSessionTopic(@Param('id') id: string) {
      return this.sessionTopicService.deleteSessionTopic(id);
    }
  
    @Patch(':id/toggle-active')
    @ApiOperation({ summary: 'Toggle topic active status' })
    @ApiResponse({ 
      status: 200, 
      description: 'Topic status toggled successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session topic not found' 
    })
    async toggleTopicActive(@Param('id') id: string) {
      return this.sessionTopicService.toggleTopicActive(id);
    }
  
    @Patch(':id/approve')
    @ApiOperation({ summary: 'Approve session topic' })
    @ApiResponse({ 
      status: 200, 
      description: 'Topic approved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session topic not found' 
    })
    async approveTopic(
      @Param('id') id: string,
      @GetUser() currentUser: any
    ) {
      return this.sessionTopicService.approveTopic(id, currentUser.id);
    }
  
    @Get(':id/statistics')
    @ApiOperation({ summary: 'Get topic statistics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Topic statistics retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session topic not found' 
    })
    async getTopicStatistics(@Param('id') id: string) {
      return this.sessionTopicService.getTopicStatistics(id);
    }
  
    @Get('search/topics')
    @ApiOperation({ summary: 'Search session topics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Search results retrieved successfully' 
    })
    @ApiQuery({ name: 'search', required: false, description: 'Search term' })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
    @ApiQuery({ name: 'difficulty', required: false, description: 'Filter by difficulty' })
    @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', type: Boolean })
    @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating', type: Number })
    @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
    async searchTopics(
      @Query('search') search?: string,
      @Query('instructorId') instructorId?: string,
      @Query('category') category?: string,
      @Query('difficulty') difficulty?: string,
      @Query('isActive') isActive?: boolean,
      @Query('minRating') minRating?: number,
      @Query('page') page?: number,
      @Query('limit') limit?: number,
    ) {
      return this.sessionTopicService.searchTopics({
        search,
        instructorId,
        category,
        difficulty,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    }
  
    @Get('popular/topics')
    @ApiOperation({ summary: 'Get popular session topics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Popular topics retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of topics to return', type: Number })
    async getPopularTopics(
      @Query('instructorId') instructorId?: string,
      @Query('limit') limit?: number
    ) {
      return this.sessionTopicService.getPopularTopics(
        instructorId,
        limit ? Number(limit) : undefined
      );
    }
  
    @Get('categories/breakdown')
    @ApiOperation({ summary: 'Get topics grouped by category' })
    @ApiResponse({ 
      status: 200, 
      description: 'Topic categories retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    async getTopicsByCategory(@Query('instructorId') instructorId?: string) {
      return this.sessionTopicService.getTopicsByCategory(instructorId);
    }
  }