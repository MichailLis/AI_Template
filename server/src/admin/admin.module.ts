import { Module } from '@nestjs/common';
import { ProfessionAtlasClientService } from '../app-settings/profession-atlas-client.service';
import { AuditModule } from '../audit/audit.module';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { ProfOrientationAtlasService } from '../tests/prof-orientation-v3-plus/atlas';
import { BackupsModule } from '../backups/backups.module';
import {
  AdminBackupDownloadController,
  AdminBackupOperationController,
  AdminBackupsController,
} from './admin-backups.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [AiProviderModule, AuditModule, BackupsModule],
  controllers: [
    AdminController,
    AdminSettingsController,
    AdminBackupsController,
    AdminBackupOperationController,
    AdminBackupDownloadController,
  ],
  providers: [
    AdminService,
    ProfessionAtlasSettingsService,
    PrivacyPolicySettingsService,
    ProfessionAtlasClientService,
    ProfOrientationAtlasService,
  ],
})
export class AdminModule {}
