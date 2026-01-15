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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SessionOfferingService } from '../services/session-offering.service';
import { GroupAutoCancelService } from '../services/group-auto-cancel.service';
import {
  CreateGroupOfferingInstanceDto,
  UpdateGroupOfferingInstanceDto,
  GroupInstanceFilterDto,
} from '../dto/group-instance.dto';
import { RestAuthGuard } from '../../auth/rest-auth.guard';

@ApiTags('Group Offering Instances')
@ApiBearerAuth()
@UseGuards(RestAuthGuard)
@Controller('group-instances')
export class GroupInstanceController {
  constructor(
    private readonly sessionOfferingService: SessionOfferingService,
    private readonly groupAutoCancelService: GroupAutoCancelService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a group offering instance' })
  @ApiResponse({
    status: 201,
    description: 'Group instance created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors or conflicts',
  })
  @ApiResponse({
    status: 404,
    description: 'Offering not found',
  })
  async createGroupInstance(@Body() createDto: CreateGroupOfferingInstanceDto) {
    return this.sessionOfferingService.createGroupInstance(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get group instances with filters' })
  @ApiResponse({
    status: 200,
    description: 'Group instances retrieved successfully',
  })
  @ApiQuery({
    name: 'offeringId',
    required: false,
    description: 'Filter by offering ID',
  })
  @ApiQuery({
    name: 'instructorId',
    required: false,
    description: 'Filter by instructor ID',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'isBookable',
    required: false,
    description: 'Filter by bookable status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Filter by start date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'Filter by end date',
  })
  async getGroupInstances(
    @Query('offeringId') offeringId?: string,
    @Query('instructorId') instructorId?: string,
    @Query('status') status?: string,
    @Query('isBookable') isBookable?: boolean,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filter: GroupInstanceFilterDto = {
      offeringId,
      instructorId,
      status: status as any,
      isBookable: isBookable !== undefined ? Boolean(isBookable) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };

    return this.sessionOfferingService.getGroupInstances(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get group instance by ID' })
  @ApiResponse({
    status: 200,
    description: 'Group instance retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Group instance not found',
  })
  async getGroupInstance(@Param('id') id: string) {
    return this.sessionOfferingService.getGroupInstance(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update group instance' })
  @ApiResponse({
    status: 200,
    description: 'Group instance updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Group instance not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Validation errors or invalid status transition',
  })
  async updateGroupInstance(
    @Param('id') id: string,
    @Body() updateDto: UpdateGroupOfferingInstanceDto,
  ) {
    return this.sessionOfferingService.updateGroupInstance(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete group instance' })
  @ApiResponse({
    status: 200,
    description: 'Group instance deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Group instance not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete instance with active bookings',
  })
  @HttpCode(HttpStatus.OK)
  async deleteGroupInstance(@Param('id') id: string) {
    return this.sessionOfferingService.deleteGroupInstance(id);
  }

  @Get('offering/:offeringId/instances')
  @ApiOperation({ summary: 'Get all instances for an offering' })
  @ApiResponse({
    status: 200,
    description: 'Instances retrieved successfully',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'isBookable',
    required: false,
    description: 'Filter by bookable status',
    type: Boolean,
  })
  async getInstancesByOffering(
    @Param('offeringId') offeringId: string,
    @Query('status') status?: string,
    @Query('isBookable') isBookable?: boolean,
  ) {
    return this.sessionOfferingService.getGroupInstances({
      offeringId,
      status: status as any,
      isBookable: isBookable !== undefined ? Boolean(isBookable) : undefined,
    });
  }

  @Post(':id/check-auto-cancel')
  @ApiOperation({
    summary: 'Manually trigger auto-cancel check for an instance',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-cancel check completed',
  })
  @ApiResponse({
    status: 404,
    description: 'Group instance not found',
  })
  async checkAutoCancel(@Param('id') id: string) {
    return this.groupAutoCancelService.checkInstance(id);
  }

  @Post('auto-cancel/check-all')
  @ApiOperation({
    summary: 'Check all instances for auto-cancel (cron job endpoint)',
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-cancel check completed',
  })
  @HttpCode(HttpStatus.OK)
  async checkAllInstances() {
    return this.groupAutoCancelService.checkAndAutoCancelInstances();
  }

  @Get('auto-cancel/approaching')
  @ApiOperation({ summary: 'Get instances approaching auto-cancel check time' })
  @ApiResponse({
    status: 200,
    description: 'Instances retrieved successfully',
  })
  @ApiQuery({
    name: 'hoursBefore',
    required: false,
    description: 'Hours before check time',
    type: Number,
  })
  async getInstancesApproachingAutoCancel(
    @Query('hoursBefore') hoursBefore?: number,
  ) {
    return this.groupAutoCancelService.getInstancesApproachingAutoCancel(
      hoursBefore ? Number(hoursBefore) : 24,
    );
  }
}
