import { Module } from '@nestjs/common';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AnalysisPromptsController } from './analysis-prompts.controller';
import { AnalysisPromptsService } from './analysis-prompts.service';

@Module({
  imports: [OpenRouterModule],
  controllers: [AdminController, AdminSettingsController, AnalysisPromptsController],
  providers: [AdminService, AnalysisPromptsService],
})
export class AdminModule {}
