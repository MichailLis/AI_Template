import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { TestsPromptSimulationReadModule } from '../tests/analysis/prompt-simulation-read.module';
import { AnalysisPromptsController } from './analysis-prompts.controller';
import { AnalysisPromptsService } from './analysis-prompts.service';

@Module({
  imports: [OpenRouterModule, TestsPromptSimulationReadModule, AuditModule],
  controllers: [AnalysisPromptsController],
  providers: [AnalysisPromptsService],
})
export class AnalysisPromptsModule {}
