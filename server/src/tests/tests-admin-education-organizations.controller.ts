import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationDto,
  AdminEducationOrganizationsListQueryDto,
  AdminEducationOrganizationsListResponseDto,
  AdminUpdateEducationOrganizationDto,
} from './dto/tests-links.dto';
import { TestsPublicLinkService } from './tests-public-link.service';

@ApiTags('tests')
@ApiBearerAuth()
@UseGuards(AtGuard)
@Controller('admin/tests')
export class TestsAdminEducationOrganizationsController {
  constructor(private readonly testsPublicLinkService: TestsPublicLinkService) {}

  @Get('education-organizations')
  @ApiOperation({ summary: 'List educational organizations for link binding' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminEducationOrganizationsListResponseDto })
  listEducationOrganizations(
    @GetCurrentUserId() userId: number,
    @Query() query: AdminEducationOrganizationsListQueryDto,
  ) {
    return this.testsPublicLinkService.listEducationOrganizations(userId, query);
  }

  @Post('education-organizations')
  @ApiOperation({ summary: 'Create educational organization for link binding' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminEducationOrganizationDto })
  createEducationOrganization(
    @GetCurrentUserId() userId: number,
    @Body() dto: AdminCreateEducationOrganizationDto,
  ) {
    return this.testsPublicLinkService.createEducationOrganization(userId, dto);
  }

  @Patch('education-organizations/:organizationId')
  @ApiOperation({ summary: 'Update educational organization validation settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminEducationOrganizationDto })
  updateEducationOrganization(
    @GetCurrentUserId() userId: number,
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() dto: AdminUpdateEducationOrganizationDto,
  ) {
    return this.testsPublicLinkService.updateEducationOrganization(userId, organizationId, dto);
  }
}
