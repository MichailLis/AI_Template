import { useAuthStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Dashboard() {
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome, {user?.name || user?.email}!</CardTitle>
          <CardDescription>You are successfully logged in.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm">
            <p><strong>ID:</strong> {user?.id}</p>
            <p><strong>Email:</strong> {user?.email}</p>
          </div>
          <Button variant="destructive" className="w-full" onClick={logout}>
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
