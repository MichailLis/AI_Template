import { Link } from 'react-router-dom';

import { useAuthStore } from '@/entities/session';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

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
          
          <div className="pt-4 space-y-2">
            <Button asChild className="w-full">
              <Link to="/projects">View My Projects</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/notes">My Notes</Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/tasks">My Tasks</Link>
            </Button>
            <Button variant="destructive" className="w-full" onClick={logout}>
              Logout
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
