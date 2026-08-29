import { ConfigService } from '@nestjs/config';

import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { ProfessionAtlasSettingsService } from '../../app-settings/profession-atlas-settings.service';
import { OpenRouterApiKeyService } from '../../openrouter/openrouter-api-key.service';
import { OpenRouterClientService } from '../../openrouter/openrouter.client';
import { PrismaService } from '../../prisma.service';
import { ProfOrientationAtlasService } from '../prof-orientation-v3-plus/atlas';
import { TestsAnalysisService } from '../analysis/analysis.service';
import { TestsPublicLinkService } from '../public-links/public-link.service';
import { TestsPublicAttemptAllocationService } from '../session/attempt-allocation.service';
import { TestsPublicSessionService } from '../session/public-session.service';

describe('TestsPublicSessionService read paths', () => {
  const accessiblePublicLinkState = {
    isActive: true,
    archivedAt: null,
    startsAt: null,
    endsAt: null,
  };
  const publishedTopicVersionState = {
    status: 'PUBLISHED',
  };
  const publicBranding = {
    version: 1,
    buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
    accents: { accentColor: '#00a889' },
  };

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('getSessionByToken reports expired status without mutating the attempt', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const attempt = {
      id: 5,
      resumeToken: 'session-token',
      publicLink: {
        ...accessiblePublicLinkState,
        shortCode: 'ABC123',
        publicTemplate: 'POLUS',
        publicBranding,
        timeLimitMinutes: 30,
      },
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      startedAt: new Date('2026-05-12T11:30:00.000Z'),
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      finishedAt: null,
      topicVersion: {
        ...publishedTopicVersionState,
        questions: [],
      },
      answers: [],
      analysis: null,
    };
    const findUniqueMock = jest.fn().mockResolvedValue(attempt);
    const updateMock = jest.fn().mockResolvedValue({
      ...attempt,
      status: 'EXPIRED',
      finishedAt: new Date('2026-05-12T12:00:00.000Z'),
    });
    const prismaMock = {
      testStudentAttempt: {
        findUnique: findUniqueMock,
        update: updateMock,
      },
    } as unknown as PrismaService;
    const analysisService = new TestsAnalysisService(
      prismaMock,
      {} as ConfigService,
      {} as OpenRouterApiKeyService,
      {} as OpenRouterClientService,
    );
    const service = new TestsPublicSessionService(
      prismaMock,
      {} as TestsPublicLinkService,
      analysisService,
      {} as PrivacyPolicySettingsService,
      {
        getProfessionAtlasUrl: jest.fn().mockResolvedValue(null),
      } as unknown as ProfessionAtlasSettingsService,
      {
        saveEnrichedAnalysis: jest.fn(),
      } as unknown as ProfOrientationAtlasService,
      // These cases only read an existing session; nothing here allocates an attempt.
      {} as TestsPublicAttemptAllocationService,
    );

    const result = await service.getSessionByToken('session-token');

    expect(result.session.status).toBe('EXPIRED');
    expect(result.session.publicTemplate).toBe('POLUS');
    expect(result.session.publicBranding).toEqual(publicBranding);
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('getSessionResult returns expired sessions as terminal results without pending analysis', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const attempt = {
      id: 5,
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      finishedAt: null,
      publicLink: {
        ...accessiblePublicLinkState,
        publicTemplate: 'POLUS',
        publicBranding,
      },
      topicVersion: publishedTopicVersionState,
      analysis: null,
    };
    const findUniqueMock = jest.fn().mockResolvedValue(attempt);
    const updateMock = jest.fn();
    const prismaMock = {
      testStudentAttempt: {
        findUnique: findUniqueMock,
        update: updateMock,
      },
    } as unknown as PrismaService;
    const analysisService = new TestsAnalysisService(
      prismaMock,
      {} as ConfigService,
      {} as OpenRouterApiKeyService,
      {} as OpenRouterClientService,
    );
    const service = new TestsPublicSessionService(
      prismaMock,
      {} as TestsPublicLinkService,
      analysisService,
      {} as PrivacyPolicySettingsService,
      {
        getProfessionAtlasUrl: jest.fn().mockResolvedValue(null),
      } as unknown as ProfessionAtlasSettingsService,
      {
        saveEnrichedAnalysis: jest.fn(),
      } as unknown as ProfOrientationAtlasService,
      // These cases only read an existing session; nothing here allocates an attempt.
      {} as TestsPublicAttemptAllocationService,
    );

    const result = await service.getSessionResult('session-token');

    expect(result.status).toBe('EXPIRED');
    expect(result.publicTemplate).toBe('POLUS');
    expect(result.publicBranding).toEqual(publicBranding);
    expect(result.analysis.status).toBe('FAILED');
    expect(result.analysis.errorMessage).toBe('Test session expired before completion');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('getSessionResult includes the configured profession atlas URL', async () => {
    const attempt = {
      id: 5,
      status: 'COMPLETED',
      expiresAt: null,
      finishedAt: new Date('2026-05-12T12:00:00.000Z'),
      publicLink: {
        ...accessiblePublicLinkState,
        publicTemplate: 'POLUS',
        publicBranding,
      },
      topicVersion: publishedTopicVersionState,
      analysis: {
        providerMode: 'STUB',
        status: 'READY',
        summary: null,
        rawText: null,
        errorMessage: null,
        generatedAt: new Date('2026-05-12T12:00:01.000Z'),
      },
    };
    const prismaMock = {
      appSetting: {
        findUnique: jest.fn().mockResolvedValue({
          key: 'professionAtlas.url',
          value: ' https://atlas.example/professions ',
          updatedAt: new Date('2026-05-12T10:00:00.000Z'),
        }),
      },
      testStudentAttempt: {
        findUnique: jest.fn().mockResolvedValue(attempt),
      },
    } as unknown as PrismaService;
    const analysisService = new TestsAnalysisService(
      prismaMock,
      {} as ConfigService,
      {} as OpenRouterApiKeyService,
      {} as OpenRouterClientService,
    );
    const service = new TestsPublicSessionService(
      prismaMock,
      {} as TestsPublicLinkService,
      analysisService,
      {} as PrivacyPolicySettingsService,
      new ProfessionAtlasSettingsService(prismaMock),
      {
        saveEnrichedAnalysis: jest.fn(),
      } as unknown as ProfOrientationAtlasService,
      // These cases only read an existing session; nothing here allocates an attempt.
      {} as TestsPublicAttemptAllocationService,
    );

    const result = await service.getSessionResult('session-token');

    expect(result).toMatchObject({
      publicTemplate: 'POLUS',
      publicBranding,
      professionAtlasUrl: 'https://atlas.example/professions',
    });
  });
});
