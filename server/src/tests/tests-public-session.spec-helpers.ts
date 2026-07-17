import { ConfigService } from '@nestjs/config';

import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { OpenRouterClientService } from '../openrouter/openrouter.client';
import { PrismaService } from '../prisma.service';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsPublicAttemptAllocationService } from './tests-public-attempt-allocation.service';

type ActivePolicySnapshotGetter = PrivacyPolicySettingsService['getActivePolicySnapshot'];

export const createAttemptAllocator = (
  prisma: unknown,
  getActivePolicySnapshot: ActivePolicySnapshotGetter,
) =>
  new TestsPublicAttemptAllocationService(
    prisma as PrismaService,
    {
      getActivePolicySnapshot,
    } as PrivacyPolicySettingsService,
  );

export const createTestsAnalysisService = (prisma: unknown) =>
  new TestsAnalysisService(
    prisma as PrismaService,
    {} as ConfigService,
    {} as OpenRouterApiKeyService,
    {} as OpenRouterClientService,
  );
