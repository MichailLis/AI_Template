import { Module } from '@nestjs/common';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AnalysisPromptsController } from './analysis-prompts.controller';
import { AnalysisPromptsService } from './analysis-prompts.service';

@Module({
  imports: [OpenRouterModule],
  controllers: [AdminController, AdminSettingsController, AnalysisPromptsController],
  providers: [AdminService, AnalysisPromptsService, ProfessionAtlasSettingsService],
})
export class AdminModule {}
