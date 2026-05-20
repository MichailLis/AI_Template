import { Module } from '@nestjs/common';

import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { TestsAdminAnalyticsController } from './tests-admin-analytics.controller';
import { TestsAdminAttemptService } from './tests-admin-attempt.service';
import { TestsAdminAttemptsController } from './tests-admin-attempts.controller';
import { TestsAnalyticsExportService } from './tests-analytics-export.service';
import { TestsAnalyticsService } from './tests-analytics.service';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsAttemptService } from './tests-attempt.service';
import { TestsPublicController } from './tests-public.controller';
import { TestsPublicLinksModule } from './tests-public-links.module';
import { TestsPublicSessionService } from './tests-public-session.service';

@Module({
  imports: [OpenRouterModule, TestsPublicLinksModule],
  controllers: [TestsPublicController, TestsAdminAttemptsController, TestsAdminAnalyticsController],
  providers: [
    TestsAnalyticsService,
    TestsAnalyticsExportService,
    TestsAnalysisService,
    TestsPublicSessionService,
    TestsAdminAttemptService,
    TestsAttemptService,
    ProfessionAtlasSettingsService,
  ],
  exports: [
    TestsAnalyticsService,
    TestsAnalyticsExportService,
    TestsAnalysisService,
    TestsPublicSessionService,
    TestsAdminAttemptService,
    TestsAttemptService,
  ],
})
export class TestsAttemptsModule {}
