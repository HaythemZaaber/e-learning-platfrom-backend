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
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AvailabilityService } from '../services/availability.service';
import {
  CreateRecurringAvailabilityRuleDto,
  UpdateRecurringAvailabilityRuleDto,
  RecurringAvailabilityRuleFilterDto,
  CreateAvailabilityDateOverrideDto,
  UpdateAvailabilityDateOverrideDto,
  AvailabilityDateOverrideFilterDto,
} from '../dto/recurring-availability.dto';
import { RestAuthGuard } from '../../auth/rest-auth.guard';

@ApiTags('Recurring Availability')
@ApiBearerAuth()
@UseGuards(RestAuthGuard)
@Controller('recurring-availability')
export class RecurringAvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // ============================================================================
  // RECURRING RULES
  // ============================================================================

  @Post('rules')
  @ApiOperation({ summary: 'Create a recurring availability rule' })
  @ApiResponse({
    status: 201,
    description: 'Recurring rule created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  async createRecurringRule(
    @Body() createDto: CreateRecurringAvailabilityRuleDto,
  ) {
    return this.availabilityService.createRecurringRule(createDto);
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get recurring availability rules' })
  @ApiResponse({
    status: 200,
    description: 'Recurring rules retrieved successfully',
  })
  @ApiQuery({
    name: 'instructorId',
    required: true,
    description: 'Instructor ID',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
    type: Boolean,
  })
  @ApiQuery({
    name: 'dayOfWeek',
    required: false,
    description: 'Filter by day of week',
    type: Number,
  })
  async getRecurringRules(
    @Query('instructorId') instructorId: string,
    @Query('isActive') isActive?: boolean,
    @Query('dayOfWeek') dayOfWeek?: number,
  ) {
    const filter: RecurringAvailabilityRuleFilterDto = {
      instructorId,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      dayOfWeek: dayOfWeek !== undefined ? Number(dayOfWeek) : undefined,
    };

    // Filter the results based on filter criteria
    let rules = await this.availabilityService.getRecurringRules(
      filter.instructorId!,
    );

    if (filter.isActive !== undefined) {
      rules = rules.filter((r) => r.isActive === filter.isActive);
    }

    if (filter.dayOfWeek !== undefined) {
      rules = rules.filter((r) => r.dayOfWeek === filter.dayOfWeek);
    }

    return rules;
  }

  @Get('rules/:id')
  @ApiOperation({ summary: 'Get recurring rule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Recurring rule retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring rule not found',
  })
  async getRecurringRule(@Param('id') id: string) {
    const rules = await this.availabilityService.getRecurringRules('');
    const rule = rules.find((r) => r.id === id);
    if (!rule) {
      throw new NotFoundException('Recurring rule not found');
    }
    return rule;
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: 'Update recurring availability rule' })
  @ApiResponse({
    status: 200,
    description: 'Recurring rule updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring rule not found',
  })
  async updateRecurringRule(
    @Param('id') id: string,
    @Body() updateDto: UpdateRecurringAvailabilityRuleDto,
  ) {
    return this.availabilityService.updateRecurringRule(id, updateDto);
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete recurring availability rule' })
  @ApiResponse({
    status: 200,
    description: 'Recurring rule deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Recurring rule not found',
  })
  @HttpCode(HttpStatus.OK)
  async deleteRecurringRule(@Param('id') id: string) {
    return this.availabilityService.deleteRecurringRule(id);
  }

  // ============================================================================
  // DATE OVERRIDES
  // ============================================================================

  @Post('overrides')
  @ApiOperation({ summary: 'Create a date override' })
  @ApiResponse({
    status: 201,
    description: 'Date override created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation errors',
  })
  async createDateOverride(
    @Body() createDto: CreateAvailabilityDateOverrideDto,
  ) {
    return this.availabilityService.createDateOverride(createDto);
  }

  @Get('overrides')
  @ApiOperation({ summary: 'Get date overrides' })
  @ApiResponse({
    status: 200,
    description: 'Date overrides retrieved successfully',
  })
  @ApiQuery({
    name: 'instructorId',
    required: true,
    description: 'Instructor ID',
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
  @ApiQuery({
    name: 'overrideType',
    required: false,
    description: 'Filter by override type',
  })
  async getDateOverrides(
    @Query('instructorId') instructorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('overrideType') overrideType?: string,
  ) {
    const filter: AvailabilityDateOverrideFilterDto = {
      instructorId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      overrideType: overrideType as any,
    };

    // Filter the results
    let overrides = await this.availabilityService.getDateOverrides(
      filter.instructorId!,
      filter.startDate,
      filter.endDate,
    );

    if (filter.overrideType) {
      overrides = overrides.filter(
        (o) => o.overrideType === filter.overrideType,
      );
    }

    return overrides;
  }

  @Get('overrides/:id')
  @ApiOperation({ summary: 'Get date override by ID' })
  @ApiResponse({
    status: 200,
    description: 'Date override retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Date override not found',
  })
  async getDateOverride(@Param('id') id: string) {
    const overrides = await this.availabilityService.getDateOverrides('');
    const override = overrides.find((o) => o.id === id);
    if (!override) {
      throw new NotFoundException('Date override not found');
    }
    return override;
  }

  @Patch('overrides/:id')
  @ApiOperation({ summary: 'Update date override' })
  @ApiResponse({
    status: 200,
    description: 'Date override updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Date override not found',
  })
  async updateDateOverride(
    @Param('id') id: string,
    @Body() updateDto: UpdateAvailabilityDateOverrideDto,
  ) {
    return this.availabilityService.updateDateOverride(id, updateDto);
  }

  @Delete('overrides/:id')
  @ApiOperation({ summary: 'Delete date override' })
  @ApiResponse({
    status: 200,
    description: 'Date override deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Date override not found',
  })
  @HttpCode(HttpStatus.OK)
  async deleteDateOverride(@Param('id') id: string) {
    return this.availabilityService.deleteDateOverride(id);
  }
}
