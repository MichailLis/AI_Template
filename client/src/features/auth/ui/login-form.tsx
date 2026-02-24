import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { useAuthControllerSignin } from '@/shared/api/generated/auth/auth';
import { loginSchema } from '@/shared/api/schemas';
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

export const LoginForm = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const loginMutation = useAuthControllerSignin();

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
          setAuth(data.user, data.accessToken, data.refreshToken);
          toast.success('С возвращением!');
          navigate('/admin');
        },
        onError: (error: unknown) => {
          const authError = error as AuthError;
          const backendMessage = authError.response?.data?.error?.message;
          const credentialErrors = ['Invalid credentials', 'Access Denied'];
          const message = credentialErrors.includes(backendMessage || '')
            ? 'Неверные данные'
            : backendMessage || 'Неверные данные';
          toast.error(message);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
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
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Загрузка...' : 'Войти'}
        </Button>
      </form>
    </Form>
  );
};
