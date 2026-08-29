import { Module } from '@nestjs/common';

import { TestsPromptSimulationReadService } from '../analysis/prompt-simulation-read.service';

@Module({
  providers: [TestsPromptSimulationReadService],
  exports: [TestsPromptSimulationReadService],
})
export class TestsPromptSimulationReadModule {}
