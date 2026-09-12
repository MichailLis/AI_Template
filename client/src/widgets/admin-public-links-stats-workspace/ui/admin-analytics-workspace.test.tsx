import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminAnalyticsWorkspace } from './admin-analytics-workspace';

vi.mock('./analytics-report-tab', () => ({
  AnalyticsReportTab: () => <div>report tab</div>,
}));

vi.mock('./analytics-attempts-tab', () => ({
  AnalyticsAttemptsTab: () => <div>attempts tab</div>,
}));

const useAnalyticsReportMock = vi.fn((..._args: unknown[]) => ({
  analyticsScope: 'TOPIC',
  analyticsLinkStatus: 'ALL',
  analyticsDateFrom: '',
  analyticsDateTo: '',
  handleAnalyticsScopeChange: vi.fn(),
  handleAnalyticsLinkStatusChange: vi.fn(),
  handleAnalyticsDateFromChange: vi.fn(),
  handleAnalyticsDateToChange: vi.fn(),
}));

vi.mock('./use-admin-public-links-analytics-report', () => ({
  useAnalyticsReport: (...args: unknown[]) => useAnalyticsReportMock(...args),
}));

const publicLinksData = {
  activePublicLinks: [],
  archivedPublicLinks: [],
  isPublicLinksError: false,
  isPublicLinksLoading: false,
  refetchPublicLinks: vi.fn(),
};

vi.mock('./use-admin-public-links-selection', () => ({
  usePublicLinksData: () => publicLinksData,
  usePublicLinkSelection: () => ({
    publicLinksTab: 'active',
    topicOptions: [],
    effectiveTopicId: null,
    linksForTopic: [],
    effectivePublicLinkId: null,
    linkAttemptsCountById: new Map(),
    selectedPublicLink: null,
    attemptsPage: 1,
    setAttemptsPage: vi.fn(),
    setSelectedPublicLinkId: vi.fn(),
    handleTabChange: vi.fn(),
    handleTopicChange: vi.fn(),
  }),
}));

const renderWorkspace = (initialEntry: string) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AdminAnalyticsWorkspace />
    </MemoryRouter>,
  );

describe('AdminAnalyticsWorkspace', () => {
  afterEach(cleanup);

  it('renders one filters block and the report tab by default', () => {
    renderWorkspace('/admin/analytics');

    expect(screen.getAllByRole('region', { name: 'Фильтры' })).toHaveLength(1);
    expect(screen.getByText('report tab')).toBeInTheDocument();
    expect(screen.queryByText('attempts tab')).not.toBeInTheDocument();
  });

  it('opens the attempts tab from the tab query parameter', () => {
    renderWorkspace('/admin/analytics?tab=attempts');

    expect(screen.getByText('attempts tab')).toBeInTheDocument();
    expect(screen.queryByText('report tab')).not.toBeInTheDocument();
    expect(screen.getAllByRole('region', { name: 'Фильтры' })).toHaveLength(1);
  });

  /**
   * Находка аудита UX-08: параметры отчёта стояли отдельной панелью под навигацией. Теперь они в
   * том же блоке фильтров и только на вкладке отчёта, где что-то меняют.
   */
  it('shows the report parameters in the filters block only on the report tab', async () => {
    const user = userEvent.setup();
    renderWorkspace('/admin/analytics');

    const filters = screen.getByRole('region', { name: 'Фильтры' });
    expect(within(filters).getByLabelText('Сводка')).toBeInTheDocument();
    expect(useAnalyticsReportMock).toHaveBeenLastCalledWith(null, null, true);

    await user.click(screen.getByRole('tab', { name: 'Прохождения' }));

    expect(screen.queryByLabelText('Сводка')).not.toBeInTheDocument();
    expect(useAnalyticsReportMock).toHaveBeenLastCalledWith(null, null, false);
  });

  it('reports a failed link load instead of pretending there is no data', async () => {
    const user = userEvent.setup();
    publicLinksData.isPublicLinksError = true;

    try {
      renderWorkspace('/admin/analytics');

      expect(screen.getByText(/Не удалось загрузить публичные ссылки/)).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Фильтры' })).not.toBeInTheDocument();
      expect(screen.queryByText('report tab')).not.toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Повторить' }));

      expect(publicLinksData.refetchPublicLinks).toHaveBeenCalled();
    } finally {
      publicLinksData.isPublicLinksError = false;
    }
  });

  it('switches between both tabs without leaving the section', async () => {
    const user = userEvent.setup();
    renderWorkspace('/admin/analytics');

    await user.click(screen.getByRole('tab', { name: 'Прохождения' }));
    expect(screen.getByText('attempts tab')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Сводный отчет' }));
    expect(screen.getByText('report tab')).toBeInTheDocument();
  });
});
