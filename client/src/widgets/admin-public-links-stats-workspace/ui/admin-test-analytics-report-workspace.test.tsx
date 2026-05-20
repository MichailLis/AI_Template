import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminTestAnalyticsReportWorkspace } from './admin-test-analytics-report-workspace';

import type { ReactNode } from 'react';

vi.mock('./public-links-stats-filters-card', () => ({
  TestAnalyticsReportFiltersCard: () => <div>analytics report filters</div>,
}));

vi.mock('./test-analytics-summary-card', () => ({
  TestAnalyticsSummaryCard: ({ actions }: { actions: ReactNode }) => (
    <div>
      analytics summary card
      {actions}
    </div>
  ),
}));

vi.mock('./test-analytics-breakdown-table', () => ({
  TestAnalyticsBreakdownTables: () => <div>analytics breakdown tables</div>,
}));

vi.mock('./test-analytics-export-actions', () => ({
  TestAnalyticsExportActions: () => <div>analytics export actions</div>,
}));

vi.mock('./use-admin-public-links-stats-workspace', () => ({
  useAdminTestAnalyticsReportWorkspace: () => ({
    publicLinksTab: 'active',
    topicOptions: [],
    effectiveTopicId: null,
    linksForTopic: [],
    effectivePublicLinkId: null,
    linkAttemptsCountById: new Map(),
    analyticsScope: 'TOPIC',
    analyticsLinkStatus: 'ALL',
    analyticsDateFrom: '',
    analyticsDateTo: '',
    analyticsSummary: null,
    analyticsSummaryQuery: {
      isLoading: false,
      isFetching: false,
      isError: false,
    },
    analyticsExportFormat: null,
    analyticsExportError: null,
    isAnalyticsQueryEnabled: false,
    setSelectedPublicLinkId: vi.fn(),
    handleTabChange: vi.fn(),
    handleTopicChange: vi.fn(),
    handleAnalyticsScopeChange: vi.fn(),
    handleAnalyticsLinkStatusChange: vi.fn(),
    handleAnalyticsDateFromChange: vi.fn(),
    handleAnalyticsDateToChange: vi.fn(),
    handleExportAnalytics: vi.fn(),
  }),
}));

describe('AdminTestAnalyticsReportWorkspace', () => {
  it('renders filters, summary, breakdowns and export actions for the report page', () => {
    render(<AdminTestAnalyticsReportWorkspace />);

    expect(screen.getByText('analytics report filters')).toBeInTheDocument();
    expect(screen.getByText('analytics summary card')).toBeInTheDocument();
    expect(screen.getByText('analytics breakdown tables')).toBeInTheDocument();
    expect(screen.getByText('analytics export actions')).toBeInTheDocument();
  });
});
