import { Module } from '@nestjs/common';

import { AuditModule } from '../audit/audit.module';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { TestsPromptSimulationReadModule } from '../tests/analysis/prompt-simulation-read.module';
import { AnalysisPromptsController } from './analysis-prompts.controller';
import { AnalysisPromptsService } from './analysis-prompts.service';

@Module({
  imports: [AiProviderModule, TestsPromptSimulationReadModule, AuditModule],
  controllers: [AnalysisPromptsController],
  providers: [AnalysisPromptsService],
})
export class AnalysisPromptsModule {}
