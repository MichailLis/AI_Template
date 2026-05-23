import { Module } from '@nestjs/common';

import { TestsPromptSimulationReadService } from './tests-prompt-simulation-read.service';

@Module({
  providers: [TestsPromptSimulationReadService],
  exports: [TestsPromptSimulationReadService],
})
export class TestsPromptSimulationReadModule {}
