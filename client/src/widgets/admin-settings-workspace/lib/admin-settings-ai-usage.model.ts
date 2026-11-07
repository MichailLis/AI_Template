import type {
  AdminAiUsageSummaryResponseDto,
  AdminAiUsageSummaryResponseDtoByPurposeItemPurpose,
} from '@/shared/api/model';

export type AiUsageSummaryData = AdminAiUsageSummaryResponseDto;
export type AiUsageBucket = AiUsageSummaryData['totals'];

export type AiUsagePeriod = 'today' | 'week' | 'month';

export const AI_USAGE_PERIODS: ReadonlyArray<{
  value: AiUsagePeriod;
  label: string;
  /** Сколько календарных дней входит в период, считая сегодняшний. */
  days: number;
}> = [
  { value: 'today', label: 'Сегодня', days: 1 },
  { value: 'week', label: '7 дней', days: 7 },
  { value: 'month', label: '30 дней', days: 30 },
];

/**
 * Начало периода — полночь по часовому поясу браузера. Сервер получает момент, а не дату, и поясов
 * не знает: «сегодня» админа в Новосибирске начинается раньше, чем в Москве. Сборка из локальных
 * компонентов, а не вычитание 24 часов, не сбивается в дни перехода на летнее время.
 */
export const getAiUsagePeriodStart = (days: number, now = new Date()) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

export const aiUsagePurposeLabels: Record<
  AdminAiUsageSummaryResponseDtoByPurposeItemPurpose,
  string
> = {
  STUDENT_ANALYSIS: 'Анализ попытки',
  PROF_ORIENTATION_ENRICHMENT: 'Обогащение профориентации',
  TEST_GENERATION: 'Генерация вопросов',
  PROMPT_SIMULATION: 'Симуляция промпта',
  CONNECTION_CHECK: 'Проверка связи',
};

const integerFormatter = new Intl.NumberFormat('ru-RU');
// Отображение, а не расчёт: суммы считает сервер в Decimal и присылает строкой.
const costFormatter = new Intl.NumberFormat('ru-RU', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export const formatAiUsageCount = (value: number) => integerFormatter.format(value);

export const formatAiUsageCost = (cost: string) => costFormatter.format(Number(cost));
