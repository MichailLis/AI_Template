import { BarChart3, Building2, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export function EducationOrganizationsNavigationCard() {
  return (
    <Card className={adminClassNames.panel.hero}>
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className={adminClassNames.metric.icon}>
              <Building2 className="size-4" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg">Учебные заведения</CardTitle>
              <CardDescription>
                Централизованное управление заведениями, форматом группы/класса и статистикой
                использования.
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={adminBadgeClassNames.info}>
              Справочник
            </Badge>
            <Badge variant="outline" className={adminBadgeClassNames.success}>
              Валидация групп
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button asChild type="button" variant="outline" size="sm" className="w-full sm:w-auto">
          <Link to="/admin/public-links">
            <Link2 className="size-4" />К публичным ссылкам
          </Link>
        </Button>
        <Button asChild type="button" variant="outline" size="sm" className="w-full sm:w-auto">
          <Link to="/admin/public-links/stats">
            <BarChart3 className="size-4" />К статистике ссылок
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
