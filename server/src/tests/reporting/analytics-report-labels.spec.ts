import {
  buildReportConfidenceRows,
  buildReportFilterRows,
  getReportAnalysisStatusLabel,
  getReportAttemptStatusLabel,
  getReportValueLabel,
} from './analytics-report-labels';
import type { AdminTestAnalyticsSummaryDto } from '../dto/tests-analytics.dto';

const createSummaryPart = (
  overrides: Partial<Pick<AdminTestAnalyticsSummaryDto, 'filters' | 'confidence'>> = {},
): Pick<AdminTestAnalyticsSummaryDto, 'filters' | 'confidence'> => ({
  filters: {
    scope: 'TOPIC',
    publicLinkId: null,
    linkStatus: 'ALL',
    dateFrom: null,
    dateTo: null,
  },
  confidence: {
    levels: [],
    gap: { value: 11.5, total: 4 },
    consistencyIndex: { value: 0.4, total: 4 },
    readinessTop: { value: 4.2, total: 4 },
  },
  ...overrides,
});

/**
 * Найдено при UX-08 (ait-rcw.29): выгружаемый наружу отчет печатал служебные ключи — Gap,
 * Consistency Index, scope: TOPIC — и ставил знак процента у отрыва лидера, который считается в
 * баллах. Строки собираются здесь, поэтому их текст проверяется без разбора PDF.
 */
describe('analytics report labels', () => {
  it('names report filters in Russian instead of printing request keys', () => {
    const rows = buildReportFilterRows(
      createSummaryPart({
        filters: {
          scope: 'PUBLIC_LINK',
          publicLinkId: 12,
          linkStatus: 'ARCHIVED',
          dateFrom: '2026-05-01',
          dateTo: null,
        },
      }).filters,
    );

    expect(rows).toEqual([
      { label: 'Охват', value: 'Выбранная ссылка' },
      { label: 'Ссылка', value: '12' },
      { label: 'Ссылки в отчете', value: 'Архивные' },
      { label: 'Период с', value: '2026-05-01' },
      { label: 'Период по', value: 'не задан' },
    ]);
  });

  it('shows the leader gap in points and the consistency as a share of answers', () => {
    const rows = buildReportConfidenceRows(createSummaryPart().confidence);

    expect(rows).toEqual([
      { label: 'Отрыв лидера от второго направления', value: '11,5 балла' },
      { label: 'Доля ответов за ведущее направление', value: '40%' },
      { label: 'Готовность к ведущему направлению', value: '4,2' },
      { label: 'Результатов в расчете', value: '4' },
    ]);
    expect(JSON.stringify(rows)).not.toMatch(/Gap|Consistency|Readiness/);
  });

  it('uses the plural form for whole points', () => {
    const rows = buildReportConfidenceRows(
      createSummaryPart({
        confidence: {
          levels: [],
          gap: { value: 5, total: 1 },
          consistencyIndex: { value: 0, total: 1 },
          readinessTop: { value: 0, total: 1 },
        },
      }).confidence,
    );

    expect(rows[0]).toEqual({ label: 'Отрыв лидера от второго направления', value: '5 баллов' });
  });

  it('translates demographic codes, confidence levels and statuses, keeping unknown values', () => {
    expect(getReportValueLabel('FEMALE')).toBe('Женский');
    expect(getReportValueLabel('INCOMPLETE_HIGHER_FROM_YEAR_3')).toBe('Неоконченное высшее');
    expect(getReportValueLabel('broad')).toBe('Широкий профиль');
    expect(getReportValueLabel('Казань')).toBe('Казань');
    expect(getReportAttemptStatusLabel('COMPLETED')).toBe('Пройдено');
    expect(getReportAnalysisStatusLabel('READY')).toBe('Готов');
    expect(getReportAnalysisStatusLabel(null)).toBe('Нет анализа');
  });
});
