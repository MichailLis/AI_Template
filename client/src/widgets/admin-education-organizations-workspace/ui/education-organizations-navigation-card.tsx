import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export function EducationOrganizationsNavigationCard() {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Учебные заведения</CardTitle>
        <CardDescription>
          Централизованное управление заведениями, форматом группы/класса и статистикой
          использования.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button asChild type="button" variant="outline" size="sm">
          <Link to="/admin/public-links">К публичным ссылкам</Link>
        </Button>
        <Button asChild type="button" variant="outline" size="sm">
          <Link to="/admin/public-links/stats">К статистике ссылок</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
