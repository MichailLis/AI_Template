import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { ProtectedRoute } from './protected-route';

function LoginRedirectStateProbe() {
  const location = useLocation();

  return <output data-testid="redirect-from">{String(location.state?.from ?? '')}</output>;
}

describe('ProtectedRoute', () => {
  it('stores the full attempted URL before redirecting to login', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings?smoke=auth#openrouter']}>
        <Routes>
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <div>Admin settings</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<LoginRedirectStateProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('redirect-from')).toHaveTextContent(
      '/admin/settings?smoke=auth#openrouter',
    );
  });
});
