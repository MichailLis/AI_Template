import { Module } from '@nestjs/common';

import { TestsAdminAttemptService } from './tests-admin-attempt.service';
import { TestsAdminAttemptsController } from './tests-admin-attempts.controller';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsAttemptService } from './tests-attempt.service';
import { TestsPublicController } from './tests-public.controller';
import { TestsPublicLinksModule } from './tests-public-links.module';
import { TestsPublicSessionService } from './tests-public-session.service';

@Module({
  imports: [TestsPublicLinksModule],
  controllers: [TestsPublicController, TestsAdminAttemptsController],
  providers: [
    TestsAnalysisService,
    TestsPublicSessionService,
    TestsAdminAttemptService,
    TestsAttemptService,
  ],
  exports: [
    TestsAnalysisService,
    TestsPublicSessionService,
    TestsAdminAttemptService,
    TestsAttemptService,
  ],
})
export class TestsAttemptsModule {}
