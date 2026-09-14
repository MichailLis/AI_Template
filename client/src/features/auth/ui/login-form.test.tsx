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
      role: 'USER' | 'ADMIN';
    };
  }) => void;
  onError?: (error: unknown) => void;
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
          role: 'ADMIN',
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

  const renderLoginRoute = () =>
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

  it('greets an admin after a successful login', async () => {
    renderLoginRoute();

    await submitLogin();

    expect(toastMock.success).toHaveBeenCalledWith('С возвращением!');
  });

  it('does not greet a user who is about to see the access-pending screen', async () => {
    authApiMock.mutate.mockImplementation((_payload: unknown, options?: SigninOptions) => {
      options?.onSuccess?.({
        accessToken: 'access-token',
        user: { email: 'student@example.com', id: 3, name: 'Student', role: 'USER' },
      });
    });

    renderLoginRoute();

    await submitLogin();

    expect(await screen.findByTestId('current-location')).toHaveTextContent('/admin');
    expect(toastMock.success).not.toHaveBeenCalled();
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

  it('keeps the sign-in failure on the form, not only in a toast', async () => {
    authApiMock.mutate.mockImplementation((_payload: unknown, options?: SigninOptions) => {
      options?.onError?.({
        response: { data: { error: { code: 'HTTP_ERROR', message: 'Invalid credentials' } } },
      });
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await submitLogin();

    expect(await screen.findByRole('alert')).toHaveTextContent('Неверный email или пароль');
    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('tells a deactivated user why they cannot sign in', async () => {
    authApiMock.mutate.mockImplementation((_payload: unknown, options?: SigninOptions) => {
      options?.onError?.({
        response: { data: { error: { code: 'HTTP_ERROR', message: 'Account is deactivated' } } },
      });
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </MemoryRouter>,
    );

    await submitLogin();

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Аккаунт отключён. Обратитесь к администратору.',
    );
  });

  it('shows Russian validation messages for an empty form', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(await screen.findByText('Введите корректный email')).toBeInTheDocument();
    expect(screen.getByText('Введите пароль')).toBeInTheDocument();
  });

  /** Находка аудита FLOW-11: предупреждение об истекшей сессии и возврат на исходный экран. */
  it('shows session expired warning when reason=session_expired in query', () => {
    render(
      <MemoryRouter initialEntries={['/login?reason=session_expired&from=/admin/public-links']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Сессия истекла, войдите снова');
  });

  it('shows session expired warning when reason=session_expired in router state', () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { reason: 'session_expired' },
          },
        ]}
      >
        <Routes>
          <Route path="/login" element={<LoginForm />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Сессия истекла, войдите снова');
  });

  it('returns to the protected URL from query param after successful login', async () => {
    render(
      <MemoryRouter initialEntries={['/login?from=/admin/public-links']}>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>,
    );

    await submitLogin();

    expect(await screen.findByTestId('current-location')).toHaveTextContent('/admin/public-links');
  });

  it('ignores external URL in query param and falls back to /admin', async () => {
    render(
      <MemoryRouter initialEntries={['/login?from=https://evil.com/phish']}>
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
