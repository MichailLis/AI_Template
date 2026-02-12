import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Template Dashboard Stub</CardTitle>
          <CardDescription>
            Compatibility page required by architecture checks when feature modules are declared.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/admin">Open admin</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
