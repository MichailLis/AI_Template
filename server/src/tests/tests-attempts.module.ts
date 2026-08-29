import { Module } from '@nestjs/common';

import { ProfessionAtlasClientService } from '../app-settings/profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { ProfOrientationAtlasService } from './prof-orientation-v3-plus/atlas';
import { TestsAdminAnalyticsController } from './tests-admin-analytics.controller';
import { TestsAdminAttemptService } from './tests-admin-attempt.service';
import { TestsAdminAttemptsController } from './tests-admin-attempts.controller';
import { TestsAnalyticsExportService } from './tests-analytics-export.service';
import { TestsAnalyticsPdfRendererService } from './tests-analytics-pdf-renderer.service';
import { TestsAnalyticsService } from './tests-analytics.service';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsPublicController } from './tests-public.controller';
import { TestsPublicLinksModule } from './tests-public-links.module';
import { TestsPublicSessionService } from './tests-public-session.service';

@Module({
  imports: [OpenRouterModule, TestsPublicLinksModule],
  controllers: [TestsPublicController, TestsAdminAttemptsController, TestsAdminAnalyticsController],
  providers: [
    TestsAnalyticsService,
    TestsAnalyticsExportService,
    TestsAnalyticsPdfRendererService,
    TestsAnalysisService,
    TestsPublicSessionService,
    TestsAdminAttemptService,
    PrivacyPolicySettingsService,
    ProfessionAtlasSettingsService,
    ProfessionAtlasClientService,
    ProfOrientationAtlasService,
  ],
  exports: [
    TestsAnalyticsService,
    TestsAnalyticsExportService,
    TestsAnalysisService,
    TestsPublicSessionService,
    TestsAdminAttemptService,
  ],
})
export class TestsAttemptsModule {}
