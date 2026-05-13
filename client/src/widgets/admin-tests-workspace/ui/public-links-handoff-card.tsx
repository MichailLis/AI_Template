import { ExternalLink, Link2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

export function PublicLinksHandoffCard() {
  return (
    <Card className={`mt-6 overflow-hidden ${adminClassNames.panel.card}`}>
      <CardHeader className={adminClassNames.border.bottom}>
        <div className="flex items-start gap-3">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.info.icon}`}
          >
            <Link2 className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle>Опубликуйте тест и поделитесь ссылкой</CardTitle>
            <CardDescription>
              После создания теста настройте публичный доступ для студентов.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <CardDescription>
          Ссылка может быть открытой или привязанной к учебному заведению.
        </CardDescription>
        <Button asChild type="button" variant="outline">
          <Link to="/admin/public-links">
            Создать публичную ссылку
            <ExternalLink className="ml-2 size-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
