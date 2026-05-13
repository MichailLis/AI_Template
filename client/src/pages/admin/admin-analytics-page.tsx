import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

const events = [
  {
    id: 'EVT-9214',
    area: 'Авторизация',
    actor: 'ops-admin@company.dev',
    impact: 'Средний',
    time: '09:15',
  },
  {
    id: 'EVT-9213',
    area: 'Пользователи',
    actor: 'security.lead@company.dev',
    impact: 'Низкий',
    time: '09:02',
  },
  {
    id: 'EVT-9208',
    area: 'Конфигурация',
    actor: 'ops-admin@company.dev',
    impact: 'Высокий',
    time: '08:31',
  },
  {
    id: 'EVT-9204',
    area: 'Доступ',
    actor: 'finance.viewer@company.dev',
    impact: 'Низкий',
    time: '08:04',
  },
];

const impactVariant = (impact: string) => {
  if (impact === 'Высокий') {
    return 'destructive' as const;
  }

  if (impact === 'Средний') {
    return 'outline' as const;
  }

  return 'secondary' as const;
};

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={adminClassNames.panel.card}>
          <CardHeader className="pb-2">
            <CardDescription>События за сегодня</CardDescription>
            <CardTitle className="text-3xl">124</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${adminClassNames.text.muted}`}>
              Операционные события, зафиксированные в этом пространстве.
            </p>
          </CardContent>
        </Card>
        <Card className={adminClassNames.panel.card}>
          <CardHeader className="pb-2">
            <CardDescription>Высокий приоритет</CardDescription>
            <CardTitle className="text-3xl">8</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${adminClassNames.text.muted}`}>
              Действия, требующие проверки и согласования.
            </p>
          </CardContent>
        </Card>
        <Card className={adminClassNames.panel.card}>
          <CardHeader className="pb-2">
            <CardDescription>Среднее время реакции</CardDescription>
            <CardTitle className="text-3xl">11m</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${adminClassNames.text.muted}`}>
              Целевой SLA: менее 15 минут для админ-событий.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className={adminClassNames.panel.card}>
        <CardHeader>
          <CardTitle>Последние события админки</CardTitle>
          <CardDescription>Таблица потока событий для операционной аналитики.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Событие</TableHead>
                <TableHead>Область</TableHead>
                <TableHead>Инициатор</TableHead>
                <TableHead>Влияние</TableHead>
                <TableHead className="text-right">Время</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className={`font-medium ${adminClassNames.text.heading}`}>
                    {event.id}
                  </TableCell>
                  <TableCell>{event.area}</TableCell>
                  <TableCell className={adminClassNames.text.body}>{event.actor}</TableCell>
                  <TableCell>
                    <Badge variant={impactVariant(event.impact)}>{event.impact}</Badge>
                  </TableCell>
                  <TableCell className={`text-right ${adminClassNames.text.muted}`}>
                    {event.time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
