import { BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsPublicLinkService } from './tests-public-link.service';
import { TestsPublicSessionService } from './tests-public-session.service';
import {
  createAccessibleLinkFixture,
  createPublicSessionStartDto,
  createPublicSessionStateResponse,
  type AccessibleLinkFixture,
} from './tests.spec-fixtures';

type AttemptHistoryItem = {
  id: number;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
  resumeToken: string;
  expiresAt: Date | null;
};

type AttemptCreateInput = {
  data: {
    educationOrganization: string;
    groupOrClass: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

describe('TestsPublicSessionService', () => {
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

    const prismaMock = {
      testStudentAttempt: {
        updateMany: updateManyMock,
        findMany: findManyMock,
        create: createAttemptMock,
      },
    };

    const publicLinkServiceMock = {
      getAccessiblePublicLinkByCode: getAccessiblePublicLinkByCodeMock,
    };

    const analysisServiceMock = {
      enqueueAttemptAnalysis: jest.fn(),
    };

    service = new TestsPublicSessionService(
      prismaMock as unknown as PrismaService,
      publicLinkServiceMock as unknown as TestsPublicLinkService,
      analysisServiceMock as unknown as TestsAnalysisService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('startSessionByCode rejects invalid group format in STRICT mode', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        educationOrganization: {
          name: 'Лицей 42',
          groupValidationMode: 'STRICT',
          groupValidationPattern: '^\\d{2}[A-Z]$',
          groupValidationHint: 'Неверный формат группы',
        },
      }),
    );

    const startPromise = service.startSessionByCode(
      'ABC123',
      createPublicSessionStartDto({ groupOrClass: 'ИС-21' }),
    );

    await expect(startPromise).rejects.toThrow(BadRequestException);
    await expect(startPromise).rejects.toThrow('Неверный формат группы');
    expect(updateManyMock).not.toHaveBeenCalled();
  });

  it('startSessionByCode uses organization from link and creates new attempt', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        educationOrganization: {
          name: 'Лицей 42',
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationHint: null,
        },
      }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([]);
    createAttemptMock.mockResolvedValue({ resumeToken: 'resume-new' });

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-new'));

    const result = await service.startSessionByCode(
      'ABC123',
      createPublicSessionStartDto({ educationOrganization: '' }),
    );

    expect(createAttemptMock).toHaveBeenCalled();
    const createCall = createAttemptMock.mock.calls[0]?.[0];
    expect(createCall?.data.educationOrganization).toBe('Лицей 42');
    expect(createCall?.data.groupOrClass).toBe('ИС-21');
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-new');
    expect(result.session.sessionToken).toBe('resume-new');
  });

  it('startSessionByCode returns resumable session when allowResume is enabled', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({ allowResume: true }),
    );
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([
      {
        id: 1,
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        resumeToken: 'resume-existing',
        expiresAt: new Date(Date.now() + 60_000),
      },
    ]);

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-existing'));

    const result = await service.startSessionByCode('ABC123', createPublicSessionStartDto());

    expect(createAttemptMock).not.toHaveBeenCalled();
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-existing');
    expect(result.session.sessionToken).toBe('resume-existing');
  });
});
