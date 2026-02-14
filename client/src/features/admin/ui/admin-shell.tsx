import {
  BarChart3,
  ClipboardList,
  Link2,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { ReactNode } from 'react';

interface AdminShellProps {
  children: ReactNode;
  userLabel: string;
  activePath: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const navItems = [
  {
    id: 'overview',
    label: 'Обзор',
    icon: LayoutDashboard,
    href: '/admin',
  },
  {
    id: 'users',
    label: 'Пользователи',
    icon: Users,
    href: '/admin/users',
  },
  {
    id: 'security',
    label: 'Безопасность',
    icon: ShieldCheck,
    href: '/admin/security',
  },
  {
    id: 'analytics',
    label: 'Аналитика',
    icon: BarChart3,
    href: '/admin/analytics',
  },
  {
    id: 'prompts',
    label: 'Промпты',
    icon: MessageSquareText,
    href: '/admin/prompts',
  },
  {
    id: 'tests',
    label: 'Тесты',
    icon: ClipboardList,
    href: '/admin/tests',
  },
  {
    id: 'public-links',
    label: 'Публичные ссылки',
    icon: Link2,
    href: '/admin/public-links',
  },
  {
    id: 'public-links-stats',
    label: 'Статистика ссылок',
    icon: BarChart3,
    href: '/admin/public-links/stats',
  },
];

const isPathActive = (href: string, currentPath: string) => {
  if (href === '/admin') {
    return currentPath === '/admin';
  }

  return currentPath.startsWith(href);
};

export const AdminShell = ({
  children,
  userLabel,
  activePath,
  onLogout,
  isLoggingOut,
}: AdminShellProps) => {
  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900">
      <div className="grid min-h-screen w-full md:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-slate-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:flex-col">
          <div className="flex h-16 items-center border-b border-slate-200 px-5">
            <Button asChild variant="ghost" className="h-auto p-0 text-left hover:bg-transparent">
              <Link to="/admin" className="flex items-center gap-2">
                <span className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                  ADMIN
                </span>
                <span className="text-sm font-semibold text-slate-800">Рабочее пространство</span>
              </Link>
            </Button>
          </div>
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = isPathActive(item.href, activePath);

                return (
                  <Button
                    key={item.id}
                    asChild
                    variant={isActive ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                  >
                    <Link to={item.href}>
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  </Button>
                );
              })}
            </div>
          </nav>
          <div className="space-y-3 border-t border-slate-200 p-4">
            <p className="text-xs text-slate-500">Базовый режим шаблона</p>
            <p className="mt-1 text-sm font-medium">Каркас админки</p>
            <Button asChild variant="outline" size="sm" className="w-full justify-start">
              <Link to="/login">К входу</Link>
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-2 md:px-6 md:py-0">
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Операции
                </p>
                <p className="text-sm font-semibold text-slate-900">Админ-панель</p>
              </div>
              <div className="ml-auto flex min-w-0 items-center gap-2">
                <Input
                  className="hidden w-64 border-slate-300 bg-slate-50 md:block lg:w-80"
                  placeholder="Поиск по админке"
                />
                <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                  {userLabel}
                </span>
                <Button variant="outline" size="sm" onClick={onLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Выход...' : 'Выйти'}
                </Button>
              </div>
            </div>
            <div className="border-t border-slate-200 px-4 py-2 md:hidden">
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isPathActive(item.href, activePath);

                  return (
                    <Button
                      key={item.id}
                      asChild
                      variant={isActive ? 'secondary' : 'outline'}
                      size="sm"
                    >
                      <Link to={item.href}>
                        <Icon className="mr-2 h-4 w-4" />
                        {item.label}
                      </Link>
                    </Button>
                  );
                })}
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
