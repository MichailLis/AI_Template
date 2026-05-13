import {
  Activity,
  ArrowRight,
  CircleCheckBig,
  Clock3,
  FileText,
  Gauge,
  Link2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface AdminCardItem {
  id: string;
  label: string;
  value: number;
  trend: string;
}

interface AdminShortcutItem {
  id: string;
  label: string;
  hint: string;
  path: string;
}

interface AdminOverviewProps {
  title: string;
  subtitle: string;
  cards: AdminCardItem[];
  shortcuts: AdminShortcutItem[];
}

const metricToneClassNames = [
  {
    icon: Users,
    bar: 'from-sky-400 to-cyan-300',
    iconClassName: 'bg-sky-100 text-sky-700',
    surfaceClassName: 'bg-sky-50/30',
  },
  {
    icon: ShieldCheck,
    bar: 'from-emerald-400 to-lime-300',
    iconClassName: 'bg-emerald-100 text-emerald-700',
    surfaceClassName: 'bg-emerald-50/30',
  },
  {
    icon: FileText,
    bar: 'from-amber-400 to-orange-300',
    iconClassName: 'bg-amber-100 text-amber-700',
    surfaceClassName: 'bg-amber-50/30',
  },
  {
    icon: Link2,
    bar: 'from-rose-400 to-pink-300',
    iconClassName: 'bg-rose-100 text-rose-700',
    surfaceClassName: 'bg-rose-50/30',
  },
] as const;

const shortcutToneClassNames = [
  'border-sky-200 bg-sky-50/50 text-sky-700',
  'border-indigo-200 bg-indigo-50/50 text-indigo-700',
  'border-emerald-200 bg-emerald-50/50 text-emerald-700',
  'border-amber-200 bg-amber-50/50 text-amber-700',
] as const;

const readinessItems = [
  {
    id: 'access',
    label: 'Защита доступа включена',
    value: 'ОК',
    icon: CircleCheckBig,
    className: 'text-emerald-700',
  },
  {
    id: 'api',
    label: 'API-контракт сгенерирован',
    value: 'ОК',
    icon: CircleCheckBig,
    className: 'text-emerald-700',
  },
  {
    id: 'modules',
    label: 'Расширенные модули',
    value: 'Запланировано',
    icon: Clock3,
    className: 'text-amber-700',
  },
] as const;

const formatMetricValue = (value: number) => new Intl.NumberFormat('ru-RU').format(value);

function HeroActionRow({
  totalTracked,
  primaryShortcut,
}: {
  totalTracked: number;
  primaryShortcut?: AdminShortcutItem;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      <Button asChild size="sm" className="bg-slate-950 text-white hover:bg-slate-800">
        <Link to={primaryShortcut?.path ?? '/admin/users'}>
          Открыть работу
          <ArrowRight />
        </Link>
      </Button>
      <span className="text-sm text-slate-500">
        {formatMetricValue(totalTracked)} сущностей под наблюдением
      </span>
    </div>
  );
}

function HeroPulsePanel({ totalTracked }: { totalTracked: number }) {
  return (
    <div className="border-t border-slate-200 bg-slate-50/80 p-5 lg:border-l lg:border-t-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Пульс системы</p>
      <div className="mt-4 grid gap-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">Всего объектов</span>
            <Gauge className="size-4 text-sky-600" />
          </div>
          <p className="mt-1 text-2xl font-semibold text-slate-950">
            {formatMetricValue(totalTracked)}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-900">
          <div className="flex items-center gap-2 font-medium">
            <Activity className="size-4" />
            Рабочая зона активна
          </div>
          <p className="mt-1 text-emerald-800">Навигация, роли и публикации доступны.</p>
        </div>
      </div>
    </div>
  );
}

function OverviewHero({
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
    <Card className="overflow-hidden border-slate-200/80 bg-white shadow-sm">
      <CardHeader className="p-0">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="relative p-6 md:p-7">
            <div className="absolute inset-y-6 left-0 w-1 rounded-r-full bg-gradient-to-b from-sky-400 via-emerald-400 to-amber-300" />
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="gap-2 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 [&_svg]:size-3.5"
              >
                <ShieldCheck />
                Доступ защищен
              </Badge>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                Рабочее пространство
              </span>
            </div>
            <CardTitle className="max-w-3xl text-2xl leading-tight text-slate-950 md:text-3xl">
              {title}
            </CardTitle>
            <CardDescription className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
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

function MetricGrid({ cards }: { cards: AdminCardItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {cards.map((item, index) => {
        const tone = metricToneClassNames[index % metricToneClassNames.length];
        const Icon = tone.icon;

        return (
          <Card
            key={item.id}
            className={cn(
              'overflow-hidden border-slate-200/80 bg-white shadow-sm',
              tone.surfaceClassName,
            )}
          >
            <div className={`h-1 bg-gradient-to-r ${tone.bar}`} />
            <CardHeader className="pb-3">
              <div className="mb-4 flex items-start justify-between gap-4">
                <span
                  className={cn('grid size-10 place-items-center rounded-xl', tone.iconClassName)}
                >
                  <Icon className="size-5" />
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500">
                  актуально
                </span>
              </div>
              <CardDescription className="font-medium text-slate-600">{item.label}</CardDescription>
              <CardTitle className="mt-1 text-3xl text-slate-950">
                {formatMetricValue(item.value)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-6 text-slate-600">{item.trend}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function ShortcutPanel({ shortcuts }: { shortcuts: AdminShortcutItem[] }) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-950">Быстрые действия</CardTitle>
        <CardDescription>Быстрый доступ к основным разделам управления.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {shortcuts.map((item, index) => (
          <Link
            key={item.id}
            to={item.path}
            className="group flex min-h-32 flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm transition-[border-color,background-color,box-shadow] hover:border-slate-300 hover:bg-white hover:shadow-md"
          >
            <span>
              <span
                className={cn(
                  'mb-4 grid size-9 place-items-center rounded-xl border',
                  shortcutToneClassNames[index % shortcutToneClassNames.length],
                )}
              >
                <ArrowRight className="size-4" />
              </span>
              <span className="font-medium text-slate-950">{item.label}</span>
              <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                {item.hint}
              </span>
            </span>
            <span className="mt-4 inline-flex items-center text-sm font-medium text-slate-700">
              {item.path}
              <ArrowRight className="ml-2 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function ReadinessPanel({ totalTracked }: { totalTracked: number }) {
  return (
    <Card className="border-slate-200/80 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-slate-950">Готовность</CardTitle>
        <CardDescription>Базовые проверки для рабочего пространства.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        {readinessItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-foreground [&_svg]:size-4">
                <Icon className={cn('shrink-0', item.className)} />
                <span className="truncate">{item.label}</span>
              </span>
              <span className={`shrink-0 text-xs font-medium ${item.className}`}>{item.value}</span>
            </div>
          );
        })}
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Отслеживаемых сущностей</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMetricValue(totalTracked)}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function OverviewNotice() {
  return (
    <Card className="border-sky-200 bg-sky-50/80 shadow-none">
      <CardContent className="flex flex-col gap-3 p-4 text-sky-950 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Sparkles />
          <span>Фокус на сегодня: держать роли, публикации и тестовые сценарии в порядке.</span>
        </div>
        <span className="flex items-center gap-2 text-sm text-sky-800">
          <ArrowRight />
          Разделы слева ведут прямо к рабочим операциям.
        </span>
      </CardContent>
    </Card>
  );
}

export const AdminOverview = ({ title, subtitle, cards, shortcuts }: AdminOverviewProps) => {
  const totalTracked = cards.reduce((acc, item) => acc + item.value, 0);
  const primaryShortcut = shortcuts.find((item) => item.path !== '/admin') ?? shortcuts[0];

  return (
    <div className="flex flex-col gap-6">
      <OverviewHero
        title={title}
        subtitle={subtitle}
        totalTracked={totalTracked}
        primaryShortcut={primaryShortcut}
      />

      <MetricGrid cards={cards} />

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <ShortcutPanel shortcuts={shortcuts} />
        <ReadinessPanel totalTracked={totalTracked} />
      </div>

      <OverviewNotice />
    </div>
  );
};
