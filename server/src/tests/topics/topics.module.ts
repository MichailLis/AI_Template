import { Module } from '@nestjs/common';

import { TestsController } from '../topics/topics.controller';
import { TestsQuestionService } from '../topics/question.service';
import { TestsService } from '../topics/topics.service';

@Module({
  controllers: [TestsController],
  providers: [TestsService, TestsQuestionService],
  exports: [TestsService, TestsQuestionService],
})
export class TestsTopicsModule {}
