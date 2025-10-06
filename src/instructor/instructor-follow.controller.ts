import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { InstructorFollowService } from './instructor-follow.service';
import { RestAuthGuard } from '../auth/rest-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('instructor-follow')
@UseGuards(RestAuthGuard)
export class InstructorFollowController {
  constructor(private instructorFollowService: InstructorFollowService) {}

  /**
   * Follow an instructor
   */
  @Post(':instructorId/follow')
  @Roles('STUDENT')
  async followInstructor(
    @Param('instructorId') instructorId: string,
    @Request() req: any,
  ) {
    const studentId = req.user.id;
    return this.instructorFollowService.followInstructor(
      studentId,
      instructorId,
    );
  }

  /**
   * Unfollow an instructor
   */
  @Delete(':instructorId/follow')
  @Roles('STUDENT')
  async unfollowInstructor(
    @Param('instructorId') instructorId: string,
    @Request() req: any,
  ) {
    const studentId = req.user.id;
    return this.instructorFollowService.unfollowInstructor(
      studentId,
      instructorId,
    );
  }

  /**
   * Check if following an instructor
   */
  @Get(':instructorId/following')
  @Roles('STUDENT')
  async isFollowing(
    @Param('instructorId') instructorId: string,
    @Request() req: any,
  ) {
    const studentId = req.user.id;
    const isFollowing = await this.instructorFollowService.isFollowing(
      studentId,
      instructorId,
    );
    return { isFollowing };
  }

  /**
   * Get instructors that a student is following
   */
  @Get('following')
  @Roles('STUDENT')
  async getStudentFollowing(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const studentId = req.user.id;
    return this.instructorFollowService.getStudentFollowing(
      studentId,
      page,
      limit,
    );
  }

  /**
   * Get followers of an instructor
   */
  @Get('followers')
  @Roles('INSTRUCTOR')
  async getInstructorFollowers(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const instructorId = req.user.id;
    return this.instructorFollowService.getInstructorFollowers(
      instructorId,
      page,
      limit,
    );
  }

  /**
   * Get follow statistics for an instructor
   */
  @Get('stats')
  @Roles('INSTRUCTOR')
  async getFollowStats(@Request() req: any) {
    const instructorId = req.user.id;
    return this.instructorFollowService.getInstructorFollowStats(instructorId);
  }
}
