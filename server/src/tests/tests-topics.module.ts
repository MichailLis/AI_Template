import { Module } from '@nestjs/common';

import { TestsController } from './tests.controller';
import { TestsQuestionService } from './tests-question.service';
import { TestsService } from './tests.service';

@Module({
  controllers: [TestsController],
  providers: [TestsService, TestsQuestionService],
  exports: [TestsService, TestsQuestionService],
})
export class TestsTopicsModule {}
