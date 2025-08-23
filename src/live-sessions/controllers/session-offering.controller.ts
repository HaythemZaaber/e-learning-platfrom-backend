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
  import { SessionOfferingService } from '../services/session-offering.service';
  import { 
    CreateSessionOfferingDto, 
    UpdateSessionOfferingDto,
    SessionOfferingFilterDto
  } from '../dto/session-offering.dto';
  import { 
    SessionType, 
    SessionTopicType 
  } from '../dto/common.dto';
  import { RestAuthGuard } from '../../auth/rest-auth.guard';

  
  @ApiTags('Session Offerings')
  @ApiBearerAuth()
  @UseGuards(RestAuthGuard)
  @Controller('session-offerings')
  export class SessionOfferingController {
    constructor(private readonly sessionOfferingService: SessionOfferingService) {}
  
    @Get()
    @ApiOperation({ summary: 'Get session offerings with filters' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session offerings retrieved successfully' 
    })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', type: Boolean })
    @ApiQuery({ name: 'sessionType', required: false, enum: SessionType, description: 'Filter by session type' })
    @ApiQuery({ name: 'topicType', required: false, enum: SessionTopicType, description: 'Filter by topic type' })
    @ApiQuery({ name: 'category', required: false, description: 'Filter by category' })
    @ApiQuery({ name: 'search', required: false, description: 'Search term' })
    @ApiQuery({ name: 'domain', required: false, description: 'Filter by domain' })
    @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status', type: Boolean })
    @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price filter', type: Number })
    @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter', type: Number })
    async getSessionOfferings(
      @Query('instructorId') instructorId?: string,
      @Query('isActive') isActive?: boolean,
      @Query('sessionType') sessionType?: SessionType,
      @Query('topicType') topicType?: SessionTopicType,
      @Query('category') category?: string,
      @Query('search') search?: string,
      @Query('domain') domain?: string,
      @Query('isPublic') isPublic?: boolean,
      @Query('minPrice') minPrice?: number,
      @Query('maxPrice') maxPrice?: number,
    ) {
      const filter: SessionOfferingFilterDto = {
        instructorId,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        sessionType,
        topicType,
        category,
        search,
        domain,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
      };
  
      return this.sessionOfferingService.getSessionOfferings(filter);
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get session offering by ID' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session offering retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session offering not found' 
    })
    async getSessionOffering(@Param('id') id: string) {
      return this.sessionOfferingService.getSessionOffering(id);
    }
  
    @Post()
    @ApiOperation({ summary: 'Create session offering' })
    @ApiResponse({ 
      status: 201, 
      description: 'Session offering created successfully' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Bad request - validation errors' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor or topic not found' 
    })
    async createSessionOffering(@Body() createSessionOfferingDto: CreateSessionOfferingDto) {
      return this.sessionOfferingService.createSessionOffering(createSessionOfferingDto);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update session offering' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session offering updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session offering not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Validation errors' 
    })
    async updateSessionOffering(
      @Param('id') id: string,
      @Body() updateSessionOfferingDto: UpdateSessionOfferingDto
    ) {
      return this.sessionOfferingService.updateSessionOffering(id, updateSessionOfferingDto);
    }
  
    @Delete(':id')
    @ApiOperation({ summary: 'Delete session offering' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session offering deleted successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session offering not found' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Cannot delete offering with active bookings' 
    })
    @HttpCode(HttpStatus.OK)
    async deleteSessionOffering(@Param('id') id: string) {
      return this.sessionOfferingService.deleteSessionOffering(id);
    }
  
    @Patch(':id/toggle-active')
    @ApiOperation({ summary: 'Toggle offering active status' })
    @ApiResponse({ 
      status: 200, 
      description: 'Offering status toggled successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session offering not found' 
    })
    async toggleOfferingActive(@Param('id') id: string) {
      return this.sessionOfferingService.toggleOfferingActive(id);
    }
  
    @Get(':id/statistics')
    @ApiOperation({ summary: 'Get offering statistics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Offering statistics retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session offering not found' 
    })
    async getOfferingStatistics(@Param('id') id: string) {
      return this.sessionOfferingService.getOfferingStatistics(id);
    }
  
    @Get('search/offerings')
    @ApiOperation({ summary: 'Search session offerings' })
    @ApiResponse({ 
      status: 200, 
      description: 'Search results retrieved successfully' 
    })
    @ApiQuery({ name: 'search', required: false, description: 'Search term' })
    @ApiQuery({ name: 'instructorId', required: false, description: 'Filter by instructor ID' })
    @ApiQuery({ name: 'sessionType', required: false, description: 'Filter by session type' })
    @ApiQuery({ name: 'topicType', required: false, description: 'Filter by topic type' })
    @ApiQuery({ name: 'domain', required: false, description: 'Filter by domain' })
    @ApiQuery({ name: 'minPrice', required: false, description: 'Minimum price', type: Number })
    @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price', type: Number })
    @ApiQuery({ name: 'isActive', required: false, description: 'Filter by active status', type: Boolean })
    @ApiQuery({ name: 'isPublic', required: false, description: 'Filter by public status', type: Boolean })
    @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating', type: Number })
    @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
    async searchOfferings(
      @Query('search') search?: string,
      @Query('instructorId') instructorId?: string,
      @Query('sessionType') sessionType?: string,
      @Query('topicType') topicType?: string,
      @Query('domain') domain?: string,
      @Query('minPrice') minPrice?: number,
      @Query('maxPrice') maxPrice?: number,
      @Query('isActive') isActive?: boolean,
      @Query('isPublic') isPublic?: boolean,
      @Query('minRating') minRating?: number,
      @Query('page') page?: number,
      @Query('limit') limit?: number,
    ) {
      return this.sessionOfferingService.searchOfferings({
        search,
        instructorId,
        sessionType,
        topicType,
        domain,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    }
  
    @Get('popular/offerings')
    @ApiOperation({ summary: 'Get popular session offerings' })
    @ApiResponse({ 
      status: 200, 
      description: 'Popular offerings retrieved successfully' 
    })
    @ApiQuery({ name: 'limit', required: false, description: 'Number of offerings to return', type: Number })
    async getPopularOfferings(@Query('limit') limit?: number) {
      return this.sessionOfferingService.getPopularOfferings(
        limit ? Number(limit) : undefined
      );
    }
  
    @Get('instructor/:instructorId/offerings')
    @ApiOperation({ summary: 'Get offerings by instructor' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor offerings retrieved successfully' 
    })
    @ApiQuery({ name: 'includeInactive', required: false, description: 'Include inactive offerings', type: Boolean })
    async getOfferingsByInstructor(
      @Param('instructorId') instructorId: string,
      @Query('includeInactive') includeInactive?: boolean
    ) {
      return this.sessionOfferingService.getOfferingsByInstructor(
        instructorId,
        includeInactive ? Boolean(includeInactive) : undefined
      );
    }
  
    @Post(':id/duplicate')
    @ApiOperation({ summary: 'Duplicate session offering' })
    @ApiResponse({ 
      status: 201, 
      description: 'Offering duplicated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session offering not found' 
    })
    async duplicateOffering(
      @Param('id') id: string,
      @Body() duplicateData?: { title?: string }
    ) {
      return this.sessionOfferingService.duplicateOffering(id, duplicateData?.title);
    }
  
    @Get(':id/availability')
    @ApiOperation({ summary: 'Get offering availability' })
    @ApiResponse({ 
      status: 200, 
      description: 'Offering availability retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Session offering not found' 
    })
    @ApiQuery({ name: 'days', required: false, description: 'Number of days to check', type: Number })
    async getOfferingAvailability(
      @Param('id') id: string,
      @Query('days') days?: number
    ) {
      return this.sessionOfferingService.getOfferingAvailability(
        id,
        days ? Number(days) : undefined
      );
    }
  }