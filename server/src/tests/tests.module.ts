import { Module } from '@nestjs/common';

import { TestsAttemptService } from './tests-attempt.service';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsService } from './tests.service';
import { TestsController } from './tests.controller';
import { TestsPublicController } from './tests-public.controller';
import { TestsPublicLinkService } from './tests-public-link.service';
import { TestsQuestionService } from './tests-question.service';

@Module({
  controllers: [TestsController, TestsPublicController],
  providers: [
    TestsService,
    TestsQuestionService,
    TestsPublicLinkService,
    TestsAttemptService,
    TestsAnalysisService,
  ],
})
export class TestsModule {}
