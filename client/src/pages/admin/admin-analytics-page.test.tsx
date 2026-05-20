import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AdminAnalyticsPage from './admin-analytics-page';

vi.mock('@/widgets/admin-public-links-stats-workspace', () => ({
  AdminTestAnalyticsReportWorkspace: () => <div>analytics report workspace</div>,
}));

describe('AdminAnalyticsPage', () => {
  it('renders the test analytics report workspace', () => {
    render(<AdminAnalyticsPage />);

    expect(screen.getByText('analytics report workspace')).toBeInTheDocument();
  });
});
