import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
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
    loginMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        // Теперь данные приходят без обертки .success/ .data
        setAuth(data.user, data.accessToken, data.refreshToken);
        toast.success('Welcome back!');
        navigate('/');
      },
      onError: (error: unknown) => {
        const authError = error as AuthError;
        const message = authError.response?.data?.error?.message || 'Invalid credentials';
        toast.error(message);
      }
    });
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Loading...' : 'Login'}
        </Button>
        <div className="text-center text-sm">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="underline">
            Sign up
          </Link>
        </div>
      </form>
    </Form>
  );
};
