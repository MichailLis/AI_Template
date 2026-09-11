import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AdminAnalyticsPage from './admin-analytics-page';

vi.mock('@/widgets/admin-public-links-stats-workspace', () => ({
  AdminAnalyticsWorkspace: () => <div>analytics workspace</div>,
}));

describe('AdminAnalyticsPage', () => {
  it('renders the merged analytics workspace', () => {
    render(<AdminAnalyticsPage />);

    expect(screen.getByText('analytics workspace')).toBeInTheDocument();
  });
});
