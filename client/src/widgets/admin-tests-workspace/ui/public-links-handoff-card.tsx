import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export function PublicLinksHandoffCard() {
  return (
    <Card className="mt-6 border-slate-200">
      <CardHeader>
        <CardTitle>Публичные ссылки вынесены отдельно</CardTitle>
        <CardDescription>
          Управление ссылками, архивом и статистикой попыток теперь доступно на отдельной странице.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild type="button" variant="outline">
          <Link to="/admin/public-links">Открыть страницу ссылок</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
