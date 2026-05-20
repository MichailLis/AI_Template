import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminPublicLinksStatsWorkspace } from './admin-public-links-stats-workspace';

vi.mock('./public-links-stats-filters-card', () => ({
  PublicLinksStatsFiltersCard: () => <div>public links filters</div>,
}));

vi.mock('./public-links-attempts-table-card', () => ({
  PublicLinksAttemptsTableCard: () => <div>attempts table</div>,
}));

vi.mock('./public-links-attempt-detail-dialog', () => ({
  PublicLinksAttemptDetailDialog: () => <div>attempt detail dialog</div>,
}));

vi.mock('./use-admin-public-links-stats-workspace', () => ({
  useAdminPublicLinksStatsWorkspace: () => ({
    publicLinksTab: 'active',
    topicOptions: [],
    effectiveTopicId: null,
    linksForTopic: [],
    effectivePublicLinkId: null,
    linkAttemptsCountById: new Map(),
    selectedPublicLink: null,
    publicAttempts: [],
    publicAttemptsPage: 1,
    publicAttemptsTotal: 0,
    publicAttemptsTotalPages: 1,
    publicAttemptsQuery: {
      isLoading: false,
      isFetching: false,
    },
    detailView: null,
    detailAttempt: null,
    attemptDetailQuery: {
      isLoading: false,
    },
    isDetailDialogOpen: false,
    setSelectedPublicLinkId: vi.fn(),
    handleTabChange: vi.fn(),
    handleTopicChange: vi.fn(),
    handleOpenAttemptDetails: vi.fn(),
    handleCloseAttemptDetails: vi.fn(),
    handlePreviousAttemptsPage: vi.fn(),
    handleNextAttemptsPage: vi.fn(),
  }),
}));

describe('AdminPublicLinksStatsWorkspace', () => {
  it('renders public link attempts without the summary analytics report', () => {
    render(<AdminPublicLinksStatsWorkspace />);

    expect(screen.getByText('public links filters')).toBeInTheDocument();
    expect(screen.getByText('attempts table')).toBeInTheDocument();
    expect(screen.queryByText('Сводный аналитический отчет')).not.toBeInTheDocument();
  });
});
