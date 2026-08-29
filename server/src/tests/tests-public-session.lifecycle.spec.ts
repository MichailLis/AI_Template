import { BadRequestException } from '@nestjs/common';

import { getSessionAttemptByTokenOrThrow } from './tests-attempt-access';

import { createPublicSessionHarness } from './tests-public-session.spec-harness';

import type { PublicSessionHarness } from './tests-public-session.spec-harness';

jest.mock('./tests-attempt-access', () => ({
  getSessionAttemptByTokenOrThrow: jest.fn(),
}));

describe('TestsPublicSessionService lifecycle', () => {
  let harness: PublicSessionHarness;
  let service: PublicSessionHarness['service'];
  let upsertStubAnalysisMock: PublicSessionHarness['upsertStubAnalysisMock'];
  let upsertPendingLlmAnalysisMock: PublicSessionHarness['upsertPendingLlmAnalysisMock'];
  let upsertProfOrientationAnalysisMock: PublicSessionHarness['upsertProfOrientationAnalysisMock'];
  let enqueueAttemptAnalysisMock: PublicSessionHarness['enqueueAttemptAnalysisMock'];
  let toPublicAnalysisResponseMock: PublicSessionHarness['toPublicAnalysisResponseMock'];
  let toAttemptStatusMock: PublicSessionHarness['toAttemptStatusMock'];
  let saveEnrichedAnalysisMock: PublicSessionHarness['saveEnrichedAnalysisMock'];
  let transactionMock: PublicSessionHarness['transactionMock'];
  let txMock: PublicSessionHarness['txMock'];

  beforeEach(() => {
    harness = createPublicSessionHarness();
    ({
      service,
      upsertStubAnalysisMock,
      upsertPendingLlmAnalysisMock,
      upsertProfOrientationAnalysisMock,
      enqueueAttemptAnalysisMock,
      toPublicAnalysisResponseMock,
      toAttemptStatusMock,
      saveEnrichedAnalysisMock,
      transactionMock,
      txMock,
    } = harness);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
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
    expect(saveEnrichedAnalysisMock).not.toHaveBeenCalled();
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
    expect(saveEnrichedAnalysisMock).not.toHaveBeenCalled();
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
    const scoredSummary = {
      resultKind: 'prof_orientation_v3_plus',
      primaryDirection: { id: 'A1' },
      llm: { status: 'pending' },
    };
    const enrichedSummary = {
      ...scoredSummary,
      atlas: {
        status: 'ready',
        professions: [],
        enterprises: [],
        events: [],
        institutions: [],
      },
    };
    upsertProfOrientationAnalysisMock.mockResolvedValue({
      id: 77,
      providerMode: 'ALGORITHM_LLM',
      status: 'READY',
      summary: scoredSummary,
    });
    saveEnrichedAnalysisMock.mockResolvedValue(enrichedSummary);

    const result = await service.finishSession('session-token');

    expect(upsertProfOrientationAnalysisMock).toHaveBeenCalledWith(txMock, {
      attempt: expect.objectContaining({ id: 5 }) as unknown,
      promptVersionId: 42,
    });
    expect(upsertPendingLlmAnalysisMock).not.toHaveBeenCalled();
    expect(upsertStubAnalysisMock).not.toHaveBeenCalled();
    expect(saveEnrichedAnalysisMock).toHaveBeenCalledWith(77, scoredSummary);
    expect(enqueueAttemptAnalysisMock).toHaveBeenCalledWith(5);
    expect(result.analysis).toMatchObject({
      providerMode: 'ALGORITHM_LLM',
      status: 'READY',
      summary: {
        atlas: {
          status: 'ready',
        },
      },
    });
  });

  it('getSessionResult refreshes stale prof-orientation atlas before returning analysis', async () => {
    const staleSummary = {
      resultKind: 'prof_orientation_v3_plus',
      profile: {
        type: 'broad_interest',
      },
      primaryDirection: {
        professions: [
          { code: '201524', title: 'Инженер-конструктор' },
          { code: '204016', title: 'Техник-конструктор' },
        ],
      },
      secondaryDirection: {
        professions: [{ code: '201353', title: 'Инженер по качеству' }],
      },
      topDirections: [],
      atlas: {
        status: 'ready',
        professions: [
          { requestedTitle: 'Инженер-конструктор', title: 'Инженер-конструктор' },
          { requestedTitle: 'Инженер по качеству', title: 'Инженер по качеству' },
        ],
        unmatchedProfessions: [],
        duplicateProfessions: [],
        enterprises: [],
        events: [],
        institutions: [],
      },
    };
    const refreshedSummary = {
      ...staleSummary,
      atlas: {
        ...staleSummary.atlas,
        professions: [
          { requestedTitle: 'Инженер-конструктор', title: 'Инженер-конструктор' },
          { requestedTitle: 'Техник-конструктор', title: 'Техник-конструктор' },
        ],
      },
    };
    const analysis = {
      id: 77,
      providerMode: 'ALGORITHM_LLM',
      status: 'READY',
      summary: staleSummary,
      rawText: JSON.stringify(staleSummary),
      errorMessage: null,
      generatedAt: new Date('2026-06-15T22:55:29.098Z'),
    };

    jest.mocked(getSessionAttemptByTokenOrThrow).mockResolvedValue({
      id: 7,
      status: 'COMPLETED',
      expiresAt: null,
      finishedAt: new Date('2026-06-15T22:55:29.093Z'),
      publicLink: {
        publicTemplate: 'POLUS',
        publicBranding: null,
      },
      analysis,
    } as never);
    saveEnrichedAnalysisMock.mockResolvedValue(refreshedSummary);
    toAttemptStatusMock.mockReturnValue('COMPLETED');

    const result = await service.getSessionResult('session-token');

    expect(saveEnrichedAnalysisMock).toHaveBeenCalledWith(77, staleSummary);
    expect(toPublicAnalysisResponseMock).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: refreshedSummary,
      }),
    );
    expect(result.analysis).toEqual(
      expect.objectContaining({
        summary: refreshedSummary,
      }),
    );
  });
});
