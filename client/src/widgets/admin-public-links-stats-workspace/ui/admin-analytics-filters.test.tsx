import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsReportFiltersSection } from './admin-analytics-filters';

const renderFilters = () => {
  const props = {
    analyticsScope: 'TOPIC' as const,
    onAnalyticsScopeChange: vi.fn(),
    analyticsLinkStatus: 'ALL' as const,
    onAnalyticsLinkStatusChange: vi.fn(),
    analyticsDateFrom: '2026-09-01',
    onAnalyticsDateFromChange: vi.fn(),
    analyticsDateTo: '',
    onAnalyticsDateToChange: vi.fn(),
  };

  render(
    <MemoryRouter>
      <AnalyticsReportFiltersSection {...props} />
    </MemoryRouter>,
  );

  return props;
};

/**
 * Находка аудита UX-09: «Дата с/по» были нативными полями даты с маской `mm/dd/yyyy` в
 * англоязычном браузере, и период отчёта легко было задать с перепутанными днём и месяцем.
 */
describe('AnalyticsReportFiltersSection date filters', () => {
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
