import { Module } from '@nestjs/common';

import { AuditModule } from '../../audit/audit.module';
import { TestsController } from '../topics/topics.controller';
import { TestsQuestionService } from '../topics/question.service';
import { TestsService } from '../topics/topics.service';

@Module({
  imports: [AuditModule],
  controllers: [TestsController],
  providers: [TestsService, TestsQuestionService],
  exports: [TestsService, TestsQuestionService],
})
export class TestsTopicsModule {}
