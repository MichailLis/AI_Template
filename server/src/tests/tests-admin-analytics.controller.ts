import {
  applyDecorators,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import { ApiErrorResponses } from '../common/decorators/api-error-responses.decorator';
import {
  AdminTestAnalyticsSummaryDto,
  type AdminTestAnalyticsQueryDto,
} from './dto/tests-analytics.dto';
import { TestsAnalyticsExportService } from './tests-analytics-export.service';
import { TestsAnalyticsService } from './tests-analytics.service';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const PDF_CONTENT_TYPE = 'application/pdf';
const ANALYTICS_SCOPE_VALUES = ['TOPIC', 'PUBLIC_LINK'] as const;
const ANALYTICS_LINK_STATUS_VALUES = ['ALL', 'ACTIVE', 'ARCHIVED'] as const;

const ApiAnalyticsQuery = () =>
  applyDecorators(
    ApiQuery({ name: 'scope', required: false, enum: ANALYTICS_SCOPE_VALUES }),
    ApiQuery({ name: 'publicLinkId', required: false, type: Number }),
    ApiQuery({ name: 'linkStatus', required: false, enum: ANALYTICS_LINK_STATUS_VALUES }),
    ApiQuery({ name: 'dateFrom', required: false, type: String, format: 'date' }),
    ApiQuery({ name: 'dateTo', required: false, type: String, format: 'date' }),
  );

@ApiTags('tests')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard)
@Controller('admin/tests')
export class TestsAdminAnalyticsController {
  constructor(
    private readonly analyticsService: TestsAnalyticsService,
    private readonly exportService: TestsAnalyticsExportService,
  ) {}

  @Get('topics/:topicId/analytics/summary')
  @ApiOperation({ summary: 'Get analytics summary for topic' })
  @ApiAnalyticsQuery()
  @ApiResponse({ status: HttpStatus.OK, type: AdminTestAnalyticsSummaryDto })
  getSummary(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() query: AdminTestAnalyticsQueryDto,
  ): Promise<AdminTestAnalyticsSummaryDto> {
    return this.analyticsService.getSummary(userId, topicId, query);
  }

  @Get('topics/:topicId/analytics/export.xlsx')
  @ApiOperation({ summary: 'Export analytics summary in XLSX' })
  @ApiAnalyticsQuery()
  @ApiResponse({ status: HttpStatus.OK, description: 'Excel analytics report' })
  async exportXlsx(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() query: AdminTestAnalyticsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const summary = await this.analyticsService.getSummary(userId, topicId, query);
    const file = new StreamableFile(await this.exportService.toExcel(summary), {
      type: XLSX_CONTENT_TYPE,
      disposition: `attachment; filename="test-analytics-${topicId}.xlsx"`,
    });

    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="test-analytics-${topicId}.xlsx"`);

    return file;
  }

  @Get('topics/:topicId/analytics/export.pdf')
  @ApiOperation({ summary: 'Export analytics summary in PDF' })
  @ApiAnalyticsQuery()
  @ApiResponse({ status: HttpStatus.OK, description: 'PDF analytics report' })
  async exportPdf(
    @GetCurrentUserId() userId: number,
    @Param('topicId', ParseIntPipe) topicId: number,
    @Query() query: AdminTestAnalyticsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const summary = await this.analyticsService.getSummary(userId, topicId, query);
    const file = new StreamableFile(await this.exportService.toPdf(summary), {
      type: PDF_CONTENT_TYPE,
      disposition: `attachment; filename="test-analytics-${topicId}.pdf"`,
    });

    res.setHeader('Content-Type', PDF_CONTENT_TYPE);
    res.setHeader('Content-Disposition', `attachment; filename="test-analytics-${topicId}.pdf"`);

    return file;
  }
}
