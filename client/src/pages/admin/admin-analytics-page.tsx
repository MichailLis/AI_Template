import { Activity, ShieldAlert, Timer, type LucideIcon } from 'lucide-react';

import {
  type AdminBadgeTone,
  type AdminTone,
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table';

interface MetricCardConfig {
  title: string;
  value: string;
  description: string;
  detail: string;
  tone: AdminTone;
  badgeTone: AdminBadgeTone;
  icon: LucideIcon;
  bars: number[];
}

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

const metrics: MetricCardConfig[] = [
  {
    title: 'События за сегодня',
    value: '124',
    description: 'Операционные события в рабочем пространстве.',
    detail: '+18% к среднему',
    tone: 'info',
    badgeTone: 'info',
    icon: Activity,
    bars: [36, 48, 42, 58, 64, 52, 70, 62],
  },
  {
    title: 'Высокий приоритет',
    value: '8',
    description: 'Действия, требующие проверки и согласования.',
    detail: '3 ожидают владельца',
    tone: 'warning',
    badgeTone: 'warning',
    icon: ShieldAlert,
    bars: [58, 62, 48, 54, 72, 66, 52, 44],
  },
  {
    title: 'Среднее время реакции',
    value: '11m',
    description: 'Целевой SLA: менее 15 минут для админ-событий.',
    detail: 'SLA в норме',
    tone: 'success',
    badgeTone: 'success',
    icon: Timer,
    bars: [68, 64, 56, 50, 44, 42, 36, 34],
  },
];

const getImpactBadgeClassName = (impact: string) => {
  if (impact === 'Высокий') {
    return adminBadgeClassNames.danger;
  }

  if (impact === 'Средний') {
    return adminBadgeClassNames.warning;
  }

  return adminBadgeClassNames.info;
};

function AdminMetricCard({ metric }: { metric: MetricCardConfig }) {
  const tone = adminToneClassNames[metric.tone];
  const Icon = metric.icon;

  return (
    <Card className={adminClassNames.metric.card}>
      <div className={`${adminClassNames.metric.rail} ${tone.gradient}`} />
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardDescription>{metric.title}</CardDescription>
            <CardTitle className={adminClassNames.metric.value}>{metric.value}</CardTitle>
          </div>
          <div className={`${adminClassNames.metric.icon} ${tone.icon}`}>
            <Icon className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className={adminClassNames.metric.caption}>{metric.description}</p>
          <div className={adminClassNames.metric.sparkTrack} aria-hidden="true">
            {metric.bars.map((height, index) => (
              <div
                key={`${metric.title}-${height}-${index}`}
                className={`${adminClassNames.metric.sparkBar} ${tone.softSurface}`}
                style={{ height: `${height}%` }}
              />
            ))}
          </div>
          <Badge variant="outline" className={adminBadgeClassNames[metric.badgeTone]}>
            {metric.detail}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminEventsTable() {
  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[720px]">
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
                <Badge variant="outline" className={getImpactBadgeClassName(event.impact)}>
                  {event.impact}
                </Badge>
              </TableCell>
              <TableCell className={`text-right ${adminClassNames.text.muted}`}>
                {event.time}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-3">
        {metrics.map((metric) => (
          <AdminMetricCard key={metric.title} metric={metric} />
        ))}
      </div>

      <Card className={adminClassNames.panel.card}>
        <CardHeader>
          <CardTitle>Последние события админки</CardTitle>
          <CardDescription>Таблица потока событий для операционной аналитики.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminEventsTable />
        </CardContent>
      </Card>
    </div>
  );
}
