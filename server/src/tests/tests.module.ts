import { Module } from '@nestjs/common';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { TestsQuestionService } from './tests-question.service';

@Module({
  controllers: [TestsController],
  providers: [TestsService, TestsQuestionService],
})
export class TestsModule {}
