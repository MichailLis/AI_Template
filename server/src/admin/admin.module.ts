import { Module } from '@nestjs/common';
import { ProfessionAtlasClientService } from '../app-settings/profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { ProfOrientationAtlasService } from '../tests/prof-orientation-v3-plus.atlas';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [OpenRouterModule],
  controllers: [AdminController, AdminSettingsController],
  providers: [
    AdminService,
    ProfessionAtlasSettingsService,
    PrivacyPolicySettingsService,
    ProfessionAtlasClientService,
    ProfOrientationAtlasService,
  ],
})
export class AdminModule {}
