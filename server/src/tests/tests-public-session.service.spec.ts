import { BadRequestException } from '@nestjs/common';

import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrismaService } from '../prisma.service';
import { getSessionAttemptByTokenOrThrow } from './tests-attempt-access';
import { TestsAnalysisService } from './tests-analysis.service';
import { TestsPublicLinkService } from './tests-public-link.service';
import { TestsPublicSessionService } from './tests-public-session.service';
import {
  createAccessibleLinkFixture,
  createPublicSessionDemographicStartDto,
  createPublicSessionEducationDemographicStartDto,
  createPublicSessionStartDto,
  createPublicSessionStateResponse,
  type AccessibleLinkFixture,
} from './tests.spec-fixtures';

jest.mock('./tests-attempt-access', () => ({
  getSessionAttemptByTokenOrThrow: jest.fn(),
}));

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

type StudentAnswerUpsertArgs = {
  create: { answerPayload: unknown };
  update: { answerPayload: unknown };
  [key: string]: unknown;
};

describe('TestsPublicSessionService', () => {
  let service: TestsPublicSessionService;

  let updateManyMock: jest.Mock<Promise<{ count: number }>, [Record<string, unknown>]>;
  let findManyMock: jest.Mock<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>;
  let createAttemptMock: jest.Mock<Promise<{ resumeToken: string }>, [AttemptCreateInput]>;
  let getAccessiblePublicLinkByCodeMock: jest.Mock<Promise<AccessibleLinkFixture>, [string]>;
  let upsertStubAnalysisMock: jest.Mock;
  let upsertPendingLlmAnalysisMock: jest.Mock;
  let upsertProfOrientationAnalysisMock: jest.Mock;
  let enqueueAttemptAnalysisMock: jest.Mock;
  let toPublicAnalysisResponseMock: jest.Mock;
  let toAttemptStatusMock: jest.Mock;
  let getProfessionAtlasUrlMock: jest.Mock;
  let transactionMock: jest.Mock;
  let txMock: {
    testStudentAnswer: {
      count: jest.Mock;
      findMany: jest.Mock;
      upsert: jest.Mock<unknown, [StudentAnswerUpsertArgs]>;
    };
    testStudentAttempt: {
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    updateManyMock = jest.fn<Promise<{ count: number }>, [Record<string, unknown>]>();
    findManyMock = jest.fn<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>();
    createAttemptMock = jest.fn<Promise<{ resumeToken: string }>, [AttemptCreateInput]>();
    getAccessiblePublicLinkByCodeMock = jest.fn<Promise<AccessibleLinkFixture>, [string]>();
    upsertStubAnalysisMock = jest.fn();
    upsertPendingLlmAnalysisMock = jest.fn();
    upsertProfOrientationAnalysisMock = jest.fn();
    enqueueAttemptAnalysisMock = jest.fn();
    toPublicAnalysisResponseMock = jest.fn((analysis: unknown) => analysis);
    toAttemptStatusMock = jest.fn((attempt: { status: string }) => attempt.status);
    getProfessionAtlasUrlMock = jest.fn().mockResolvedValue(null);
    txMock = {
      testStudentAnswer: {
        count: jest.fn(),
        findMany: jest.fn(),
        upsert: jest.fn<unknown, [StudentAnswerUpsertArgs]>(),
      },
      testStudentAttempt: {
        update: jest.fn(),
      },
    };
    transactionMock = jest.fn((callback: (tx: typeof txMock) => unknown) => callback(txMock));

    const prismaMock = {
      $transaction: transactionMock,
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
      upsertStubAnalysis: upsertStubAnalysisMock,
      upsertPendingLlmAnalysis: upsertPendingLlmAnalysisMock,
      upsertProfOrientationV3PlusAnalysis: upsertProfOrientationAnalysisMock,
      toPublicAnalysisResponse: toPublicAnalysisResponseMock,
      toAttemptStatus: toAttemptStatusMock,
    };
    analysisServiceMock.enqueueAttemptAnalysis = enqueueAttemptAnalysisMock;

    service = new TestsPublicSessionService(
      prismaMock as unknown as PrismaService,
      publicLinkServiceMock as unknown as TestsPublicLinkService,
      analysisServiceMock as unknown as TestsAnalysisService,
      {
        getProfessionAtlasUrl: getProfessionAtlasUrlMock,
      } as unknown as ProfessionAtlasSettingsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
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

  it('startSessionByCode creates a DEMOGRAPHIC attempt with profile data and attempt number 1', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        entryProfileMode: 'DEMOGRAPHIC',
        educationOrganization: null,
        allowResume: true,
        maxAttemptsPerStudent: 1,
      }),
    );
    createAttemptMock.mockResolvedValue({ resumeToken: 'resume-demo' });

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-demo'));

    const result = await service.startSessionByCode(
      'DEMO2026',
      createPublicSessionDemographicStartDto({
        gender: 'MALE',
        age: 18,
        residence: '  Казань  ',
        educationLevel: 'SECONDARY_SPECIAL',
      }),
    );

    const createCall = createAttemptMock.mock.calls[0]?.[0];

    expect(updateManyMock).not.toHaveBeenCalled();
    expect(findManyMock).not.toHaveBeenCalled();
    expect(createCall?.data).toMatchObject({
      publicLinkId: 100,
      topicVersionId: 200,
      attemptNumber: 1,
      studentName: null,
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: null,
      groupOrClass: null,
      studentGender: 'MALE',
      studentAge: 18,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_SPECIAL',
    });
    expect(createCall?.data.studentKeyHash).toEqual(expect.any(String));
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-demo');
    expect(result.session.sessionToken).toBe('resume-demo');
  });

  it('startSessionByCode rejects incomplete DEMOGRAPHIC profile data', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        entryProfileMode: 'DEMOGRAPHIC',
        educationOrganization: null,
        maxAttemptsPerStudent: 1,
      }),
    );

    await expect(
      service.startSessionByCode(
        'DEMO2026',
        createPublicSessionDemographicStartDto({ age: undefined }),
      ),
    ).rejects.toThrow(BadRequestException);
    expect(createAttemptMock).not.toHaveBeenCalled();
  });

  it('startSessionByCode creates an EDUCATION_DEMOGRAPHIC attempt with both profile blocks', async () => {
    getAccessiblePublicLinkByCodeMock.mockResolvedValue(
      createAccessibleLinkFixture({
        entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
        allowResume: true,
        maxAttemptsPerStudent: 3,
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
    createAttemptMock.mockResolvedValue({ resumeToken: 'resume-hybrid' });

    const getSessionByTokenSpy = jest
      .spyOn(service, 'getSessionByToken')
      .mockResolvedValue(createPublicSessionStateResponse('resume-hybrid'));

    const result = await service.startSessionByCode(
      'HYBRID2026',
      createPublicSessionEducationDemographicStartDto({
        educationOrganization: '',
        gender: 'MALE',
        age: 18,
        residence: '  Казань  ',
        educationLevel: 'SECONDARY_SPECIAL',
      }),
    );

    const createCall = createAttemptMock.mock.calls[0]?.[0];

    expect(updateManyMock).toHaveBeenCalled();
    expect(findManyMock).toHaveBeenCalled();
    expect(createCall?.data).toMatchObject({
      publicLinkId: 100,
      topicVersionId: 200,
      attemptNumber: 1,
      studentName: 'Иван',
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: 'Лицей 42',
      groupOrClass: 'ИС-21',
      studentGender: 'MALE',
      studentAge: 18,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_SPECIAL',
    });
    expect(createCall?.data.studentKeyHash).toEqual(expect.any(String));
    expect(getSessionByTokenSpy).toHaveBeenCalledWith('resume-hybrid');
    expect(result.session.sessionToken).toBe('resume-hybrid');
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

  it('getSessionByToken can report an expired status without mutating the attempt', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
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
    } as never);
    toAttemptStatusMock.mockReturnValue('EXPIRED');

    const result = await service.getSessionByToken('session-token');

    expect(result.session.status).toBe('EXPIRED');
    expect(toAttemptStatusMock).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'IN_PROGRESS',
        expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      }),
    );
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('saveAnswers rejects attempts already marked expired', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'EXPIRED',
      expiresAt: null,
      finishedAt: new Date('2026-05-12T12:00:00.000Z'),
      topicVersion: {
        questions: [],
      },
    } as never);

    await expect(
      service.saveAnswers('session-token', {
        answers: [{ questionId: 100, answerPayload: { value: 'A' } }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('saveAnswers rejects in-progress attempts whose time limit has expired', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      finishedAt: null,
      topicVersion: {
        questions: [{ id: 100 }],
      },
    } as never);

    await expect(
      service.saveAnswers('session-token', {
        answers: [{ questionId: 100, answerPayload: { value: 'A' } }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('saveAnswers normalizes answer payloads before persistence', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'IN_PROGRESS',
      expiresAt: null,
      finishedAt: null,
      topicVersion: {
        questions: [
          {
            id: 100,
            type: 'OPEN_TEXT',
            title: 'Text question',
            required: true,
            settings: null,
            options: [],
          },
        ],
      },
    } as never);
    txMock.testStudentAnswer.findMany.mockResolvedValue([
      {
        questionId: 100,
        answerPayload: 'trimmed',
        updatedAt: new Date('2026-05-12T12:00:00.000Z'),
      },
    ]);

    const result = await service.saveAnswers('session-token', {
      answers: [{ questionId: 100, answerPayload: '  trimmed  ' }],
    });

    const upsertArgs = txMock.testStudentAnswer.upsert.mock.calls[0]?.[0];

    expect(upsertArgs).toBeDefined();
    if (!upsertArgs) {
      throw new Error('Expected saved answer upsert arguments');
    }
    expect(upsertArgs.create.answerPayload).toBe('trimmed');
    expect(upsertArgs.update.answerPayload).toBe('trimmed');
    expect(result.answers[0]?.answerPayload).toBe('trimmed');
  });

  it('saveAnswers rejects payloads that do not match the question type', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'IN_PROGRESS',
      expiresAt: null,
      finishedAt: null,
      topicVersion: {
        questions: [
          {
            id: 100,
            type: 'SINGLE_CHOICE',
            title: 'Choice question',
            required: true,
            settings: null,
            options: [{ value: 'A' }],
          },
        ],
      },
    } as never);

    await expect(
      service.saveAnswers('session-token', {
        answers: [{ questionId: 100, answerPayload: 'Z' }],
      }),
    ).rejects.toThrow(BadRequestException);
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('finishSession rejects attempts already marked expired', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'EXPIRED',
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      finishedAt: new Date('2026-05-12T12:00:00.000Z'),
      analysis: null,
    } as never);

    await expect(service.finishSession('session-token')).rejects.toThrow(BadRequestException);
    expect(toPublicAnalysisResponseMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('finishSession rejects in-progress attempts whose time limit has expired', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      finishedAt: null,
      analysis: null,
      topicVersion: {
        questions: [{ id: 100 }],
      },
    } as never);

    await expect(service.finishSession('session-token')).rejects.toThrow(BadRequestException);
    expect(toPublicAnalysisResponseMock).not.toHaveBeenCalled();
    expect(transactionMock).not.toHaveBeenCalled();
  });

  it('finishSession keeps stub analysis when test version has no prompt attached', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'IN_PROGRESS',
      finishedAt: null,
      expiresAt: null,
      analysis: null,
      answers: [],
      topicVersion: {
        analysisPromptVersionId: null,
        questions: [{ id: 100 }],
      },
    } as never);
    txMock.testStudentAttempt.update.mockResolvedValue({
      id: 5,
      finishedAt: new Date('2026-05-01T10:00:00.000Z'),
    });
    txMock.testStudentAnswer.count.mockResolvedValue(1);
    upsertStubAnalysisMock.mockResolvedValue({
      providerMode: 'STUB',
      status: 'READY',
    });

    const result = await service.finishSession('session-token');

    expect(upsertStubAnalysisMock).toHaveBeenCalledWith(txMock, {
      attemptId: 5,
      answeredQuestionsCount: 1,
      totalQuestionsCount: 1,
    });
    expect(upsertPendingLlmAnalysisMock).not.toHaveBeenCalled();
    expect(enqueueAttemptAnalysisMock).not.toHaveBeenCalled();
    expect(result.analysis).toEqual({
      providerMode: 'STUB',
      status: 'READY',
    });
  });

  it('finishSession rejects incomplete required answers before completing attempt', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'IN_PROGRESS',
      finishedAt: null,
      expiresAt: null,
      analysis: null,
      topicVersion: {
        analysisPromptVersionId: null,
        questions: [
          {
            id: 100,
            type: 'OPEN_TEXT',
            title: 'Required question',
            required: true,
            settings: null,
            options: [],
          },
        ],
      },
      answers: [],
    } as never);

    await expect(service.finishSession('session-token')).rejects.toThrow(BadRequestException);
    expect(txMock.testStudentAttempt.update).not.toHaveBeenCalled();
    expect(upsertStubAnalysisMock).not.toHaveBeenCalled();
  });

  it('finishSession stores pending LLM analysis and enqueues async run after transaction', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'IN_PROGRESS',
      finishedAt: null,
      expiresAt: null,
      analysis: null,
      answers: [],
      topicVersion: {
        analysisPromptVersionId: 42,
        questions: [{ id: 100 }],
      },
    } as never);
    txMock.testStudentAttempt.update.mockResolvedValue({
      id: 5,
      finishedAt: new Date('2026-05-01T10:00:00.000Z'),
    });
    txMock.testStudentAnswer.count.mockResolvedValue(1);
    upsertPendingLlmAnalysisMock.mockResolvedValue({
      providerMode: 'LLM',
      status: 'PENDING',
      promptVersionId: 42,
    });

    const result = await service.finishSession('session-token');

    expect(upsertPendingLlmAnalysisMock).toHaveBeenCalledWith(txMock, {
      attemptId: 5,
      promptVersionId: 42,
    });
    expect(upsertStubAnalysisMock).not.toHaveBeenCalled();
    expect(enqueueAttemptAnalysisMock).toHaveBeenCalledWith(5);
    expect(result.analysis).toEqual({
      providerMode: 'LLM',
      status: 'PENDING',
      promptVersionId: 42,
    });
  });

  it('finishSession stores ready prof-orientation algorithm analysis before LLM enrichment', async () => {
    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 5,
      status: 'IN_PROGRESS',
      finishedAt: null,
      expiresAt: null,
      analysis: null,
      topicVersion: {
        scoringKind: 'PROF_ORIENTATION_V3_PLUS',
        scoringConfig: { version: '3.0' },
        analysisPromptVersionId: 42,
        questions: [{ id: 100 }],
      },
      answers: [],
    } as never);
    txMock.testStudentAttempt.update.mockResolvedValue({
      id: 5,
      finishedAt: new Date('2026-05-01T10:00:00.000Z'),
    });
    upsertProfOrientationAnalysisMock.mockResolvedValue({
      providerMode: 'ALGORITHM_LLM',
      status: 'READY',
      summary: {
        resultKind: 'prof_orientation_v3_plus',
        primaryDirection: { id: 'A1' },
        llm: { status: 'pending' },
      },
    });

    const result = await service.finishSession('session-token');

    expect(upsertProfOrientationAnalysisMock).toHaveBeenCalledWith(txMock, {
      attempt: expect.objectContaining({ id: 5 }) as unknown,
      promptVersionId: 42,
    });
    expect(upsertPendingLlmAnalysisMock).not.toHaveBeenCalled();
    expect(upsertStubAnalysisMock).not.toHaveBeenCalled();
    expect(enqueueAttemptAnalysisMock).toHaveBeenCalledWith(5);
    expect(result.analysis).toMatchObject({
      providerMode: 'ALGORITHM_LLM',
      status: 'READY',
    });
  });
});
