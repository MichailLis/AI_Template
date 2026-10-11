import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { BackupStorage } from './backup-storage';
import { BackupsService } from './backups.service';
import { PgToolsRunner } from './pg-tools.runner';

/**
 * Резервные копии базы. Интеграционный модуль: маршруты отдает админка (`admin/backups`),
 * а здесь живут запуск `pg_dump`, хранение файлов в томе и ротация.
 */
@Module({
  imports: [AuditModule],
  providers: [BackupsService, BackupStorage, PgToolsRunner],
  exports: [BackupsService],
})
export class BackupsModule {}
