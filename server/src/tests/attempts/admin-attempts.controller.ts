import {
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
import { ApiBearerAuth, ApiOperation, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
import { type Response } from 'express';

import { AuditService } from '../../audit/audit.service';
import { GetCurrentUserId } from '../../auth/decorators';
import { AtGuard } from '../../auth/guards';
import { AdminGuard } from '../../common/authz/admin.guard';
import {
  AdminPublicAttemptDetailResponseDto,
  AdminPublicAttemptsListQueryDto,
  AdminPublicAttemptsListResponseDto,
} from '../dto/tests-links.dto';
import { TestsAdminAttemptService } from '../attempts/admin-attempt.service';
import { ApiErrorResponses } from '../../common/decorators/api-error-responses.decorator';
import { TestsAttemptsExportService } from './attempts-export.service';

const XLSX_CONTENT_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@ApiTags('tests')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard, AdminGuard)
@Controller('admin/tests')
export class TestsAdminAttemptsController {
  constructor(
    private readonly testsAdminAttemptService: TestsAdminAttemptService,
    private readonly attemptsExportService: TestsAttemptsExportService,
    private readonly auditService: AuditService,
  ) {}

  @Get('public-links/:linkId/attempts')
  @ApiOperation({ summary: 'List student attempts by public link' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicAttemptsListResponseDto })
  listPublicLinkAttempts(
    @Param('linkId', ParseIntPipe) linkId: number,
    @Query() query: AdminPublicAttemptsListQueryDto,
  ) {
    return this.testsAdminAttemptService.listAttemptsForLink(linkId, query);
  }

  @Get('public-links/:linkId/attempts/export.xlsx')
  @ApiOperation({ summary: 'Export student attempts of a public link in XLSX' })
  @ApiProduces(XLSX_CONTENT_TYPE)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Excel list of attempts with the same search, status and sort as the table',
    content: { [XLSX_CONTENT_TYPE]: { schema: { type: 'string', format: 'binary' } } },
  })
  async exportPublicLinkAttempts(
    @GetCurrentUserId() userId: number,
    @Param('linkId', ParseIntPipe) linkId: number,
    @Query() query: AdminPublicAttemptsListQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { shortCode, attempts, truncated } =
      await this.testsAdminAttemptService.listAttemptsForExport(linkId, query);
    const dateStr = new Date().toISOString().slice(0, 10);
    const disposition = `attachment; filename="attempts-${shortCode}-${dateStr}.xlsx"`;

    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
    res.setHeader('Content-Disposition', disposition);

    const file = new StreamableFile(
      await this.attemptsExportService.toExcel(attempts, shortCode, query.timeZone, truncated),
      {
        type: XLSX_CONTENT_TYPE,
        disposition,
      },
    );

    // Выгрузка отдает ПДн учеников: фиксируем, кто и сколько строк забрал.
    await this.auditService.record({
      entityType: 'PUBLIC_LINK',
      entityId: linkId,
      action: 'ATTEMPTS_EXPORTED',
      actorUserId: userId,
      changes: [{ field: 'rows', before: null, after: String(attempts.length) }],
    });

    return file;
  }

  @Get('attempts/:attemptId')
  @ApiOperation({ summary: 'Get student attempt details with answers and analysis' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminPublicAttemptDetailResponseDto })
  getAttemptDetail(@Param('attemptId', ParseIntPipe) attemptId: number) {
    return this.testsAdminAttemptService.getAttemptDetail(attemptId);
  }
}
