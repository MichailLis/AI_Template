import { Controller, Get, HttpStatus, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import {
  AdminPublicAttemptDetailResponseDto,
  AdminPublicAttemptsListQueryDto,
  AdminPublicAttemptsListResponseDto,
} from './dto/tests-links.dto';
import { TestsAttemptService } from './tests-attempt.service';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';

@ApiTags('tests')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard)
@Controller('admin/tests')
export class TestsAdminAttemptsController {
  constructor(private readonly testsAttemptService: TestsAttemptService) {}

  @Get('public-links/:linkId/attempts')
  @ApiOperation({ summary: 'List student attempts by public link' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicAttemptsListResponseDto })
  listPublicLinkAttempts(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
    @Query() query: AdminPublicAttemptsListQueryDto,
  ) {
    return this.testsAttemptService.listAttemptsForLink(userId, linkId, query);
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get student attempt details with answers and analysis' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicAttemptDetailResponseDto })
  getAttemptDetail(
    @GetCurrentUserId() userId: number,
    @Param('attemptId', ParseIntPipe) attemptId: number,
  ) {
    return this.testsAttemptService.getAttemptDetail(userId, attemptId);
  }
}
