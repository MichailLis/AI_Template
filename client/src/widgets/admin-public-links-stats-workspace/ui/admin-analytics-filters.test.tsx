import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AdminAnalyticsNavigationCard,
  AnalyticsReportFilterFields,
} from './admin-analytics-filters';

const createReportFilterProps = (analyticsScope: 'TOPIC' | 'PUBLIC_LINK' = 'TOPIC') => ({
  analyticsScope,
  onAnalyticsScopeChange: vi.fn(),
  analyticsLinkStatus: 'ALL' as const,
  onAnalyticsLinkStatusChange: vi.fn(),
  analyticsDateFrom: '2026-09-01',
  onAnalyticsDateFromChange: vi.fn(),
  analyticsDateTo: '',
  onAnalyticsDateToChange: vi.fn(),
});

const renderFilters = (analyticsScope: 'TOPIC' | 'PUBLIC_LINK' = 'TOPIC') => {
  const props = createReportFilterProps(analyticsScope);

  render(
    <MemoryRouter>
      <AnalyticsReportFilterFields {...props} />
    </MemoryRouter>,
  );

  return props;
};

/**
 * Находка аудита UX-09: «Дата с/по» были нативными полями даты с маской `mm/dd/yyyy` в
 * англоязычном браузере, и период отчёта легко было задать с перепутанными днём и месяцем.
 */
describe('AnalyticsReportFilterFields date filters', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the report period in the Russian day-first format instead of a native date field', () => {
    renderFilters();

    const dateFrom = screen.getByLabelText('Дата с');

    expect(dateFrom).toHaveValue('01.09.2026');
    expect(dateFrom).not.toHaveAttribute('type', 'date');
    expect(screen.getByLabelText('Дата по')).toHaveAttribute('placeholder', 'ДД.ММ.ГГГГ');
  });

  it('reports the typed end date as the ISO date the analytics query sends', async () => {
    const user = userEvent.setup();
    const props = renderFilters();

    await user.type(screen.getByLabelText('Дата по'), '30092026');

    expect(props.onAnalyticsDateToChange).toHaveBeenLastCalledWith('2026-09-30');
  });
});

/**
 * Находка аудита UX-08: «Навигация по ссылкам» и «Параметры отчета» были двумя панелями, и ссылку
 * выбирали в одной, а решали, строить ли отчёт только по ней, — в другой.
 */
describe('AdminAnalyticsNavigationCard filters block', () => {
  afterEach(() => {
    cleanup();
  });

  it('puts the report parameters into the same filters block as the link selection', () => {
    render(
      <MemoryRouter>
        <AdminAnalyticsNavigationCard
          analyticsTab="report"
          onAnalyticsTabChange={vi.fn()}
          publicLinksTab="active"
          onTabChange={vi.fn()}
          topicOptions={[{ id: 1, title: 'Тест' }]}
          effectiveTopicId={1}
          onTopicChange={vi.fn()}
          linksForTopic={[{ id: 11, shortCode: 'LINK11' }]}
          effectivePublicLinkId={11}
          onPublicLinkChange={vi.fn()}
          linkAttemptsCountById={new Map([[11, 3]])}
          reportFilters={<AnalyticsReportFilterFields {...createReportFilterProps()} />}
        />
      </MemoryRouter>,
    );

    const filters = screen.getByRole('region', { name: 'Фильтры' });

    expect(within(filters).getByLabelText('Публичная ссылка')).toBeInTheDocument();
    expect(within(filters).getByLabelText('Сводка')).toBeInTheDocument();
    expect(within(filters).getByLabelText('Дата с')).toBeInTheDocument();
    expect(screen.queryByText('Параметры отчета')).not.toBeInTheDocument();
  });

  it('hides the link status filter when the report covers one link', () => {
    renderFilters('PUBLIC_LINK');

    expect(screen.queryByLabelText('Ссылки в отчете')).not.toBeInTheDocument();
  });

  it('keeps the link status filter for a whole-test report', () => {
    renderFilters();

    expect(screen.getByLabelText('Ссылки в отчете')).toBeInTheDocument();
  });
});
