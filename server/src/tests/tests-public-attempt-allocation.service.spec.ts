import { BadRequestException } from '@nestjs/common';

import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { PrismaService } from '../prisma.service';
import { TestsPublicAttemptAllocationService } from './tests-public-attempt-allocation.service';
import type { AttemptAllocationInput } from './tests-public-session.types';
import { createAccessibleLinkFixture } from './tests.spec-fixtures';

jest.mock('./tests-domain.utils', () => ({
  createRandomToken: jest.fn(() => 'generated-resume-token'),
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

describe('TestsPublicAttemptAllocationService', () => {
  let service: TestsPublicAttemptAllocationService;
  let transactionMock: jest.Mock;
  let updateManyMock: jest.Mock<Promise<{ count: number }>, [Record<string, unknown>]>;
  let findManyMock: jest.Mock<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>;
  let createAttemptMock: jest.Mock<Promise<{ resumeToken: string }>, [AttemptCreateInput]>;
  let getActivePolicySnapshotMock: jest.Mock;

  const createInput = (
    overrides: Partial<AttemptAllocationInput> = {},
  ): AttemptAllocationInput => ({
    link: createAccessibleLinkFixture({
      id: 100,
      topicVersionId: 200,
      maxAttemptsPerStudent: 3,
      timeLimitMinutes: 30,
      allowResume: true,
    }),
    studentKeyHash: 'student-key',
    profile: {
      studentName: 'Ivan',
      studentLastInitial: 'I',
      studentMiddleInitial: 'P',
      educationOrganization: 'Lyceum',
      groupOrClass: '10A',
      studentGender: null,
      studentAge: null,
      studentResidence: null,
      studentEducationLevel: null,
    },
    ...overrides,
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-07-17T10:00:00.000Z'));
    updateManyMock = jest.fn<Promise<{ count: number }>, [Record<string, unknown>]>();
    findManyMock = jest.fn<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>();
    createAttemptMock = jest.fn<Promise<{ resumeToken: string }>, [AttemptCreateInput]>();
    const txMock = {
      testStudentAttempt: {
        updateMany: updateManyMock,
        findMany: findManyMock,
        create: createAttemptMock,
      },
    };
    transactionMock = jest.fn((callback: (tx: typeof txMock) => unknown) => callback(txMock));
    getActivePolicySnapshotMock = jest.fn().mockResolvedValue({
      version: '2026-07-policy',
      publishedAt: new Date('2026-07-01T00:00:00.000Z'),
      content: 'Policy',
    });
    service = new TestsPublicAttemptAllocationService(
      { $transaction: transactionMock } as unknown as PrismaService,
      {
        getActivePolicySnapshot: getActivePolicySnapshotMock,
      } as unknown as PrivacyPolicySettingsService,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('returns an existing resumable token after expiring stale in-progress attempts', async () => {
    updateManyMock.mockResolvedValue({ count: 1 });
    findManyMock.mockResolvedValue([
      {
        id: 2,
        attemptNumber: 2,
        status: 'IN_PROGRESS',
        resumeToken: 'resume-existing',
        expiresAt: new Date('2026-07-17T10:05:00.000Z'),
      },
      {
        id: 1,
        attemptNumber: 1,
        status: 'EXPIRED',
        resumeToken: 'resume-expired',
        expiresAt: new Date('2026-07-17T09:00:00.000Z'),
      },
    ]);

    const result = await service.allocate(createInput());

    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        publicLinkId: 100,
        studentKeyHash: 'student-key',
        status: 'IN_PROGRESS',
        expiresAt: {
          lt: new Date('2026-07-17T10:00:00.000Z'),
        },
      },
      data: {
        status: 'EXPIRED',
        finishedAt: new Date('2026-07-17T10:00:00.000Z'),
      },
    });
    expect(result).toEqual({ resumeToken: 'resume-existing' });
    expect(createAttemptMock).not.toHaveBeenCalled();
  });

  it('enforces attempt limit before creating a new attempt', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([
      {
        id: 2,
        attemptNumber: 2,
        status: 'COMPLETED',
        resumeToken: 'resume-2',
        expiresAt: null,
      },
      {
        id: 1,
        attemptNumber: 1,
        status: 'COMPLETED',
        resumeToken: 'resume-1',
        expiresAt: null,
      },
    ]);

    await expect(
      service.allocate(
        createInput({
          link: createAccessibleLinkFixture({
            maxAttemptsPerStudent: 2,
            allowResume: false,
          }),
        }),
      ),
    ).rejects.toThrow('Attempts limit reached for this test link');
    expect(createAttemptMock).not.toHaveBeenCalled();
  });

  it('creates a new attempt with immutable policy and operator snapshots', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([
      {
        id: 1,
        attemptNumber: 1,
        status: 'COMPLETED',
        resumeToken: 'old',
        expiresAt: null,
      },
    ]);
    createAttemptMock.mockResolvedValue({ resumeToken: 'generated-resume-token' });
    const link = createAccessibleLinkFixture({
      educationOrganizationId: 42,
      personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      operatorFullNameSnapshot: 'Operator full',
      operatorShortNameSnapshot: 'Operator short',
      operatorPrivacyPolicyUrlSnapshot: 'https://operator.example/privacy',
      operatorConsentDocumentUrlSnapshot: 'https://operator.example/consent',
      consentVersion: 'consent-v7',
      consentTextSnapshot: 'Consent text v7',
    });

    const result = await service.allocate(createInput({ link }));

    expect(createAttemptMock).toHaveBeenCalledTimes(1);
    expect(createAttemptMock.mock.calls[0]?.[0].data).toEqual(
      expect.objectContaining({
        publicLinkId: 100,
        topicVersionId: 200,
        attemptNumber: 2,
        status: 'IN_PROGRESS',
        studentKeyHash: 'student-key',
        consentAcceptedAt: new Date('2026-07-17T10:00:00.000Z'),
        consentVersion: 'consent-v7',
        consentTextSnapshot: 'Consent text v7',
        policyVersionSnapshot: '2026-07-policy',
        policyPublishedAtSnapshot: new Date('2026-07-01T00:00:00.000Z'),
        operatorEducationOrganizationId: 42,
        operatorFullNameSnapshot: 'Operator full',
        operatorShortNameSnapshot: 'Operator short',
        operatorPrivacyPolicyUrlSnapshot: 'https://operator.example/privacy',
        operatorConsentDocumentUrlSnapshot: 'https://operator.example/consent',
        resumeToken: 'generated-resume-token',
        startedAt: new Date('2026-07-17T10:00:00.000Z'),
        expiresAt: new Date('2026-07-17T10:30:00.000Z'),
      }),
    );
    expect(result).toEqual({ resumeToken: 'generated-resume-token' });
  });

  it('retries a P2002 attempt-number race and returns the resumable token from the retry', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: 1,
        attemptNumber: 1,
        status: 'IN_PROGRESS',
        resumeToken: 'resume-after-race',
        expiresAt: new Date('2026-07-17T10:05:00.000Z'),
      },
    ]);
    createAttemptMock.mockRejectedValueOnce({
      code: 'P2002',
      meta: { target: ['publicLinkId', 'studentKeyHash', 'attemptNumber'] },
    });

    const result = await service.allocate(createInput());

    expect(transactionMock).toHaveBeenCalledTimes(2);
    expect(createAttemptMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ resumeToken: 'resume-after-race' });
  });

  it('throws terminal start failure after repeated P2002 attempt-number races', async () => {
    updateManyMock.mockResolvedValue({ count: 0 });
    findManyMock.mockResolvedValue([]);
    createAttemptMock.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['publicLinkId', 'studentKeyHash', 'attemptNumber'] },
    });

    await expect(service.allocate(createInput())).rejects.toThrow(BadRequestException);
    await expect(service.allocate(createInput())).rejects.toThrow(
      'Не удалось начать попытку. Попробуйте ещё раз.',
    );
  });
});
