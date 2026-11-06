import { BadGatewayException, Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import OpenAI from 'openai';

import type { AiProviderConfigService } from '../../ai-provider/ai-provider-config.service';
import type { AiProviderClientService } from '../../ai-provider/ai-provider.client';
import { TEST_AI_PROVIDER_CONNECTION } from '../../ai-provider/spec-fixtures';
import type { PrismaService } from '../../prisma.service';
import type { MethodologyServices } from '../methodology/methodology-services';
import { getProfOrientationLlmStatus } from '../prof-orientation-v3-plus/scoring';
import { TestsAnalysisService } from './analysis.service';

const NOW = new Date('2026-05-12T12:00:00.000Z');
const MINUTE = 60_000;
const PROVIDER_SECRET = 'Incorrect API key provided: sk-live-123';
const PROMPT_TEXT = 'Проанализируй ответы ученика Иванова';

type Row = {
  id: number;
  attemptId: number;
  status: string;
  providerMode: string;
  summary: unknown;
  errorMessage: string | null;
};

const profSummary = (llm: Record<string, unknown>) => ({
  resultKind: 'prof_orientation_v3_plus',
  topDirections: [{ id: 'A1', name: '3D-моделирование' }],
  profile: { type: 'single_profile' },
  atlas: { status: 'ready', professions: [{ title: 'ATLAS-MARKER' }] },
  llm,
});

const providerFailure = (status: number, message = PROVIDER_SECRET) =>
  new BadGatewayException(message, {
    cause: OpenAI.APIError.generate(status, { error: { message } }, message, new Headers()),
    description: 'AI_PROVIDER_REQUEST_FAILED',
  });

/**
 * Хранилище в памяти с блокировкой строки: транзакции идут по одной, как при `FOR UPDATE`. Если
 * перезапуск перестанет проверять состояние внутри блокировки, второй запрос тоже «победит».
 */
const createFakeDb = (
  initial: Omit<Row, 'id' | 'attemptId' | 'errorMessage'>,
  hasPrompt = true,
) => {
  const row: Row = { id: 77, attemptId: 5, errorMessage: 'old error', ...initial };
  let lock: Promise<unknown> = Promise.resolve();
  const tx = {
    $queryRaw: jest.fn(() =>
      Promise.resolve([
        { id: row.id, status: row.status, providerMode: row.providerMode, summary: row.summary },
      ]),
    ),
    testStudentAttempt: {
      findFirst: jest.fn(() => Promise.resolve(hasPrompt ? { id: row.attemptId } : null)),
    },
    testStudentAnalysis: {
      update: jest.fn(async ({ data }: { data: Partial<Row> }) => {
        // A real update lands after the other request had its chance to read the row.
        await Promise.resolve();
        Object.assign(row, data, {
          summary: data.summary === Prisma.JsonNull ? null : (data.summary ?? row.summary),
        });
      }),
    },
  };
  const prisma = {
    $transaction: jest.fn((run: (client: typeof tx) => Promise<unknown>) => {
      const result = lock.then(() => run(tx));
      lock = result.catch(() => undefined);
      return result;
    }),
    testStudentAnalysis: { findMany: jest.fn() },
    testStudentAttempt: { findUnique: jest.fn() },
  };

  return { row, tx, prisma };
};

const createService = (prisma: unknown) => {
  const aiProviderClient = {
    fetchModels: jest.fn().mockRejectedValue(new Error('no catalog')),
    generatePrompt: jest.fn(),
  };
  const service = new TestsAnalysisService(
    prisma as PrismaService,
    { get: jest.fn() } as unknown as ConfigService,
    {
      getConnection: jest.fn().mockResolvedValue(TEST_AI_PROVIDER_CONNECTION),
    } as unknown as AiProviderConfigService,
    aiProviderClient as unknown as AiProviderClientService,
    { atlas: { saveEnrichedAnalysis: jest.fn() } } as unknown as MethodologyServices,
  );
  const enqueue = jest.spyOn(service, 'enqueueAttemptAnalysis').mockImplementation(() => undefined);

  return { service, enqueue, aiProviderClient };
};

describe('restart of a failed analysis', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  describe('idempotency', () => {
    it('lets exactly one of two simultaneous clicks restart an AI analysis', async () => {
      const db = createFakeDb({
        status: 'FAILED',
        providerMode: 'LLM',
        summary: { llm: { reason: 'AUTH' } },
      });
      const { service, enqueue } = createService(db.prisma);

      const results = await Promise.all([
        service.restartFailedAnalysis(5),
        service.restartFailedAnalysis(5),
      ]);

      expect(results.filter(Boolean)).toHaveLength(1);
      expect(enqueue).toHaveBeenCalledTimes(1);
      expect(enqueue).toHaveBeenCalledWith(5);
      expect(db.row).toMatchObject({ status: 'PENDING', summary: null, errorMessage: null });
    });

    it('lets exactly one of two clicks restart the enrichment of a prof-orientation result', async () => {
      const db = createFakeDb({
        status: 'READY',
        providerMode: 'ALGORITHM_LLM',
        summary: profSummary({ status: 'failed', model: 'm', errorMessage: 'x' }),
      });
      const { service, enqueue } = createService(db.prisma);

      const results = await Promise.all([
        service.restartFailedAnalysis(5),
        service.restartFailedAnalysis(5),
        service.restartFailedAnalysis(5),
      ]);

      expect(results.filter(Boolean)).toHaveLength(1);
      expect(enqueue).toHaveBeenCalledTimes(1);
    });

    it('keeps the algorithmic record READY with its atlas and flips only llm to pending', async () => {
      const db = createFakeDb({
        status: 'READY',
        providerMode: 'ALGORITHM_LLM',
        summary: profSummary({ status: 'failed', model: 'm', errorMessage: 'x', reason: 'AUTH' }),
      });
      const { service } = createService(db.prisma);

      await expect(service.restartFailedAnalysis(5)).resolves.toBe(true);

      // Invariant 7: the record stays READY; the signal for the AI is llm.status.
      expect(db.row.status).toBe('READY');
      expect(getProfOrientationLlmStatus(db.row.summary)).toBe('pending');
      expect(db.row.summary).toMatchObject({
        atlas: { professions: [{ title: 'ATLAS-MARKER' }] },
        llm: { status: 'pending' },
      });
      expect(db.row.summary).not.toHaveProperty('llm.reason');
      expect(db.row.errorMessage).toBeNull();
    });

    it.each([
      [
        'an analysis that is already running',
        { status: 'PENDING', providerMode: 'LLM', summary: null },
      ],
      [
        'an analysis that finished',
        { status: 'READY', providerMode: 'LLM', summary: { ok: true } },
      ],
      ['a stub', { status: 'READY', providerMode: 'STUB', summary: null }],
      [
        'an enrichment that is still running',
        {
          status: 'READY',
          providerMode: 'ALGORITHM_LLM',
          summary: profSummary({ status: 'pending' }),
        },
      ],
      [
        'an enrichment that finished',
        {
          status: 'READY',
          providerMode: 'ALGORITHM_LLM',
          summary: profSummary({ status: 'ready' }),
        },
      ],
      [
        'a result that never asked for AI',
        {
          status: 'READY',
          providerMode: 'ALGORITHM',
          summary: profSummary({ status: 'not_requested' }),
        },
      ],
    ])('does not touch %s', async (_name, initial) => {
      const db = createFakeDb(initial);
      const { service, enqueue } = createService(db.prisma);

      await expect(service.restartFailedAnalysis(5)).resolves.toBe(false);

      expect(db.tx.testStudentAnalysis.update).not.toHaveBeenCalled();
      expect(enqueue).not.toHaveBeenCalled();
    });

    it('does not restart when the test version has no prompt to analyse with', async () => {
      const db = createFakeDb({ status: 'FAILED', providerMode: 'LLM', summary: null }, false);
      const { service, enqueue } = createService(db.prisma);

      await expect(service.restartFailedAnalysis(5)).resolves.toBe(false);
      expect(enqueue).not.toHaveBeenCalled();
    });

    it('does not restart an attempt that has no analysis row', async () => {
      const db = createFakeDb({ status: 'FAILED', providerMode: 'LLM', summary: null });
      db.tx.$queryRaw.mockResolvedValue([]);
      const { service, enqueue } = createService(db.prisma);

      await expect(service.restartFailedAnalysis(5)).resolves.toBe(false);
      expect(enqueue).not.toHaveBeenCalled();
    });
  });

  describe('automatic retry pass', () => {
    const due = (nextRetryAtMs: number, autoRetries = 0) => ({
      status: 'FAILED',
      providerMode: 'LLM',
      summary: { llm: { reason: 'PROVIDER_ERROR', autoRetries, nextRetryAtMs } },
    });

    it('asks only for failures whose time has come, in a small batch', async () => {
      const db = createFakeDb(due(NOW.getTime() - 1));
      db.prisma.testStudentAnalysis.findMany.mockResolvedValue([]);
      const { service } = createService(db.prisma);

      await service.retryDueFailedAnalyses(NOW);

      const args = (db.prisma.testStudentAnalysis.findMany.mock.calls as unknown[][])[0]?.[0] as {
        where: unknown;
        take: number;
      };

      expect(args.take).toBe(20);
      expect(JSON.stringify(args.where)).toContain(
        JSON.stringify({ path: ['llm', 'nextRetryAtMs'], lte: NOW.getTime() }),
      );
    });

    it('restarts a failure that is due and counts the retry', async () => {
      const db = createFakeDb(due(NOW.getTime() - MINUTE, 1));
      db.prisma.testStudentAnalysis.findMany.mockResolvedValue([{ attemptId: 5 }]);
      const { service, enqueue } = createService(db.prisma);

      await expect(service.retryDueFailedAnalyses(NOW)).resolves.toBe(1);

      expect(enqueue).toHaveBeenCalledWith(5);
      expect(db.row).toMatchObject({
        status: 'PENDING',
        summary: { llm: { status: 'pending', autoRetries: 2 } },
      });
    });

    it('leaves a failure alone when a person restarted it and it failed again meanwhile', async () => {
      // The pass read the row as due, but by the time it holds the lock the deadline is new.
      const db = createFakeDb(due(NOW.getTime() + 30 * MINUTE));
      db.prisma.testStudentAnalysis.findMany.mockResolvedValue([{ attemptId: 5 }]);
      const { service, enqueue } = createService(db.prisma);

      await expect(service.retryDueFailedAnalyses(NOW)).resolves.toBe(0);
      expect(enqueue).not.toHaveBeenCalled();
      expect(db.tx.testStudentAnalysis.update).not.toHaveBeenCalled();
    });

    it('never auto-retries a failure that has no deadline: the key, the balance or the answer', async () => {
      const db = createFakeDb({
        status: 'FAILED',
        providerMode: 'LLM',
        summary: { llm: { reason: 'AUTH', autoRetries: 0 } },
      });
      db.prisma.testStudentAnalysis.findMany.mockResolvedValue([{ attemptId: 5 }]);
      const { service, enqueue } = createService(db.prisma);

      await expect(service.retryDueFailedAnalyses(NOW)).resolves.toBe(0);
      expect(enqueue).not.toHaveBeenCalled();
    });

    it('lets a person start a fresh series: the manual restart clears the counter', async () => {
      const db = createFakeDb({
        status: 'FAILED',
        providerMode: 'LLM',
        summary: { llm: { reason: 'PROVIDER_ERROR', autoRetries: 3 } },
      });
      const { service } = createService(db.prisma);

      await expect(service.restartFailedAnalysis(5)).resolves.toBe(true);
      expect(db.row.summary).toBeNull();
    });
  });

  describe('recording a failure', () => {
    const plainAttempt = (summary: unknown = null) => ({
      id: 5,
      analysis: { id: 77, summary },
      topicVersion: {
        scoringKind: 'DEFAULT',
        analysisPromptVersion: { id: 42, model: 'm', temperature: 0.2, prompt: PROMPT_TEXT },
        questions: [],
      },
      answers: [],
    });
    /** Runs the analysis of attempt 5 against a provider that fails with `error`. */
    const run = async (attempt: ReturnType<typeof plainAttempt>, error: unknown) => {
      const prisma = {
        $transaction: (runInTx: (client: unknown) => unknown) => runInTx(prisma),
        $queryRaw: jest.fn().mockResolvedValue([{ summary: attempt.analysis.summary }]),
        testStudentAttempt: { findUnique: jest.fn().mockResolvedValue(attempt) },
        testStudentAnalysis: { update: jest.fn().mockResolvedValue({}) },
      };
      const { service, aiProviderClient } = createService(prisma);
      aiProviderClient.generatePrompt.mockRejectedValue(error);
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

      await service.runAttemptAnalysis(5);

      const updateArgs = (prisma.testStudentAnalysis.update.mock.calls as unknown[][])[0]?.[0] as {
        data: Record<string, unknown>;
      };

      return { data: updateArgs.data, warn };
    };

    beforeEach(() => jest.useFakeTimers().setSystemTime(NOW));

    it('writes the reason and the retry deadline of a provider outage, and logs the code', async () => {
      const { data, warn } = await run(plainAttempt(), providerFailure(503, 'upstream down'));

      expect(data).toMatchObject({
        status: 'FAILED',
        summary: {
          llm: {
            reason: 'PROVIDER_ERROR',
            httpStatus: 503,
            autoRetries: 0,
            nextRetryAtMs: NOW.getTime() + 10 * MINUTE,
          },
        },
      });
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn).toHaveBeenCalledWith(
        expect.stringMatching(
          /^Analysis 77 of attempt 5 failed: reason=PROVIDER_ERROR http=503 autoRetries=0\/3 nextRetry=/,
        ),
      );
    });

    it('logs a revoked key without the key, the provider text or the prompt, and sets no retry', async () => {
      const { data, warn } = await run(plainAttempt(), providerFailure(401));

      expect(data.summary).toMatchObject({ llm: { reason: 'AUTH', httpStatus: 401 } });
      expect(data.summary).not.toHaveProperty('llm.nextRetryAtMs');
      const logged = String(warn.mock.calls[0]?.[0]);

      expect(logged).toContain('reason=AUTH');
      expect(logged).not.toContain('sk-live');
      expect(logged).not.toContain('Incorrect');
      expect(logged).not.toContain('Иванов');
    });

    it('lengthens the pause when a retry fails again and stops after the third', async () => {
      const second = await run(
        plainAttempt({ llm: { status: 'pending', autoRetries: 1 } }),
        providerFailure(503),
      );
      const last = await run(
        plainAttempt({ llm: { status: 'pending', autoRetries: 3 } }),
        providerFailure(503),
      );

      expect(second.data.summary).toMatchObject({
        llm: { autoRetries: 1, nextRetryAtMs: NOW.getTime() + 30 * MINUTE },
      });
      expect(last.data.summary).toMatchObject({ llm: { autoRetries: 3 } });
      expect(last.data.summary).not.toHaveProperty('llm.nextRetryAtMs');
    });

    it('records an invalid AI answer without scheduling a paid retry', async () => {
      const { data } = await run(plainAttempt(), new SyntaxError('Unexpected token'));

      expect(data.summary).toMatchObject({ llm: { reason: 'INVALID_RESPONSE' } });
      expect(data.summary).not.toHaveProperty('llm.nextRetryAtMs');
    });

    it('keeps the prof-orientation record READY and puts the failure into llm', async () => {
      const attempt = plainAttempt(profSummary({ status: 'pending', autoRetries: 1 }));
      const { data, warn } = await run(
        {
          ...attempt,
          topicVersion: { ...attempt.topicVersion, scoringKind: 'PROF_ORIENTATION_V3_PLUS' },
        },
        providerFailure(429),
      );

      expect(data).toMatchObject({ providerMode: 'ALGORITHM_LLM', status: 'READY' });
      expect(getProfOrientationLlmStatus(data.summary)).toBe('failed');
      expect(data.summary).toMatchObject({
        atlas: { professions: [{ title: 'ATLAS-MARKER' }] },
        llm: {
          reason: 'RATE_LIMITED',
          httpStatus: 429,
          autoRetries: 1,
          nextRetryAtMs: NOW.getTime() + 30 * MINUTE,
        },
      });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Analysis 77 of attempt 5 failed: reason=RATE_LIMITED'),
      );
    });
  });
});
