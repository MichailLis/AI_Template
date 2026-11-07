import type { AdminTestAnalyticsSummaryDto } from '@/shared/api/model';

/**
 * Показывать ли в отчёте разделы методики V3+: направления, пары, баллы, профили и флаги.
 *
 * Для теста на другой методике эти разделы пусты всегда, и «0% от готового анализа» читалось как
 * сбой анализа. Методика берётся из опубликованной версии, но разделы остаются и тогда, когда
 * V3+ результаты уже есть: их могли дать прохождения более ранней версии того же теста.
 */
export const hasV3PlusReport = (summary: AdminTestAnalyticsSummaryDto) =>
  summary.topic.scoringKind === 'PROF_ORIENTATION_V3_PLUS' || summary.coverage.v3Results > 0;
