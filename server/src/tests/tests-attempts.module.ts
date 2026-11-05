import { Module } from '@nestjs/common';

import { AppSettingsModule } from '../app-settings/app-settings.module';
import { AuditModule } from '../audit/audit.module';
import { AiProviderModule } from '../ai-provider/ai-provider.module';
import { ProfOrientationAtlasModule } from './prof-orientation-v3-plus/atlas.module';
import { TestsAdminAnalyticsController } from './reporting/admin-analytics.controller';
import { TestsAdminAttemptService } from './attempts/admin-attempt.service';
import { TestsAdminAttemptsController } from './attempts/admin-attempts.controller';
import { TestsAttemptsExportService } from './attempts/attempts-export.service';
import { TestsAnalyticsExportService } from './reporting/analytics-export.service';
import { TestsAnalyticsPdfRendererService } from './reporting/analytics-pdf-renderer.service';
import { TestsAnalyticsService } from './reporting/analytics.service';
import { TestsAnalysisService } from './analysis/analysis.service';
import { TestsPublicController } from './session/public.controller';
import { TestsPublicLinksModule } from './public-links/public-links.module';
import { TestsPublicAttemptAllocationService } from './session/attempt-allocation.service';
import { TestsPublicSessionService } from './session/public-session.service';
import { PublicRateLimitBuckets, PublicRateLimitGuard } from './session/public-rate-limit.guard';

@Module({
  imports: [
    AiProviderModule,
    AppSettingsModule,
    AuditModule,
    ProfOrientationAtlasModule,
    TestsPublicLinksModule,
  ],
  controllers: [TestsPublicController, TestsAdminAttemptsController, TestsAdminAnalyticsController],
  providers: [
    TestsAnalyticsService,
    TestsAnalyticsExportService,
    TestsAnalyticsPdfRendererService,
    TestsAnalysisService,
    TestsPublicSessionService,
    TestsPublicAttemptAllocationService,
    TestsAdminAttemptService,
    TestsAttemptsExportService,
    PublicRateLimitBuckets,
    PublicRateLimitGuard,
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
