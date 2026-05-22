import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Навигация по разделам</CardTitle>
          <CardDescription>
            Быстрый переход к ключевым административным разделам системы.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/admin">Открыть админку</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/tests">Открыть тесты</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/prompts">Открыть промпты</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
