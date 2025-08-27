import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { RestAuthGuard } from '../../auth/rest-auth.guard';

@ApiTags('Instructor Reviews')
@ApiBearerAuth()
@UseGuards(RestAuthGuard)
@Controller('instructor-reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get(':instructorId')
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
    return this.reviewsService.getInstructorReviews(instructorId, {
      page: page || 1,
      limit: limit || 10,
      rating
    });
  }

  @Get(':instructorId/stats')
  @ApiOperation({ summary: 'Get instructor review statistics' })
  @ApiResponse({ 
    status: 200, 
    description: 'Review statistics retrieved successfully' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Instructor not found' 
  })
  async getReviewStats(@Param('instructorId') instructorId: string) {
    return this.reviewsService.getReviewStats(instructorId);
  }
}
