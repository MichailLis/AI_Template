import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { ProfessionAtlasSettingsService } from '../../app-settings/profession-atlas-settings.service';
import { PrismaService } from '../../prisma.service';

import { ProfOrientationAtlasService } from '../prof-orientation-v3-plus/atlas';
import { TestsAnalysisService } from '../analysis/analysis.service';
import { TestsPublicLinkService } from '../public-links/public-link.service';
import { TestsPublicSessionService } from '../session/public-session.service';

import type { AccessibleLinkFixture } from '../session/spec-fixtures';

export type AttemptHistoryItem = {
  id: number;
  attemptNumber: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';
  resumeToken: string;
  expiresAt: Date | null;
};

export type AttemptCreateInput = {
  data: Record<string, unknown>;
  [key: string]: unknown;
};

export type StudentAnswerUpsertArgs = {
  create: { answerPayload: unknown };
  update: { answerPayload: unknown };
  [key: string]: unknown;
};

export type TransactionMocks = {
  testStudentAnswer: {
    count: jest.Mock;
    findMany: jest.Mock;
    upsert: jest.Mock<unknown, [StudentAnswerUpsertArgs]>;
  };
  testStudentAttempt: {
    update: jest.Mock;
    updateMany: jest.Mock<Promise<{ count: number }>, [Record<string, unknown>]>;
    findMany: jest.Mock<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>;
    create: jest.Mock<Promise<{ resumeToken: string }>, [AttemptCreateInput]>;
  };
};

export type PublicSessionHarness = {
  service: TestsPublicSessionService;
  updateManyMock: jest.Mock<Promise<{ count: number }>, [Record<string, unknown>]>;
  findManyMock: jest.Mock<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>;
  createAttemptMock: jest.Mock<Promise<{ resumeToken: string }>, [AttemptCreateInput]>;
  getAccessiblePublicLinkByCodeMock: jest.Mock<Promise<AccessibleLinkFixture>, [string]>;
  upsertStubAnalysisMock: jest.Mock;
  upsertPendingLlmAnalysisMock: jest.Mock;
  upsertProfOrientationAnalysisMock: jest.Mock;
  enqueueAttemptAnalysisMock: jest.Mock;
  toPublicAnalysisResponseMock: jest.Mock;
  toAttemptStatusMock: jest.Mock;
  getActivePolicySnapshotMock: jest.Mock;
  getProfessionAtlasUrlMock: jest.Mock;
  saveEnrichedAnalysisMock: jest.Mock;
  transactionMock: jest.Mock;
  txMock: TransactionMocks;
};

/**
 * Builds TestsPublicSessionService against fresh mocks. Shared by the start-session and
 * session-lifecycle specs so neither has to carry a hundred lines of wiring.
 */
export const createPublicSessionHarness = (): PublicSessionHarness => {
  const updateManyMock = jest.fn<Promise<{ count: number }>, [Record<string, unknown>]>();
  const findManyMock = jest.fn<Promise<AttemptHistoryItem[]>, [Record<string, unknown>]>();
  const createAttemptMock = jest.fn<Promise<{ resumeToken: string }>, [AttemptCreateInput]>();
  const getAccessiblePublicLinkByCodeMock = jest.fn<Promise<AccessibleLinkFixture>, [string]>();
  const upsertStubAnalysisMock = jest.fn();
  const upsertPendingLlmAnalysisMock = jest.fn();
  const upsertProfOrientationAnalysisMock = jest.fn();
  const enqueueAttemptAnalysisMock = jest.fn();
  const toPublicAnalysisResponseMock = jest.fn((analysis: unknown) => analysis);
  const toAttemptStatusMock = jest.fn((attempt: { status: string }) => attempt.status);
  const getActivePolicySnapshotMock = jest.fn().mockResolvedValue({
    version: '2026-07-09',
    publishedAt: new Date('2026-07-09T00:00:00.000Z'),
    content: 'Политика',
  });
  const getProfessionAtlasUrlMock = jest.fn().mockResolvedValue(null);
  const saveEnrichedAnalysisMock = jest.fn();

  const txMock: TransactionMocks = {
    testStudentAnswer: {
      count: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn<unknown, [StudentAnswerUpsertArgs]>(),
    },
    testStudentAttempt: {
      update: jest.fn(),
      updateMany: updateManyMock,
      findMany: findManyMock,
      create: createAttemptMock,
    },
  };

  const transactionMock = jest.fn((callback: (tx: TransactionMocks) => unknown) =>
    callback(txMock),
  );

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
    enqueueAttemptAnalysis: enqueueAttemptAnalysisMock,
    upsertStubAnalysis: upsertStubAnalysisMock,
    upsertPendingLlmAnalysis: upsertPendingLlmAnalysisMock,
    upsertProfOrientationV3PlusAnalysis: upsertProfOrientationAnalysisMock,
    toPublicAnalysisResponse: toPublicAnalysisResponseMock,
    toAttemptStatus: toAttemptStatusMock,
  };

  const service = new TestsPublicSessionService(
    prismaMock as unknown as PrismaService,
    publicLinkServiceMock as unknown as TestsPublicLinkService,
    analysisServiceMock as unknown as TestsAnalysisService,
    {
      getActivePolicySnapshot: getActivePolicySnapshotMock,
    } as unknown as PrivacyPolicySettingsService,
    {
      getProfessionAtlasUrl: getProfessionAtlasUrlMock,
    } as unknown as ProfessionAtlasSettingsService,
    {
      saveEnrichedAnalysis: saveEnrichedAnalysisMock,
    } as unknown as ProfOrientationAtlasService,
  );

  return {
    service,
    updateManyMock,
    findManyMock,
    createAttemptMock,
    getAccessiblePublicLinkByCodeMock,
    upsertStubAnalysisMock,
    upsertPendingLlmAnalysisMock,
    upsertProfOrientationAnalysisMock,
    enqueueAttemptAnalysisMock,
    toPublicAnalysisResponseMock,
    toAttemptStatusMock,
    getActivePolicySnapshotMock,
    getProfessionAtlasUrlMock,
    saveEnrichedAnalysisMock,
    transactionMock,
    txMock,
  };
};
