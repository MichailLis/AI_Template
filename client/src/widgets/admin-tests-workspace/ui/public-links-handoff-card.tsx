import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export function PublicLinksHandoffCard() {
  return (
    <Card className="mt-6 border-slate-200">
      <CardHeader>
        <CardTitle>Опубликуйте тест и поделитесь ссылкой</CardTitle>
        <CardDescription>
          После создания теста создайте публичную ссылку для студентов и настройте условия доступа.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild type="button" variant="outline">
          <Link to="/admin/public-links">Создать публичную ссылку</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
