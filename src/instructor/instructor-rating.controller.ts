import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { InstructorRatingService } from './instructor-rating.service';
import {
  CreateInstructorRatingDto,
  UpdateInstructorRatingDto,
  InstructorRatingResponseDto,
  InstructorRatingStatsDto,
  RatingEligibilityDto,
} from './dto/instructor-rating.dto';
import { RestAuthGuard } from '../auth/rest-auth.guard';
import { AuthenticatedRequest } from '../auth/auth.types';

@ApiTags('Instructor Ratings')
@Controller('instructor-ratings')
export class InstructorRatingController {
  constructor(
    private readonly instructorRatingService: InstructorRatingService,
  ) {}

  @Post()
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new instructor rating' })
  @ApiResponse({
    status: 201,
    description: 'Rating created successfully',
    type: InstructorRatingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors or rating already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - student not eligible to rate instructor',
  })
  @ApiResponse({
    status: 404,
    description: 'Instructor or student not found',
  })
  @HttpCode(HttpStatus.CREATED)
  async createInstructorRating(
    @Body() createDto: CreateInstructorRatingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<InstructorRatingResponseDto> {
    const studentId = req.user.id;
    return this.instructorRatingService.createInstructorRating(
      createDto,
      studentId,
    );
  }

  @Put(':ratingId')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an existing instructor rating' })
  @ApiResponse({
    status: 200,
    description: 'Rating updated successfully',
    type: InstructorRatingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own ratings',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found',
  })
  @ApiParam({
    name: 'ratingId',
    description: 'Rating ID to update',
    example: 'clr1234567890',
  })
  async updateInstructorRating(
    @Param('ratingId') ratingId: string,
    @Body() updateDto: UpdateInstructorRatingDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<InstructorRatingResponseDto> {
    const studentId = req.user.id;
    return this.instructorRatingService.updateInstructorRating(
      ratingId,
      updateDto,
      studentId,
    );
  }

  @Delete(':ratingId')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an instructor rating' })
  @ApiResponse({
    status: 200,
    description: 'Rating deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own ratings',
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found',
  })
  @ApiParam({
    name: 'ratingId',
    description: 'Rating ID to delete',
    example: 'clr1234567890',
  })
  async deleteInstructorRating(
    @Param('ratingId') ratingId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ success: boolean; message: string }> {
    const studentId = req.user.id;
    return this.instructorRatingService.deleteInstructorRating(
      ratingId,
      studentId,
    );
  }

  @Get('eligibility/:instructorId')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check if student is eligible to rate an instructor',
  })
  @ApiResponse({
    status: 200,
    description: 'Eligibility check completed',
    type: RatingEligibilityDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Instructor or student not found',
  })
  @ApiParam({
    name: 'instructorId',
    description: 'Instructor ID to check eligibility for',
    example: 'clr1234567890',
  })
  async checkRatingEligibility(
    @Param('instructorId') instructorId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<RatingEligibilityDto> {
    const studentId = req.user.id;
    return this.instructorRatingService.checkRatingEligibility(
      instructorId,
      studentId,
    );
  }

  @Get('instructor/:instructorId')
  @ApiOperation({ summary: 'Get all ratings for an instructor' })
  @ApiResponse({
    status: 200,
    description: 'Instructor ratings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        ratings: {
          type: 'array',
          items: { $ref: '#/components/schemas/InstructorRatingResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Instructor not found',
  })
  @ApiParam({
    name: 'instructorId',
    description: 'Instructor ID to get ratings for',
    example: 'clr1234567890',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page',
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: 'minRating',
    required: false,
    description: 'Minimum rating filter',
    type: Number,
    example: 4,
  })
  @ApiQuery({
    name: 'maxRating',
    required: false,
    description: 'Maximum rating filter',
    type: Number,
    example: 5,
  })
  @ApiQuery({
    name: 'includePrivate',
    required: false,
    description: 'Include private ratings (requires authentication)',
    type: Boolean,
    example: false,
  })
  async getInstructorRatings(
    @Param('instructorId') instructorId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('minRating') minRating?: number,
    @Query('maxRating') maxRating?: number,
    @Query('includePrivate') includePrivate?: boolean,
  ) {
    return this.instructorRatingService.getInstructorRatings(instructorId, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      minRating: minRating ? Number(minRating) : undefined,
      maxRating: maxRating ? Number(maxRating) : undefined,
      includePrivate: includePrivate === true,
    });
  }

  @Get('instructor/:instructorId/stats')
  @ApiOperation({ summary: 'Get instructor rating statistics' })
  @ApiResponse({
    status: 200,
    description: 'Rating statistics retrieved successfully',
    type: InstructorRatingStatsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Instructor not found',
  })
  @ApiParam({
    name: 'instructorId',
    description: 'Instructor ID to get statistics for',
    example: 'clr1234567890',
  })
  async getInstructorRatingStats(
    @Param('instructorId') instructorId: string,
  ): Promise<InstructorRatingStatsDto> {
    return this.instructorRatingService.getInstructorRatingStats(instructorId);
  }

  @Get('student/:instructorId')
  @UseGuards(RestAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get student's rating for a specific instructor",
  })
  @ApiResponse({
    status: 200,
    description: 'Student rating retrieved successfully',
    type: InstructorRatingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Instructor not found or no rating exists',
  })
  @ApiParam({
    name: 'instructorId',
    description: 'Instructor ID to get student rating for',
    example: 'clr1234567890',
  })
  async getStudentRatingForInstructor(
    @Param('instructorId') instructorId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<InstructorRatingResponseDto | null> {
    const studentId = req.user.id;
    return this.instructorRatingService.getStudentRatingForInstructor(
      instructorId,
      studentId,
    );
  }

  @Get(':ratingId')
  @ApiOperation({ summary: 'Get a specific rating by ID' })
  @ApiResponse({
    status: 200,
    description: 'Rating retrieved successfully',
    type: InstructorRatingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Rating not found',
  })
  @ApiParam({
    name: 'ratingId',
    description: 'Rating ID to retrieve',
    example: 'clr1234567890',
  })
  @ApiQuery({
    name: 'includePrivate',
    required: false,
    description: 'Include private rating (requires authentication)',
    type: Boolean,
    example: false,
  })
  async getRatingById(
    @Param('ratingId') ratingId: string,
    @Query('includePrivate') includePrivate?: boolean,
  ): Promise<InstructorRatingResponseDto> {
    return this.instructorRatingService.getRatingById(
      ratingId,
      includePrivate === true,
    );
  }
}

