import { Activity, ArrowRight, Gauge, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/shared/lib/utils';
import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import {
  formatMetricValue,
  metricToneClassNames,
  readinessItems,
  shortcutToneClassNames,
} from './admin-overview.model';

import type { AdminCardItem, AdminShortcutItem } from './admin-overview.model';

function HeroActionRow({
  totalTracked,
  primaryShortcut,
}: {
  totalTracked: number;
  primaryShortcut?: AdminShortcutItem;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Button asChild size="sm" className={adminClassNames.overview.primaryButton}>
        <Link to={primaryShortcut?.path ?? '/admin/users'}>
          Открыть работу
          <ArrowRight />
        </Link>
      </Button>
      <span className={cn('text-sm', adminClassNames.text.muted)}>
        {formatMetricValue(totalTracked)} сущностей под наблюдением
      </span>
    </div>
  );
}

function HeroPulsePanel({ totalTracked }: { totalTracked: number }) {
  return (
    <div className={adminClassNames.overview.heroPulsePanel}>
      <p
        className={cn('text-xs font-semibold uppercase tracking-wide', adminClassNames.text.label)}
      >
        Пульс системы
      </p>
      <div className="mt-4 grid gap-3">
        <div className={adminClassNames.panel.section}>
          <div className="flex items-center justify-between gap-3">
            <span className={cn('text-sm', adminClassNames.text.body)}>Всего объектов</span>
            <Gauge className={cn('size-4', adminToneClassNames.info.textAccent)} />
          </div>
          <p className={cn('mt-1 text-2xl font-semibold', adminClassNames.text.heading)}>
            {formatMetricValue(totalTracked)}
          </p>
        </div>
        <div
          className={cn(
            'rounded-xl border p-3 text-sm',
            adminToneClassNames.success.border,
            adminToneClassNames.success.softSurface,
            adminToneClassNames.success.text,
          )}
        >
          <div className="flex items-center gap-2 font-medium">
            <Activity className="size-4" />
            Рабочая зона активна
          </div>
          <p className={cn('mt-1', adminToneClassNames.success.text)}>
            Навигация, роли и публикации доступны.
          </p>
        </div>
      </div>
    </div>
  );
}

export function OverviewHero({
  title,
  subtitle,
  totalTracked,
  primaryShortcut,
}: {
  title: string;
  subtitle: string;
  totalTracked: number;
  primaryShortcut?: AdminShortcutItem;
}) {
  return (
    <Card className={adminClassNames.panel.hero}>
      <CardHeader className="p-0">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="relative p-6 md:p-7">
            <div className={adminClassNames.overview.heroRail} />
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={adminBadgeClassNames.protected}>
                <ShieldCheck />
                Доступ защищен
              </Badge>
              <span className={adminBadgeClassNames.workspace}>Рабочее пространство</span>
            </div>
            <CardTitle
              className={cn(
                'max-w-3xl text-2xl leading-tight md:text-3xl',
                adminClassNames.text.heading,
              )}
            >
              {title}
            </CardTitle>
            <CardDescription
              className={cn('mt-3 max-w-2xl text-base leading-7', adminClassNames.text.body)}
            >
              {subtitle}
            </CardDescription>
            <HeroActionRow totalTracked={totalTracked} primaryShortcut={primaryShortcut} />
          </div>
          <HeroPulsePanel totalTracked={totalTracked} />
        </div>
      </CardHeader>
    </Card>
  );
}

export function MetricGrid({ cards }: { cards: AdminCardItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {cards.map((item, index) => {
        const metric = metricToneClassNames[index % metricToneClassNames.length];
        const tone = adminToneClassNames[metric.tone];
        const Icon = metric.icon;

        return (
          <Card
            key={item.id}
            className={cn('overflow-hidden', adminClassNames.panel.card, tone.surface)}
          >
            <div className={cn('h-1 bg-gradient-to-r', tone.gradient)} />
            <CardHeader className="pb-3">
              <div className="mb-4 flex items-start justify-between gap-4">
                <span className={cn('grid size-10 place-items-center rounded-xl', tone.icon)}>
                  <Icon className="size-5" />
                </span>
                <span className={adminBadgeClassNames.fresh}>актуально</span>
              </div>
              <CardDescription className={cn('font-medium', adminClassNames.text.body)}>
                {item.label}
              </CardDescription>
              <CardTitle className={cn('mt-1 text-3xl', adminClassNames.text.heading)}>
                {formatMetricValue(item.value)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={cn('text-sm leading-6', adminClassNames.text.body)}>{item.trend}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export function ShortcutPanel({ shortcuts }: { shortcuts: AdminShortcutItem[] }) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader>
        <CardTitle className={adminClassNames.text.heading}>Быстрые действия</CardTitle>
        <CardDescription>Быстрый доступ к основным разделам управления.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {shortcuts.map((item, index) => {
          const tone =
            adminToneClassNames[shortcutToneClassNames[index % shortcutToneClassNames.length]];

          return (
            <Link
              key={item.id}
              to={item.path}
              className={cn(
                'group flex min-h-32 flex-col justify-between p-4',
                adminClassNames.panel.interactive,
              )}
            >
              <span>
                <span
                  className={cn(
                    'mb-4 grid size-9 place-items-center rounded-xl border',
                    tone.active,
                  )}
                >
                  <ArrowRight className="size-4" />
                </span>
                <span className={cn('font-medium', adminClassNames.text.heading)}>
                  {item.label}
                </span>
                <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                  {item.hint}
                </span>
              </span>
              <span
                className={cn(
                  'mt-4 inline-flex items-center text-sm font-medium',
                  adminClassNames.text.body,
                )}
              >
                {item.path}
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function ReadinessPanel({ totalTracked }: { totalTracked: number }) {
  return (
    <Card className={adminClassNames.panel.card}>
      <CardHeader>
        <CardTitle className={adminClassNames.text.heading}>Готовность</CardTitle>
        <CardDescription>Базовые проверки для рабочего пространства.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {readinessItems.map((item) => {
          const Icon = item.icon;
          const tone = adminToneClassNames[item.tone];

          return (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-between gap-3',
                adminClassNames.panel.mutedSection,
              )}
            >
              <span className="flex min-w-0 items-center gap-2 text-foreground [&_svg]:size-4">
                <Icon className={cn('shrink-0', tone.textAccent)} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className={cn('shrink-0 text-xs font-medium', tone.textAccent)}>
                {item.value}
              </span>
            </div>
          );
        })}
        <div className={cn(adminClassNames.panel.section, 'px-3 py-3')}>
          <p className={cn('text-xs uppercase tracking-wide', adminClassNames.text.label)}>
            Отслеживаемых сущностей
          </p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMetricValue(totalTracked)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function OverviewNotice() {
  return (
    <Card className={adminClassNames.overview.noticeCard}>
      <CardContent className={adminClassNames.overview.noticeContent}>
        <div className="flex items-center gap-3">
          <Sparkles />
          <span>Фокус на сегодня: держать роли, публикации и тестовые сценарии в порядке.</span>
        </div>
        <span className={cn('flex items-center gap-2 text-sm', adminToneClassNames.info.text)}>
          <ArrowRight />
          Разделы слева ведут прямо к рабочим операциям.
        </span>
      </CardContent>
    </Card>
  );
}
