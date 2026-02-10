import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { RegisterForm } from '@/features/auth/ui/register-form';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>
            Enter your information to create an account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
