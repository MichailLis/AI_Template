import { Prisma } from '@prisma/client';

import type { PrismaService } from '../../prisma.service';
import { isRecord } from '../../common/type-guards';
import { readAutoRetries, readNextRetryAtMs } from './analysis-failure';
import { canRestartAnalysis } from './analysis-result-kind';

const NEXT_RETRY_PATH = ['llm', 'nextRetryAtMs'];

/** Сколько упавших анализов один запрос «перезапустить все» возвращает в очередь. */
export const RESTART_BATCH_LIMIT = 200;

/** Завершённые попытки, у которых есть чем считать: без промпта у версии теста задача ничего не делает. */
const restartableAttempt = (linkId?: number): Prisma.TestStudentAttemptWhereInput => ({
  status: 'COMPLETED',
  ...(linkId === undefined ? {} : { publicLinkId: linkId }),
  topicVersion: { analysisPromptVersionId: { not: null } },
});

/**
 * Записи, где ИИ-анализ упал: обычный (`FAILED`) и обогащение профориентации (`llm.status: failed`
 * при `READY` алгоритмической записи). Это тот же признак, что `canRestartAnalysis`, на языке БД.
 */
const llmFailed = (
  ...extra: Prisma.TestStudentAnalysisWhereInput[]
): Prisma.TestStudentAnalysisWhereInput => ({
  OR: [
    { AND: [{ status: 'FAILED', providerMode: 'LLM' }, ...extra] },
    {
      AND: [
        {
          status: 'READY',
          providerMode: 'ALGORITHM_LLM',
          summary: { path: ['llm', 'status'], equals: 'failed' },
        },
        ...extra,
      ],
    },
  ],
});

/** Число для кнопки «Перезапустить неудачные (N)». */
export const countFailedAnalyses = (prisma: PrismaService, linkId: number) =>
  prisma.testStudentAnalysis.count({
    where: { ...llmFailed(), attempt: restartableAttempt(linkId) },
  });

/** Попытки с упавшим анализом: по ссылке (ручной массовый перезапуск) или те, чей автоповтор созрел. */
export const findFailedAttemptIds = async (
  prisma: PrismaService,
  options: { linkId?: number; retryDueAt?: Date; take: number },
) => {
  const due: Prisma.TestStudentAnalysisWhereInput[] = options.retryDueAt
    ? [{ summary: { path: NEXT_RETRY_PATH, lte: options.retryDueAt.getTime() } }]
    : [];
  const analyses = await prisma.testStudentAnalysis.findMany({
    where: { ...llmFailed(...due), attempt: restartableAttempt(options.linkId) },
    select: { attemptId: true },
    orderBy: { updatedAt: 'asc' },
    take: options.take,
  });

  return analyses.map((analysis) => analysis.attemptId);
};

/**
 * Переводит упавший анализ обратно в ожидание под блокировкой строки: из нескольких одновременных
 * запросов (двойной клик, ручной перезапуск и проход восстановления) побеждает ровно один, как при
 * `finish` побеждает тот, кто переключил попытку в `COMPLETED`. Остальные видят уже не «упал» и
 * получают `false`: второй платный вызов не создаётся.
 *
 * Ручной перезапуск начинает серию автоповторов заново. С `retryDueAt` это сам автоповтор: он
 * срабатывает, только если срок ещё не вышел, и увеличивает счётчик серии.
 */
export const claimFailedAnalysis = (prisma: PrismaService, attemptId: number, retryDueAt?: Date) =>
  prisma.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<
      Array<{ id: number; status: string; providerMode: string; summary: Prisma.JsonValue }>
    >`
      SELECT id, status::text AS status, "providerMode"::text AS "providerMode", summary
      FROM test_student_analyses WHERE "attemptId" = ${attemptId} FOR UPDATE
    `;

    if (!row || !canRestartAnalysis(row)) {
      return false;
    }

    if (retryDueAt) {
      const nextRetryAtMs = readNextRetryAtMs(row.summary);

      if (nextRetryAtMs === null || nextRetryAtMs > retryDueAt.getTime()) {
        return false;
      }
    }

    const attempt = await tx.testStudentAttempt.findFirst({
      where: { id: attemptId, ...restartableAttempt() },
      select: { id: true },
    });

    if (!attempt) {
      return false;
    }

    const pending = retryDueAt
      ? { status: 'pending', autoRetries: readAutoRetries(row.summary) + 1 }
      : { status: 'pending' };

    await tx.testStudentAnalysis.update({
      where: { id: row.id },
      data:
        row.providerMode === 'LLM'
          ? {
              status: 'PENDING',
              errorMessage: null,
              generatedAt: null,
              summary: retryDueAt ? { llm: pending } : Prisma.JsonNull,
            }
          : {
              errorMessage: null,
              summary: { ...(isRecord(row.summary) ? row.summary : {}), llm: pending },
            },
    });

    return true;
  });
