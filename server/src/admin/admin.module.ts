import { Module } from '@nestjs/common';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [OpenRouterModule],
  controllers: [AdminController, AdminSettingsController],
  providers: [AdminService, ProfessionAtlasSettingsService],
})
export class AdminModule {}
