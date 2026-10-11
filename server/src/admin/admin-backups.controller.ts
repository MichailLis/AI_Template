import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiProduces,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { GetCurrentUserId } from '../auth/decorators';
import { AtGuard } from '../auth/guards';
import { BackupImportService } from '../backups/backup-import.service';
import { BackupRestoreService } from '../backups/backup-restore.service';
import { BackupSettingsService } from '../backups/backup-settings.service';
import { BackupsService } from '../backups/backups.service';
import {
  ApiErrorResponses,
  ApiPublicErrorResponses,
} from '../common/decorators/api-error-responses.decorator';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import {
  AdminBackupDeleteResponseDto,
  AdminBackupDownloadLinkResponseDto,
  AdminBackupOperationResponseDto,
  AdminBackupResponseDto,
  AdminBackupSettingsResponseDto,
  AdminBackupsOverviewResponseDto,
  AdminRestoreStartResponseDto,
  RestoreBackupDto,
  UpdateBackupSettingsDto,
} from './dto/admin-backups.dto';

const DUMP_CONTENT_TYPE = 'application/octet-stream';

@ApiTags('admin')
@ApiBearerAuth()
@ApiErrorResponses()
@UseGuards(AtGuard)
@Controller('admin/backups')
export class AdminBackupsController {
  constructor(
    private readonly backupsService: BackupsService,
    private readonly backupSettingsService: BackupSettingsService,
    private readonly backupRestoreService: BackupRestoreService,
    private readonly backupImportService: BackupImportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List database backups and check whether backups are available' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminBackupsOverviewResponseDto })
  getOverview(@GetCurrentUserId() userId: number) {
    return this.backupsService.getOverview(userId);
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Start a database backup in the background' })
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: AdminBackupResponseDto })
  createBackup(@GetCurrentUserId() userId: number) {
    return this.backupsService.createBackup(userId);
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update the backup schedule and retention' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminBackupSettingsResponseDto })
  async updateSettings(@GetCurrentUserId() userId: number, @Body() dto: UpdateBackupSettingsDto) {
    return { settings: await this.backupSettingsService.updateSettings(userId, dto) };
  }

  /**
   * Дамп приходит телом запроса как есть (application/octet-stream), без multipart: файл пишется
   * на диск потоком, а исходное имя передается параметром.
   */
  @Post('import')
  @ApiOperation({ summary: 'Upload a pg_dump custom-format file as a backup' })
  @ApiConsumes(DUMP_CONTENT_TYPE)
  @ApiBody({ schema: { type: 'string', format: 'binary' } })
  @ApiQuery({ name: 'fileName', required: false, type: String })
  @ApiResponse({ status: HttpStatus.CREATED, type: AdminBackupResponseDto })
  @ApiResponse({ status: HttpStatus.PAYLOAD_TOO_LARGE, type: ErrorResponseDto })
  importBackup(
    @GetCurrentUserId() userId: number,
    @Req() request: Request,
    @Query('fileName') fileName?: string,
  ) {
    const declaredLength = Number(request.headers['content-length']);

    return this.backupImportService.importBackup(
      userId,
      request,
      Number.isFinite(declaredLength) ? declaredLength : undefined,
      fileName,
    );
  }

  @Get('operation')
  @ApiOperation({ summary: 'Get the state of a database restore (works during maintenance)' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminBackupOperationResponseDto })
  getOperation(@GetCurrentUserId() userId: number) {
    return this.backupRestoreService.getStatus(userId);
  }

  @Post('restore/undo')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Bring back the database that was replaced by the last restore' })
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: AdminRestoreStartResponseDto })
  undoRestore(@GetCurrentUserId() userId: number) {
    return this.backupRestoreService.startUndo(userId);
  }

  @Post(':id/restore')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Restore the database from a backup on the server' })
  @ApiResponse({ status: HttpStatus.ACCEPTED, type: AdminRestoreStartResponseDto })
  restoreBackup(
    @GetCurrentUserId() userId: number,
    @Param('id') id: string,
    @Body() dto: RestoreBackupDto,
  ) {
    return this.backupRestoreService.startRestore(userId, id, dto.confirmation);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a database backup' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminBackupDeleteResponseDto })
  deleteBackup(@GetCurrentUserId() userId: number, @Param('id') id: string) {
    return this.backupsService.deleteBackup(userId, id);
  }

  @Post(':id/download-link')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Issue a one-time link to download a database backup' })
  @ApiResponse({ status: HttpStatus.OK, type: AdminBackupDownloadLinkResponseDto })
  createDownloadLink(@GetCurrentUserId() userId: number, @Param('id') id: string) {
    return this.backupsService.createDownloadLink(userId, id);
  }
}

/**
 * Скачивание идет обычной ссылкой браузера, без заголовка авторизации: доступ дает одноразовый
 * токен из `download-link`, поэтому маршрут вынесен из-под `AtGuard`.
 */
@ApiTags('admin')
@ApiPublicErrorResponses()
@Controller('admin/backups/download')
export class AdminBackupDownloadController {
  constructor(private readonly backupsService: BackupsService) {}

  @Get(':token')
  @ApiOperation({ summary: 'Download a database backup by a one-time link' })
  @ApiProduces(DUMP_CONTENT_TYPE)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'PostgreSQL custom-format dump',
    content: { [DUMP_CONTENT_TYPE]: { schema: { type: 'string', format: 'binary' } } },
  })
  async download(@Param('token') token: string, @Res({ passthrough: true }) res: Response) {
    const file = await this.backupsService.openDownload(token);
    const disposition = `attachment; filename="${file.fileName}"`;

    res.setHeader('Content-Type', DUMP_CONTENT_TYPE);
    res.setHeader('Content-Disposition', disposition);
    res.setHeader('Cache-Control', 'no-store');

    return new StreamableFile(file.stream, {
      type: DUMP_CONTENT_TYPE,
      disposition,
      length: file.sizeBytes ?? undefined,
    });
  }
}
