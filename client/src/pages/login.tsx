import { LoginForm } from '@/features/auth';
import { Card, CardContent, CardDescription, CardHeader } from '@/shared/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <h1 className="text-2xl font-semibold leading-none tracking-tight">Вход</h1>
          <CardDescription>Введите email для входа в аккаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
