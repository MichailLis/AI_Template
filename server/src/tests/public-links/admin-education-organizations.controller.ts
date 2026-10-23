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

import { AtGuard } from '../../auth/guards';
import { AdminGuard } from '../../common/authz/admin.guard';
import {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationDto,
  AdminEducationOrganizationsListQueryDto,
  AdminEducationOrganizationsListResponseDto,
  AdminUpdateEducationOrganizationDto,
} from '../dto/tests-links.dto';
import { TestsPublicLinkService } from '../public-links/public-link.service';
import { ApiErrorResponses } from '../../common/decorators/api-error-responses.decorator';

@ApiTags('tests')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard, AdminGuard)
@Controller('admin/tests')
export class TestsAdminEducationOrganizationsController {
  constructor(private readonly testsPublicLinkService: TestsPublicLinkService) {}

  @Get('education-organizations')
  @ApiOperation({ summary: 'List educational organizations for link binding' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminEducationOrganizationsListResponseDto })
  listEducationOrganizations(@Query() query: AdminEducationOrganizationsListQueryDto) {
    return this.testsPublicLinkService.listEducationOrganizations(query);
  }

  @Post('education-organizations')
  @ApiOperation({ summary: 'Create educational organization for link binding' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminEducationOrganizationDto })
  createEducationOrganization(@Body() dto: AdminCreateEducationOrganizationDto) {
    return this.testsPublicLinkService.createEducationOrganization(dto);
  }

  @Patch('education-organizations/:organizationId')
  @ApiOperation({ summary: 'Update educational organization validation settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminEducationOrganizationDto })
  updateEducationOrganization(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() dto: AdminUpdateEducationOrganizationDto,
  ) {
    return this.testsPublicLinkService.updateEducationOrganization(organizationId, dto);
  }
}
