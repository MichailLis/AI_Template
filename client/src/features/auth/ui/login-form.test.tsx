import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '@/entities/session';
import { safeStorage } from '@/shared/lib/storage';

import { LoginForm } from './login-form';

interface SigninOptions {
  onSuccess?: (data: {
    accessToken: string;
    user: {
      id: number;
      email: string;
      name: string;
    };
  }) => void;
}

const authApiMock = vi.hoisted(() => ({
  mutate: vi.fn(),
}));

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock('@/shared/api/generated/auth/auth', () => ({
  useAuthControllerSignin: () => ({
    isPending: false,
    mutate: authApiMock.mutate,
  }),
}));

vi.mock('sonner', () => ({
  toast: toastMock,
}));

function LocationProbe() {
  const location = useLocation();

  return (
    <output data-testid="current-location">
      {location.pathname + location.search + location.hash}
    </output>
  );
}

async function submitLogin() {
  const user = userEvent.setup();

  await user.type(screen.getByLabelText('Email'), 'manager@example.com');
  await user.type(screen.getByLabelText('Пароль'), 'password123');
  await user.click(screen.getByRole('button', { name: 'Войти' }));
}

describe('LoginForm', () => {
  beforeEach(() => {
    safeStorage.clear();
    useAuthStore.setState({ isAuthenticated: false, user: null });
    authApiMock.mutate.mockImplementation((_payload: unknown, options?: SigninOptions) => {
      options?.onSuccess?.({
        accessToken: 'access-token',
        user: {
          email: 'manager@example.com',
          id: 7,
          name: 'Manager',
        },
      });
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    safeStorage.clear();
    useAuthStore.setState({ isAuthenticated: false, user: null });
  });

  it('returns to the protected URL from router state after successful login', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { from: '/admin/settings?smoke=auth#openrouter' },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await submitLogin();

    expect(await screen.findByTestId('current-location')).toHaveTextContent(
      '/admin/settings?smoke=auth#openrouter',
    );
  });

  it('falls back to admin when login has no redirect state', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await submitLogin();

    expect(await screen.findByTestId('current-location')).toHaveTextContent('/admin');
  });

  it('ignores external redirect state after successful login', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { from: 'https://example.com/admin' },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await submitLogin();

    expect(await screen.findByTestId('current-location')).toHaveTextContent('/admin');
  });

  it('ignores non-string redirect state after successful login', async () => {
    render(
      <MemoryRouter
        initialEntries={['/previous', { pathname: '/login', state: { from: -1 } }]}
        initialIndex={1}
      >
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await submitLogin();

    expect(await screen.findByTestId('current-location')).toHaveTextContent('/admin');
  });
});
