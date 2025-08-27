import {
    Controller,
    Get,
    Post,
    Put,
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
  import { InstructorProfileService } from './instructor-profile.service';
  import { 
    CreateInstructorProfileDto, 
    UpdateInstructorProfileDto 
  } from './dto/instructor-profile.dto';
  import { SessionStatsDto } from './dto/session-stats.dto';
  import { RestAuthGuard } from '../auth/rest-auth.guard';
 
  
  @ApiTags('Instructor Profiles')
  @ApiBearerAuth()
  @UseGuards(RestAuthGuard)
  @Controller('instructor-profiles')
  export class InstructorProfileController {
    constructor(private readonly instructorProfileService: InstructorProfileService) {}

    @Get('session-stats')
    @ApiOperation({ summary: 'Get instructor session statistics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Session statistics retrieved successfully',
      type: SessionStatsDto
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    @ApiQuery({ name: 'instructorId', required: true, description: 'Instructor ID' })
    async getSessionStats(@Query('instructorId') instructorId: string): Promise<SessionStatsDto> {
      return this.instructorProfileService.getSessionStats(instructorId);
    }
  
    @Get(':userId')
    @ApiOperation({ summary: 'Get instructor profile by user ID' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor profile retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor profile not found' 
    })
    async getInstructorProfile(@Param('userId') userId: string) {
      return this.instructorProfileService.getInstructorProfile(userId);
    }

    @Get('details/:instructorId')
    @ApiOperation({ summary: 'Get comprehensive instructor details for public profile page' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor details retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    async getInstructorDetails(@Param('instructorId') instructorId: string) {
      return this.instructorProfileService.getInstructorDetails(instructorId);
    }

    @Get(':instructorId/courses')
    @ApiOperation({ summary: 'Get all courses by instructor' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor courses retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
    @ApiQuery({ name: 'status', required: false, description: 'Course status filter' })
    async getInstructorCourses(
      @Param('instructorId') instructorId: string,
      @Query('page') page?: number,
      @Query('limit') limit?: number,
      @Query('status') status?: string,
    ) {
      return this.instructorProfileService.getInstructorCourses(instructorId, {
        page: page || 1,
        limit: limit || 10,
        status
      });
    }

    @Get(':instructorId/reviews')
    @ApiOperation({ summary: 'Get all reviews for instructor' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor reviews retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
    @ApiQuery({ name: 'rating', required: false, description: 'Filter by rating', type: Number })
    async getInstructorReviews(
      @Param('instructorId') instructorId: string,
      @Query('page') page?: number,
      @Query('limit') limit?: number,
      @Query('rating') rating?: number,
    ) {
      return this.instructorProfileService.getInstructorReviews(instructorId, {
        page: page || 1,
        limit: limit || 10,
        rating
      });
    }

    @Get(':instructorId/availability')
    @ApiOperation({ summary: 'Get instructor availability' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor availability retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor not found' 
    })
    @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
    async getInstructorAvailability(
      @Param('instructorId') instructorId: string,
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
    ) {
      return this.instructorProfileService.getInstructorAvailability(instructorId, {
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      });
    }

    @Get(':instructorId/stats')
    @ApiOperation({ summary: 'Get instructor statistics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor statistics retrieved successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor profile not found' 
    })
    async getInstructorStats(@Param('instructorId') instructorId: string) {
      return this.instructorProfileService.getInstructorStats(instructorId);
    }
  
    @Post()
    @ApiOperation({ summary: 'Create instructor profile' })
    @ApiResponse({ 
      status: 201, 
      description: 'Instructor profile created successfully' 
    })
    @ApiResponse({ 
      status: 400, 
      description: 'Bad request - validation errors or profile already exists' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'User not found' 
    })
    async createInstructorProfile(
      @Body() createInstructorProfileDto: CreateInstructorProfileDto
    ) {
      return this.instructorProfileService.createInstructorProfile(createInstructorProfileDto);
    }
  
    @Patch(':userId')
    @ApiOperation({ summary: 'Update instructor profile' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructor profile updated successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor profile not found' 
    })
    async updateInstructorProfile(
      @Param('userId') userId: string,
      @Body() updateInstructorProfileDto: UpdateInstructorProfileDto
    ) {
      return this.instructorProfileService.updateInstructorProfile(userId, updateInstructorProfileDto);
    }
  
    @Patch(':userId/enable-live-sessions')
    @ApiOperation({ summary: 'Enable live sessions for instructor' })
    @ApiResponse({ 
      status: 200, 
      description: 'Live sessions enabled successfully' 
    })
    @ApiResponse({ 
      status: 404, 
      description: 'Instructor profile not found' 
    })
    async enableLiveSessions(@Param('userId') userId: string) {
      return this.instructorProfileService.enableLiveSessions(userId);
    }
  
    @Put(':userId/update-stats')
    @ApiOperation({ summary: 'Update instructor profile statistics' })
    @ApiResponse({ 
      status: 200, 
      description: 'Statistics updated successfully' 
    })
    @HttpCode(HttpStatus.OK)
    async updateProfileStats(@Param('userId') userId: string) {
      await this.instructorProfileService.updateProfileStats(userId);
      return { message: 'Statistics updated successfully' };
    }
  
    @Get()
    @ApiOperation({ summary: 'Search instructors' })
    @ApiResponse({ 
      status: 200, 
      description: 'Instructors retrieved successfully' 
    })
    @ApiQuery({ name: 'search', required: false, description: 'Search term' })
    @ApiQuery({ name: 'subjects', required: false, description: 'Subject filters', type: [String] })
    @ApiQuery({ name: 'categories', required: false, description: 'Category filters', type: [String] })
    @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating filter', type: Number })
    @ApiQuery({ name: 'maxPrice', required: false, description: 'Maximum price filter', type: Number })
    @ApiQuery({ name: 'availability', required: false, description: 'Has availability', type: Boolean })
    @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
    @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
    async searchInstructors(
      @Query('search') search?: string,
      @Query('subjects') subjects?: string | string[],
      @Query('categories') categories?: string | string[],
      @Query('minRating') minRating?: number,
      @Query('maxPrice') maxPrice?: number,
      @Query('availability') availability?: boolean,
      @Query('page') page?: number,
      @Query('limit') limit?: number,
    ) {
      // Convert single values to arrays
      const subjectsArray = Array.isArray(subjects) ? subjects : subjects ? [subjects] : undefined;
      const categoriesArray = Array.isArray(categories) ? categories : categories ? [categories] : undefined;
  
      return this.instructorProfileService.searchInstructors({
        search,
        subjects: subjectsArray,
        categories: categoriesArray,
        minRating: minRating ? Number(minRating) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        availability: availability !== undefined ? Boolean(availability) : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
    }
  }
