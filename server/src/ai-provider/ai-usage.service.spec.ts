import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { PrismaService } from '../prisma.service';
import type { AiUsageRecordInput } from './ai-usage';
import { AiUsageService } from './ai-usage.service';

const baseRecord: AiUsageRecordInput = {
  purpose: 'STUDENT_ANALYSIS',
  status: 'SUCCESS',
  provider: 'polza',
  requestedModel: 'm-requested',
  durationMs: 1_234.6,
};

const decimal = (value: string) => new Prisma.Decimal(value);

const row = (
  key: Record<string, string | null>,
  status: 'SUCCESS' | 'FAILED',
  calls: number,
  costed: number,
  sum: { prompt?: number; completion?: number; total?: number; cost?: string },
) => ({
  ...key,
  status,
  _count: { _all: calls, cost: costed },
  _sum: {
    promptTokens: sum.prompt ?? null,
    completionTokens: sum.completion ?? null,
    totalTokens: sum.total ?? null,
    cost: sum.cost === undefined ? null : decimal(sum.cost),
  },
});

describe('AiUsageService', () => {
  const create = jest.fn<Promise<unknown>, [{ data: Record<string, unknown> }]>();
  const groupBy = jest.fn();
  const service = new AiUsageService({
    aiUsageEvent: { create, groupBy },
  } as unknown as PrismaService);

  afterEach(() => {
    jest.restoreAllMocks();
    create.mockReset();
    groupBy.mockReset();
  });

  describe('record', () => {
    it('stores the cost as an exact Decimal and the duration as whole milliseconds', async () => {
      create.mockResolvedValue({});

      await service.record({
        ...baseRecord,
        actualModel: 'm-actual',
        promptTokens: 100,
        completionTokens: 20,
        totalTokens: 120,
        cost: 0.115,
        attemptId: 5,
        actorUserId: 9,
      });

      const { data } = create.mock.calls[0][0];
      expect(Prisma.Decimal.isDecimal(data.cost)).toBe(true);
      expect(String(data.cost)).toBe('0.115');
      expect(data).toMatchObject({
        purpose: 'STUDENT_ANALYSIS',
        status: 'SUCCESS',
        provider: 'polza',
        requestedModel: 'm-requested',
        actualModel: 'm-actual',
        totalTokens: 120,
        durationMs: 1_235,
        attemptId: 5,
        actorUserId: 9,
      });
    });

    it('leaves the cost empty when the provider sent none', async () => {
      create.mockResolvedValue({});

      await service.record(baseRecord);

      const { data } = create.mock.calls[0][0];
      expect(data.cost).toBeUndefined();
      expect(data.attemptId).toBeUndefined();
    });

    it('swallows a storage failure and only warns, so the analysis it belongs to survives', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
      create.mockRejectedValue(new Error('connection refused'));

      await expect(service.record(baseRecord)).resolves.toBeUndefined();

      expect(warn).toHaveBeenCalledTimes(1);
      expect(String(warn.mock.calls[0][0])).toContain('STUDENT_ANALYSIS');
      expect(String(warn.mock.calls[0][0])).toContain('connection refused');
    });
  });

  describe('summarize', () => {
    const from = new Date('2026-11-04T21:00:00.000Z');
    const to = new Date('2026-11-05T10:00:00.000Z');

    it('asks for the half-open period [from, to)', async () => {
      groupBy.mockResolvedValue([]);

      await service.summarize(from, to);

      for (const [args] of groupBy.mock.calls as Array<[{ where: unknown }]>) {
        expect(args.where).toEqual({ createdAt: { gte: from, lt: to } });
      }
    });

    it('returns zeros for an empty period', async () => {
      groupBy.mockResolvedValue([]);

      const summary = await service.summarize(from, to);

      expect(summary.totals).toEqual({
        calls: 0,
        failedCalls: 0,
        callsWithoutCost: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: '0.00000000',
      });
      expect(summary.byPurpose).toEqual([]);
      expect(summary.byModel).toEqual([]);
    });

    it('sums by purpose and model, counts failures and calls without cost', async () => {
      groupBy.mockImplementation((args: { by: string[] }) =>
        Promise.resolve(
          args.by.includes('purpose')
            ? [
                row({ purpose: 'PROMPT_SIMULATION' }, 'SUCCESS', 1, 1, {
                  prompt: 10,
                  completion: 5,
                  total: 15,
                  cost: '0.2',
                }),
                row({ purpose: 'STUDENT_ANALYSIS' }, 'SUCCESS', 3, 2, {
                  prompt: 300,
                  completion: 60,
                  total: 360,
                  cost: '0.1',
                }),
                row({ purpose: 'STUDENT_ANALYSIS' }, 'FAILED', 2, 0, {}),
              ]
            : [
                row({ requestedModel: 'm-a', actualModel: 'm-a' }, 'SUCCESS', 2, 2, {
                  prompt: 200,
                  completion: 40,
                  total: 240,
                  cost: '0.1',
                }),
                row({ requestedModel: 'm-a', actualModel: 'm-b' }, 'SUCCESS', 1, 1, {
                  prompt: 100,
                  completion: 20,
                  total: 120,
                  cost: '0.2',
                }),
                row({ requestedModel: 'm-b', actualModel: null }, 'FAILED', 2, 0, {}),
                row({ requestedModel: 'm-b', actualModel: 'm-b' }, 'SUCCESS', 1, 0, {
                  prompt: 10,
                  completion: 5,
                  total: 15,
                }),
              ],
        ),
      );

      const summary = await service.summarize(from, to);

      // 0.1 + 0.2 stays exactly 0.3: Decimal, not float.
      expect(summary.totals).toEqual({
        calls: 6,
        failedCalls: 2,
        callsWithoutCost: 1,
        promptTokens: 310,
        completionTokens: 65,
        totalTokens: 375,
        cost: '0.30000000',
      });
      expect(summary.byPurpose.map((entry) => entry.purpose)).toEqual([
        'STUDENT_ANALYSIS',
        'PROMPT_SIMULATION',
      ]);
      expect(summary.byPurpose[0]).toMatchObject({
        calls: 5,
        failedCalls: 2,
        callsWithoutCost: 1,
        cost: '0.10000000',
      });
      // The answered model wins over the requested one; a call without an answer stays under what was asked.
      expect(summary.byModel.map((entry) => [entry.model, entry.calls, entry.cost])).toEqual([
        ['m-b', 4, '0.20000000'],
        ['m-a', 2, '0.10000000'],
      ]);
    });
  });
});
