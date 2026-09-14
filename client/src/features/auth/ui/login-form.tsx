import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { useAuthControllerSignin } from '@/shared/api/generated/auth/auth';
import { loginSchema } from '@/shared/api/schemas';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

import type { LoginInput } from '@/shared/api/schemas';

interface AuthError {
  response?: {
    data?: {
      error?: {
        message: string;
      };
    };
  };
}

const DEFAULT_LOGIN_REDIRECT = '/admin';

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  'Invalid credentials': 'Неверный email или пароль',
  'Access Denied': 'Неверный email или пароль',
  'Account is deactivated': 'Аккаунт отключён. Обратитесь к администратору.',
};

const resolveLoginRedirect = (state: unknown, search = '') => {
  let from: unknown = null;

  if (typeof state === 'object' && state !== null && 'from' in state) {
    from = (state as { from?: unknown }).from;
  }

  if (!from && search) {
    const params = new URLSearchParams(search);
    from = params.get('from');
  }

  if (typeof from !== 'string') {
    return DEFAULT_LOGIN_REDIRECT;
  }

  return from === '/admin' ||
    from.startsWith('/admin/') ||
    from.startsWith('/admin?') ||
    from.startsWith('/admin#')
    ? from
    : DEFAULT_LOGIN_REDIRECT;
};

const resolveSessionExpired = (state: unknown, search = '') => {
  if (search) {
    const params = new URLSearchParams(search);
    if (params.get('reason') === 'session_expired') {
      return true;
    }
  }

  if (typeof state === 'object' && state !== null && 'reason' in state) {
    return (state as { reason?: unknown }).reason === 'session_expired';
  }

  return false;
};

export const LoginForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useAuthControllerSignin();
  const redirectTo = resolveLoginRedirect(location.state, location.search);
  const isSessionExpired = resolveSessionExpired(location.state, location.search);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginInput) {
    loginMutation.mutate(
      { data: values },
      {
        onSuccess: (data) => {
          setAuth(data.user, data.accessToken);

          // Приветствуем только тех, кого пустят дальше: пользователь без роли администратора
          // попадает на экран «Доступ пока не выдан», и «С возвращением!» над ним звучит как ошибка.
          if (data.user.role === 'ADMIN') {
            toast.success('С возвращением!');
          }

          navigate(redirectTo);
        },
        onError: (error: unknown) => {
          const authError = error as AuthError;
          const backendMessage = authError.response?.data?.error?.message;
          const message =
            (backendMessage ? LOGIN_ERROR_MESSAGES[backendMessage] : undefined) ??
            backendMessage ??
            'Не удалось войти. Попробуйте еще раз.';

          /**
           * Ошибка входа показывается один раз непосредственно на форме, чтобы избежать
           * дублирования сообщения между формой и всплывающим тостом (UX-19).
           */
          form.setError('root', { message });
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        {isSessionExpired ? (
          <div role="alert" className={adminClassNames.panel.warningInline}>
            Сессия истекла, войдите снова
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="m@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {form.formState.errors.root ? (
          <p role="alert" className={adminClassNames.panel.dangerInline}>
            {form.formState.errors.root.message}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Загрузка...' : 'Войти'}
        </Button>
      </form>
    </Form>
  );
};
