import { Module } from '@nestjs/common';

import { OpenRouterModule } from '../openrouter/openrouter.module';
import { TestsPromptSimulationReadModule } from '../tests/tests-prompt-simulation-read.module';
import { AnalysisPromptsController } from './analysis-prompts.controller';
import { AnalysisPromptsService } from './analysis-prompts.service';

@Module({
  imports: [OpenRouterModule, TestsPromptSimulationReadModule],
  controllers: [AnalysisPromptsController],
  providers: [AnalysisPromptsService],
})
export class AnalysisPromptsModule {}
