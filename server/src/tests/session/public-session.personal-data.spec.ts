import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { ProfessionAtlasSettingsService } from '../../app-settings/profession-atlas-settings.service';
import { PrismaService } from '../../prisma.service';
import { ProfOrientationAtlasService } from '../prof-orientation-v3-plus/atlas';
import { TestsAnalysisService } from '../analysis/analysis.service';
import { TestsPublicLinkService } from '../public-links/public-link.service';
import { TestsPublicSessionService } from '../session/public-session.service';
import {
  createAccessibleLinkFixture,
  createPublicSessionStartDto,
  createPublicSessionStateResponse,
  type AccessibleLinkFixture,
} from '../session/spec-fixtures';

type AttemptHistoryItem = {
  id: number;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
  resumeToken: string;
  expiresAt: Date | null;
};

type AttemptCreateInput = {
  data: Record<string, unknown>;
  [key: string]: unknown;
};

describe('TestsPublicSessionService personal-data snapshots', () => {
  let service: TestsPublicSessionService;
  let updateManyMock: jest.Mock<Promise<{ count: number }>, [Record<string, unknown>]>;
  let findManyMock: jest.Mock<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>;
  let createAttemptMock: jest.Mock<Promise<{ resumeToken: string }>, [AttemptCreateInput]>;
  let getAccessiblePublicLinkByCodeMock: jest.Mock<Promise<AccessibleLinkFixture>, [string]>;

  beforeEach(() => {
    updateManyMock = jest.fn<Promise<{ count: number }>, [Record<string, unknown>]>();
    findManyMock = jest.fn<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>();
    createAttemptMock = jest.fn<Promise<{ resumeToken: string }>, [AttemptCreateInput]>();
    getAccessiblePublicLinkByCodeMock = jest.fn<Promise<AccessibleLinkFixture>, [string]>();

    const transactionClient = {
      testStudentAttempt: {
        updateMany: updateManyMock,
        findMany: findManyMock,
        create: createAttemptMock,
      },
    };
    const prismaMock = {
      $transaction: jest.fn((callback: (tx: typeof transactionClient) => unknown) =>
        callback(transactionClient),
      ),
    };

    service = new TestsPublicSessionService(
      prismaMock as unknown as PrismaService,
      {
        getAccessiblePublicLinkByCode: getAccessiblePublicLinkByCodeMock,
      } as unknown as TestsPublicLinkService,
      {} as TestsAnalysisService,
      {
        getActivePolicySnapshot: jest.fn().mockResolvedValue({
          version: '2026-07-09',
          publishedAt: new Date('2026-07-09T00:00:00.000Z'),
          content: 'Политика',
        }),
      } as unknown as PrivacyPolicySettingsService,
      {} as ProfessionAtlasSettingsService,
      {} as ProfOrientationAtlasService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('startSessionByCode copies the immutable on-behalf operator snapshot to a new attempt', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        educationOrganizationId: 42,
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        operatorFullNameSnapshot: 'Историческое полное имя школы',
        operatorShortNameSnapshot: 'Историческое имя',
        operatorPrivacyPolicyUrlSnapshot: 'https://old.example/privacy',
        operatorConsentDocumentUrlSnapshot: 'https://old.example/consent',
      }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([]);
    createAttemptMock.mockResolvedValue({ resumeToken: 'resume-operator' });
    jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-operator'));

    await service.startSessionByCode('ABC123', createPublicSessionStartDto());

    expect(createAttemptMock.mock.calls[0]?.[0].data).toEqual(
      expect.objectContaining({
        operatorEducationOrganizationId: 42,
        operatorFullNameSnapshot: 'Историческое полное имя школы',
        operatorShortNameSnapshot: 'Историческое имя',
        operatorPrivacyPolicyUrlSnapshot: 'https://old.example/privacy',
        operatorConsentDocumentUrlSnapshot: 'https://old.example/consent',
        consentVersion: 'v1',
        consentTextSnapshot: 'consent',
        policyVersionSnapshot: '2026-07-09',
        policyPublishedAtSnapshot: new Date('2026-07-09T00:00:00.000Z'),
      }),
    );
  });

  it('startSessionByCode uses platform fallbacks and no operator FK for a legacy PUBLIC link', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        educationOrganizationId: 42,
        personalDataProcessingMode: 'PUBLIC',
        operatorFullNameSnapshot: null,
        operatorShortNameSnapshot: null,
        operatorPrivacyPolicyUrlSnapshot: null,
        operatorConsentDocumentUrlSnapshot: null,
      }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([]);
    createAttemptMock.mockResolvedValue({ resumeToken: 'resume-public' });
    jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-public'));

    await service.startSessionByCode('ABC123', createPublicSessionStartDto());

    expect(createAttemptMock.mock.calls[0]?.[0].data).toEqual(
      expect.objectContaining({
        operatorEducationOrganizationId: null,
        operatorFullNameSnapshot: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
        operatorShortNameSnapshot: null,
        operatorPrivacyPolicyUrlSnapshot: '/privacy',
        operatorConsentDocumentUrlSnapshot: null,
      }),
    );
  });
});
