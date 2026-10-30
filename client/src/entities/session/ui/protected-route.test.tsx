import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/session';

import { ProtectedRoute } from './protected-route';

vi.mock('@/shared/api/generated/auth/auth', () => ({
  useAuthControllerLogout: () => ({ isPending: false, mutate: vi.fn() }),
}));

const renderAdminRoute = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <div>Admin area</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

function LoginRedirectStateProbe() {
  const location = useLocation();

  return <output data-testid="redirect-from">{String(location.state?.from ?? '')}</output>;
}

describe('ProtectedRoute', () => {
  afterEach(() => {
    cleanup();
    useAuthStore.setState({ isAuthenticated: false, user: null });
  });

  it('shows a plain user an explanation instead of the admin area', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 2, email: 'member@example.com', role: 'USER' },
    });

    renderAdminRoute();

    expect(screen.getByRole('heading', { name: 'Доступ пока не выдан' })).toBeInTheDocument();
    expect(screen.queryByText('Admin area')).not.toBeInTheDocument();
  });

  it('lets an admin through', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 1, email: 'admin@example.com', role: 'ADMIN' },
    });

    renderAdminRoute();

    expect(screen.getByText('Admin area')).toBeInTheDocument();
  });

  it('lets a session persisted before roles existed through to the server-checked area', () => {
    useAuthStore.setState({
      isAuthenticated: true,
      user: { id: 1, email: 'admin@example.com' },
    });

    renderAdminRoute();

    expect(screen.getByText('Admin area')).toBeInTheDocument();
  });

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
