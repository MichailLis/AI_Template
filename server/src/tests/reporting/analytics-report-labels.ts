import type { AdminTestAnalyticsSummaryDto } from '../dto/tests-analytics.dto';

/**
 * Подписи выгружаемого отчета (PDF и XLSX). Отчет уходит за пределы админки, поэтому в нем не
 * должно быть служебных ключей запроса (scope, linkStatus) и кодов (FEMALE, broad, COMPLETED).
 * Формулировки совпадают с экраном аналитики. Незнакомый код печатается как есть: новое значение
 * сервера не должно превращаться в пустую ячейку.
 */

export interface ReportRow {
  label: string;
  value: string;
}

const numberFormat = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 });

const formatNumber = (value: number) => numberFormat.format(value);

const pluralizeRu = (value: number, forms: [string, string, string]) => {
  if (!Number.isInteger(value)) {
    return forms[1];
  }

  const mod10 = value % 10;
  const mod100 = value % 100;

  if (mod10 === 1 && mod100 !== 11) {
    return forms[0];
  }

  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }

  return forms[2];
};

const labelOrRaw = (labels: Record<string, string>, value: string) => labels[value] ?? value;

const scopeLabels: Record<string, string> = {
  TOPIC: 'Весь тест',
  PUBLIC_LINK: 'Выбранная ссылка',
};

const linkStatusLabels: Record<string, string> = {
  ALL: 'Все',
  ACTIVE: 'Активные',
  ARCHIVED: 'Архивные',
};

const demographicValueLabels: Record<string, string> = {
  MALE: 'Мужской',
  FEMALE: 'Женский',
  BASIC_GENERAL: 'Основное общее',
  SECONDARY_GENERAL: 'Среднее общее',
  SECONDARY_SPECIAL: 'Среднее специальное',
  INCOMPLETE_HIGHER_FROM_YEAR_3: 'Неоконченное высшее',
  HIGHER: 'Высшее',
};

/** Уровни уверенности результата методики v3+ (prof-orientation-v3-plus/scoring.ts). */
const confidenceLevelLabels: Record<string, string> = {
  high: 'Высокая',
  medium: 'Средняя',
  mixed: 'Смешанная',
  broad: 'Широкий профиль',
  low: 'Низкая',
};

const attemptStatusLabels: Record<string, string> = {
  IN_PROGRESS: 'В процессе',
  COMPLETED: 'Пройдено',
  EXPIRED: 'Истекло',
  ABANDONED: 'Брошено',
};

const analysisStatusLabels: Record<string, string> = {
  PENDING: 'В очереди',
  READY: 'Готов',
  FAILED: 'Ошибка',
};

const llmStatusLabels: Record<string, string> = {
  ready: 'ИИ готов',
  pending: 'ИИ в обработке',
  failed: 'ИИ ошибка',
  not_requested: 'ИИ не запрашивался',
};

export const getReportValueLabel = (value: string) =>
  labelOrRaw({ ...demographicValueLabels, ...confidenceLevelLabels }, value);

export const getReportAttemptStatusLabel = (status: string) =>
  labelOrRaw(attemptStatusLabels, status);

export const getReportAnalysisStatusLabel = (status: string | null | undefined) =>
  status ? labelOrRaw(analysisStatusLabels, status) : 'Нет анализа';

export const getReportLlmStatusLabel = (status: string | null | undefined) =>
  status ? labelOrRaw(llmStatusLabels, status) : '—';

export const buildReportFilterRows = (
  filters: AdminTestAnalyticsSummaryDto['filters'],
): ReportRow[] => [
  { label: 'Охват', value: labelOrRaw(scopeLabels, filters.scope) },
  {
    label: 'Ссылка',
    value: filters.publicLinkId === null ? 'не выбрана' : String(filters.publicLinkId),
  },
  { label: 'Ссылки в отчете', value: labelOrRaw(linkStatusLabels, filters.linkStatus) },
  { label: 'Период с', value: filters.dateFrom ?? 'не задан' },
  { label: 'Период по', value: filters.dateTo ?? 'не задан' },
];

/**
 * Отрыв лидера — разница баллов первого и второго направления, а не процент. Согласованность —
 * доля ответов за ведущее направление (от 0 до 1), поэтому печатается процентом. Готовность —
 * среднее по шкале слайдеров готовности, без единицы.
 */
export const buildReportConfidenceRows = (
  confidence: AdminTestAnalyticsSummaryDto['confidence'],
): ReportRow[] => [
  {
    label: 'Отрыв лидера от второго направления',
    value: `${formatNumber(confidence.gap.value)} ${pluralizeRu(confidence.gap.value, ['балл', 'балла', 'баллов'])}`,
  },
  {
    label: 'Доля ответов за ведущее направление',
    value: `${Math.round(confidence.consistencyIndex.value * 100)}%`,
  },
  {
    label: 'Готовность к ведущему направлению',
    value: formatNumber(confidence.readinessTop.value),
  },
  { label: 'Результатов в расчете', value: String(confidence.gap.total) },
];
