import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { BackupRestoreService } from './backup-restore.service';
import { BackupScheduler } from './backup-scheduler';
import { BackupSettingsService } from './backup-settings.service';
import { BackupStorage } from './backup-storage';
import { BackupsService } from './backups.service';
import { DatabaseAdmin } from './database-admin';
import { MaintenanceMiddleware } from './maintenance.middleware';
import { MaintenanceState } from './maintenance-state';
import { PgToolsRunner } from './pg-tools.runner';

/**
 * Резервные копии базы. Интеграционный модуль: маршруты отдает админка (`admin/backups`),
 * а здесь живут запуск `pg_dump`, хранение файлов в томе, ротация, расписание и восстановление.
 * Режим обслуживания на время восстановления закрывает все маршруты приложения.
 */
@Module({
  imports: [AuditModule],
  providers: [
    BackupsService,
    BackupSettingsService,
    BackupRestoreService,
    BackupScheduler,
    BackupStorage,
    DatabaseAdmin,
    MaintenanceState,
    PgToolsRunner,
  ],
  exports: [BackupsService, BackupSettingsService, BackupRestoreService],
})
export class BackupsModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(MaintenanceMiddleware).forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
