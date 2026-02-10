import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuthStore } from '@/entities/session';
import { useAuthControllerSignup } from '@/shared/api/generated/auth/auth';
import { signupSchema } from '@/shared/api/schemas';
import type { SignupInput } from '@/shared/api/schemas';
import { Button } from '@/shared/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';

interface SignupError {
  response?: {
    data?: {
      error?: {
        message: string;
      };
    };
  };
}

export const RegisterForm = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const signupMutation = useAuthControllerSignup();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
    },
  });

  async function onSubmit(values: SignupInput) {
    signupMutation.mutate({ data: values }, {
      onSuccess: (data) => {
        setAuth(data.user, data.accessToken, data.refreshToken);
        toast.success('Account created successfully');
        navigate('/');
      },
      onError: (error: unknown) => {
        const signupError = error as SignupError;
        toast.error(signupError.response?.data?.error?.message || 'Registration failed');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="grid gap-2 space-y-0">
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
          {signupMutation.isPending ? 'Loading...' : 'Register'}
        </Button>
        <div className="text-center text-sm">
          Already have an account?{' '}
          <Link to="/login" className="underline">
            Sign in
          </Link>
        </div>
      </form>
    </Form>
  );
};
