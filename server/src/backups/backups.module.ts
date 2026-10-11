import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { BackupScheduler } from './backup-scheduler';
import { BackupSettingsService } from './backup-settings.service';
import { BackupStorage } from './backup-storage';
import { BackupsService } from './backups.service';
import { PgToolsRunner } from './pg-tools.runner';

/**
 * Резервные копии базы. Интеграционный модуль: маршруты отдает админка (`admin/backups`),
 * а здесь живут запуск `pg_dump`, хранение файлов в томе, ротация и расписание.
 */
@Module({
  imports: [AuditModule],
  providers: [BackupsService, BackupSettingsService, BackupScheduler, BackupStorage, PgToolsRunner],
  exports: [BackupsService, BackupSettingsService],
})
export class BackupsModule {}
