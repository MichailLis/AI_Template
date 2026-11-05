import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { AiUsagePurpose, AiUsageStatus } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { AI_USAGE_PURPOSES, type AiUsageRecordInput } from './ai-usage';

/** Знаков после запятой в стоимости: столько хранит колонка `Decimal(18, 8)`. */
const COST_FRACTION_DIGITS = 8;

/** Итог по группе вызовов. */
export interface AiUsageBucket {
  calls: number;
  failedCalls: number;
  /** Успешные вызовы, где провайдер не прислал стоимость: сумма стоимости по ним занижена. */
  callsWithoutCost: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  /** Сумма в единицах счёта провайдера. Decimal строкой, а не число с плавающей точкой. */
  cost: string;
}

export interface AiUsageSummary {
  totals: AiUsageBucket;
  byPurpose: Array<AiUsageBucket & { purpose: AiUsagePurpose }>;
  /** Модель из ответа провайдера; у вызова без ответа — запрошенная. */
  byModel: Array<AiUsageBucket & { model: string }>;
}

interface GroupRow {
  status: AiUsageStatus;
  _count: { _all: number; cost: number };
  _sum: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
    cost: Prisma.Decimal | null;
  };
}

type Accumulator = Omit<AiUsageBucket, 'cost'> & { cost: Prisma.Decimal };

const emptyAccumulator = (): Accumulator => ({
  calls: 0,
  failedCalls: 0,
  callsWithoutCost: 0,
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  cost: new Prisma.Decimal(0),
});

const addRow = (acc: Accumulator, row: GroupRow) => {
  acc.calls += row._count._all;
  if (row.status === 'FAILED') {
    acc.failedCalls += row._count._all;
  } else {
    acc.callsWithoutCost += row._count._all - row._count.cost;
  }
  acc.promptTokens += row._sum.promptTokens ?? 0;
  acc.completionTokens += row._sum.completionTokens ?? 0;
  acc.totalTokens += row._sum.totalTokens ?? 0;
  acc.cost = acc.cost.plus(row._sum.cost ?? 0);
};

const toBucket = (acc: Accumulator): AiUsageBucket => ({
  ...acc,
  cost: acc.cost.toFixed(COST_FRACTION_DIGITS),
});

const groupInto = <R extends GroupRow, K>(rows: R[], keyOf: (row: R) => K) => {
  const groups = new Map<K, Accumulator>();
  rows.forEach((row) => {
    const key = keyOf(row);
    const acc = groups.get(key) ?? emptyAccumulator();
    addRow(acc, row);
    groups.set(key, acc);
  });
  return groups;
};

const AGGREGATES = {
  _count: { _all: true, cost: true },
  _sum: { promptTokens: true, completionTokens: true, totalTokens: true, cost: true },
} as const;

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Записывает один вызов провайдера. Учёт вторичен: его сбой не должен ронять анализ, который уже
   * оплачен, поэтому ошибка уходит в лог предупреждением и не пробрасывается. В лог идёт только
   * текст ошибки базы: промпта и ответа модели в записи нет.
   */
  async record(input: AiUsageRecordInput): Promise<void> {
    try {
      await this.prisma.aiUsageEvent.create({
        data: {
          purpose: input.purpose,
          status: input.status,
          provider: input.provider,
          requestedModel: input.requestedModel,
          actualModel: input.actualModel,
          promptTokens: input.promptTokens,
          completionTokens: input.completionTokens,
          totalTokens: input.totalTokens,
          cost: input.cost === undefined ? undefined : new Prisma.Decimal(input.cost),
          durationMs: Math.max(0, Math.round(input.durationMs)),
          failureReason: input.failureReason,
          attemptId: input.attemptId,
          actorUserId: input.actorUserId,
        },
      });
    } catch (error) {
      this.logger.warn(
        `AI usage of ${input.purpose} was not recorded: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }

  /** Итоги вызовов в `[from, to)`: общие, по виду вызова и по модели. */
  async summarize(from: Date, to: Date): Promise<AiUsageSummary> {
    const where = { createdAt: { gte: from, lt: to } };
    const [purposeRows, modelRows] = await Promise.all([
      this.prisma.aiUsageEvent.groupBy({ by: ['purpose', 'status'], where, ...AGGREGATES }),
      this.prisma.aiUsageEvent.groupBy({
        by: ['requestedModel', 'actualModel', 'status'],
        where,
        ...AGGREGATES,
      }),
    ]);

    const totals = emptyAccumulator();
    purposeRows.forEach((row) => addRow(totals, row));
    const byPurpose = groupInto(purposeRows, (row) => row.purpose);
    const byModel = groupInto(modelRows, (row) => row.actualModel ?? row.requestedModel);

    return {
      totals: toBucket(totals),
      byPurpose: AI_USAGE_PURPOSES.flatMap((purpose) => {
        const acc = byPurpose.get(purpose);
        return acc ? [{ purpose, ...toBucket(acc) }] : [];
      }),
      byModel: [...byModel]
        .sort(([, a], [, b]) => b.cost.comparedTo(a.cost) || b.calls - a.calls)
        .map(([model, acc]) => ({ model, ...toBucket(acc) })),
    };
  }
}
