import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Link, MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { RouteErrorBoundary } from './route-error-boundary';

let shouldThrow = true;
const Page = () => {
  if (shouldThrow) throw new Error('boom');
  return <p>страница</p>;
};

describe('RouteErrorBoundary', () => {
  it('shows a refresh screen and recovers after navigation', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MemoryRouter initialEntries={['/a']}>
        <Link to="/b">далее</Link>
        <RouteErrorBoundary>
          <Page />
        </RouteErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Не удалось показать страницу');

    shouldThrow = false;
    await userEvent.click(screen.getByText('далее'));
    expect(await screen.findByText('страница')).toBeInTheDocument();
  });
});
