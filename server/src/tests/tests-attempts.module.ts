import { Module } from '@nestjs/common';

import { ProfessionAtlasClientService } from '../app-settings/profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { OpenRouterModule } from '../openrouter/openrouter.module';
import { ProfOrientationAtlasService } from './prof-orientation-v3-plus/atlas';
import { TestsAdminAnalyticsController } from './reporting/admin-analytics.controller';
import { TestsAdminAttemptService } from './attempts/admin-attempt.service';
import { TestsAdminAttemptsController } from './attempts/admin-attempts.controller';
import { TestsAnalyticsExportService } from './reporting/analytics-export.service';
import { TestsAnalyticsPdfRendererService } from './reporting/analytics-pdf-renderer.service';
import { TestsAnalyticsService } from './reporting/analytics.service';
import { TestsAnalysisService } from './analysis/analysis.service';
import { TestsPublicController } from './session/public.controller';
import { TestsPublicLinksModule } from './public-links/public-links.module';
import { TestsPublicAttemptAllocationService } from './session/attempt-allocation.service';
import { TestsPublicSessionService } from './session/public-session.service';

@Module({
  imports: [OpenRouterModule, TestsPublicLinksModule],
  controllers: [TestsPublicController, TestsAdminAttemptsController, TestsAdminAnalyticsController],
  providers: [
    TestsAnalyticsService,
    TestsAnalyticsExportService,
    TestsAnalyticsPdfRendererService,
    TestsAnalysisService,
    TestsPublicSessionService,
    TestsPublicAttemptAllocationService,
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
