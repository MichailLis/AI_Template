import { ConfigService } from '@nestjs/config';

import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { PrismaService } from '../prisma.service';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsPublicLinkService } from './tests-public-link.service';
import { TestsPublicSessionService } from './tests-public-session.service';

describe('TestsPublicSessionService read paths', () => {
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
        shortCode: 'ABC123',
        timeLimitMinutes: 30,
      },
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      startedAt: new Date('2026-05-12T11:30:00.000Z'),
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      finishedAt: null,
      topicVersion: {
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
    );
    const service = new TestsPublicSessionService(
      prismaMock,
      {} as TestsPublicLinkService,
      analysisService,
      {
        getProfessionAtlasUrl: jest.fn().mockResolvedValue(null),
      } as unknown as ProfessionAtlasSettingsService,
    );

    const result = await service.getSessionByToken('session-token');

    expect(result.session.status).toBe('EXPIRED');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('getSessionResult returns expired sessions as terminal results without pending analysis', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const attempt = {
      id: 5,
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      finishedAt: null,
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
    );
    const service = new TestsPublicSessionService(
      prismaMock,
      {} as TestsPublicLinkService,
      analysisService,
      {
        getProfessionAtlasUrl: jest.fn().mockResolvedValue(null),
      } as unknown as ProfessionAtlasSettingsService,
    );

    const result = await service.getSessionResult('session-token');

    expect(result.status).toBe('EXPIRED');
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
    );
    const service = new TestsPublicSessionService(
      prismaMock,
      {} as TestsPublicLinkService,
      analysisService,
      new ProfessionAtlasSettingsService(prismaMock),
    );

    const result = await service.getSessionResult('session-token');

    expect(result).toMatchObject({
      professionAtlasUrl: 'https://atlas.example/professions',
    });
  });
});
