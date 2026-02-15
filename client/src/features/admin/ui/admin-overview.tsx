import { AlertTriangle, ArrowUpRight, CircleCheckBig, Clock3, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

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

export const AdminOverview = ({ title, subtitle, cards, shortcuts }: AdminOverviewProps) => {
  const totalTracked = cards.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="mt-1">{subtitle}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              Защищенная зона
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                Обновить метрики
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.id} className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl">{item.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">{item.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Быстрые действия</CardTitle>
            <CardDescription>Быстрый доступ к основным разделам управления.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            {shortcuts.map((item) => (
              <Card key={item.id} className="border-slate-200 bg-slate-50 shadow-none">
                <CardContent className="p-4">
                  <p className="font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.hint}</p>
                  <Button asChild variant="outline" size="sm" className="mt-3">
                    <Link to={item.path}>{item.path}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Готовность</CardTitle>
            <CardDescription>Базовые проверки для рабочего пространства.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-slate-700">
                <CircleCheckBig className="h-4 w-4 text-emerald-600" />
                Защита доступа включена
              </span>
              <span className="text-xs font-medium text-emerald-700">ОК</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-slate-700">
                <CircleCheckBig className="h-4 w-4 text-emerald-600" />
                API-контракт сгенерирован
              </span>
              <span className="text-xs font-medium text-emerald-700">ОК</span>
            </div>
            <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="flex items-center gap-2 text-slate-700">
                <Clock3 className="h-4 w-4 text-amber-600" />
                Расширенные модули
              </span>
              <span className="text-xs font-medium text-amber-700">Запланировано</span>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Отслеживаемых сущностей
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{totalTracked}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50 shadow-none">
        <CardContent className="flex items-center gap-3 p-4 text-amber-800">
          <AlertTriangle className="h-5 w-5" />
          Панель готова к работе. Используйте разделы слева для управления процессами.
        </CardContent>
      </Card>
    </div>
  );
};
