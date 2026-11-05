import { Module } from '@nestjs/common';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { AuditModule } from '../audit/audit.module';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { ProfOrientationAtlasModule } from '../tests/prof-orientation-v3-plus/atlas.module';
import { BackupsModule } from '../backups/backups.module';
import {
  AdminBackupDownloadController,
  AdminBackupOperationController,
  AdminBackupsController,
} from './admin-backups.controller';
import { AdminAiUsageController } from './admin-ai-usage.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    AiProviderModule,
    AppSettingsModule,
    AuditModule,
    BackupsModule,
    ProfOrientationAtlasModule,
  ],
  controllers: [
    AdminController,
    AdminSettingsController,
    AdminAiUsageController,
    AdminBackupsController,
    AdminBackupOperationController,
    AdminBackupDownloadController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
