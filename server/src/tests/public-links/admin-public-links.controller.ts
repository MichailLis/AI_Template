import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../../auth/decorators';
import { AtGuard } from '../../auth/guards';
import {
  AdminCreatePublicLinkDto,
  AdminDeletePublicLinkResponseDto,
  AdminPublicLinkDto,
  AdminPublicLinksListResponseDto,
  AdminUpdatePublicLinkDto,
} from '../dto/tests-links.dto';
import { TestsPublicLinkService } from '../public-links/public-link.service';
import { ApiErrorResponses } from '../../common/decorators/api-error-responses.decorator';

@ApiTags('tests')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard)
@Controller('admin/tests')
export class TestsAdminPublicLinksController {
  constructor(private readonly testsPublicLinkService: TestsPublicLinkService) {}

  @Post('public-links')
  @ApiOperation({ summary: 'Create short public link for published test version' })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminPublicLinkDto })
  createPublicLink(@GetCurrentUserId() userId: number, @Body() dto: AdminCreatePublicLinkDto) {
    return this.testsPublicLinkService.createPublicLink(userId, dto);
  }

  @Get('public-links')
  @ApiOperation({ summary: 'List short public links for tests' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinksListResponseDto })
  listPublicLinks(@GetCurrentUserId() userId: number) {
    return this.testsPublicLinkService.listPublicLinks(userId);
  }

  @Get('public-links/archived')
  @ApiOperation({ summary: 'List archived public links for tests' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinksListResponseDto })
  listArchivedPublicLinks(@GetCurrentUserId() userId: number) {
    return this.testsPublicLinkService.listArchivedPublicLinks(userId);
  }

  @Patch('public-links/:linkId')
  @ApiOperation({ summary: 'Update short public link settings' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinkDto })
  updatePublicLink(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
    @Body() dto: AdminUpdatePublicLinkDto,
  ) {
    return this.testsPublicLinkService.updatePublicLink(userId, linkId, dto);
  }

  @Post('public-links/:linkId/regenerate')
  @ApiOperation({ summary: 'Regenerate short code for public link' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinkDto })
  regeneratePublicLinkShortCode(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
  ) {
    return this.testsPublicLinkService.regeneratePublicLinkShortCode(userId, linkId);
  }

  @Delete('public-links/:linkId')
  @ApiOperation({ summary: 'Archive public link (disable access and hide from default list)' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminDeletePublicLinkResponseDto })
  deletePublicLink(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
  ) {
    return this.testsPublicLinkService.deletePublicLink(userId, linkId);
  }

  @Post('public-links/:linkId/restore')
  @ApiOperation({ summary: 'Restore archived public link' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicLinkDto })
  restorePublicLink(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
  ) {
    return this.testsPublicLinkService.restorePublicLink(userId, linkId);
  }
}
