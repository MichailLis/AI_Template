import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AnalysisPromptsController } from './analysis-prompts.controller';
import { AnalysisPromptsService } from './analysis-prompts.service';

@Module({
  controllers: [AdminController, AnalysisPromptsController],
  providers: [AdminService, AnalysisPromptsService],
})
export class AdminModule {}
