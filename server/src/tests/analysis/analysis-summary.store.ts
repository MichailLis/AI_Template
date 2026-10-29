import type { Prisma } from '@prisma/client';

import type { PrismaService } from '../../prisma.service';

/**
 * Пишет один ключ `summary` поверх текущей строки под блокировкой. Атлас (finish и GET /result)
 * и LLM (фоновая задача) пишут `summary` независимо; запись целиком из прочитанной раньше копии
 * затирала чужой ключ — например, возвращала `llm.status: pending` поверх готового AI-текста.
 */
export const mergeAnalysisSummaryKey = (
  prisma: PrismaService,
  analysisId: number,
  key: 'atlas' | 'llm',
  value: unknown,
  data: Omit<Prisma.TestStudentAnalysisUncheckedUpdateInput, 'summary'> = {},
) =>
  prisma.$transaction(async (tx) => {
    const [row] = await tx.$queryRaw<Array<{ summary: Prisma.JsonValue }>>`
      SELECT summary FROM test_student_analyses WHERE id = ${analysisId} FOR UPDATE
    `;

    if (!row) {
      return;
    }

    const summary = { ...(row.summary as Prisma.JsonObject), [key]: value };

    await tx.testStudentAnalysis.update({
      where: { id: analysisId },
      data: { ...data, summary: summary as Prisma.InputJsonValue },
    });
  });
