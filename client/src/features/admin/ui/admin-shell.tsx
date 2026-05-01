import {
  BarChart3,
  Building2,
  ClipboardList,
  Link2,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings,
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
    group: 'overview',
  },
  {
    id: 'users',
    label: 'Пользователи',
    icon: Users,
    href: '/admin/users',
    group: 'content',
  },
  {
    id: 'prompts',
    label: 'Промпты',
    icon: MessageSquareText,
    href: '/admin/prompts',
    group: 'content',
  },
  {
    id: 'tests',
    label: 'Тесты',
    icon: ClipboardList,
    href: '/admin/tests',
    group: 'content',
  },
  {
    id: 'public-links',
    label: 'Публичные ссылки',
    icon: Link2,
    href: '/admin/public-links',
    group: 'publication',
  },
  {
    id: 'education-organizations',
    label: 'Учебные заведения',
    icon: Building2,
    href: '/admin/public-links/organizations',
    group: 'publication',
  },
  {
    id: 'analytics',
    label: 'Аналитика',
    icon: BarChart3,
    href: '/admin/analytics',
    group: 'analytics',
  },
  {
    id: 'public-links-stats',
    label: 'Статистика ссылок',
    icon: BarChart3,
    href: '/admin/public-links/stats',
    group: 'analytics',
  },
  {
    id: 'settings',
    label: 'Настройки',
    icon: Settings,
    href: '/admin/settings',
    group: 'system',
  },
];

const navGroups = [
  {
    id: 'overview',
    label: 'Обзор',
  },
  {
    id: 'content',
    label: 'Контент',
  },
  {
    id: 'publication',
    label: 'Публикация',
  },
  {
    id: 'analytics',
    label: 'Аналитика',
  },
  {
    id: 'system',
    label: 'Система',
  },
];

const resolveActiveNavHref = (currentPath: string) => {
  if (currentPath === '/admin') {
    return '/admin';
  }

  const matchedHrefs = navItems
    .map((item) => item.href)
    .filter((href) => currentPath === href || currentPath.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length);

  return matchedHrefs[0] ?? '';
};

const getNavButtonVariant = (isActive: boolean, mobile?: boolean) => {
  if (isActive) {
    return 'secondary';
  }

  return mobile ? 'outline' : 'ghost';
};

interface AdminNavGroupsProps {
  activeNavHref: string;
  mobile?: boolean;
}

interface AdminHeaderProps {
  userLabel: string;
  activeNavHref: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}

function AdminNavButton({
  item,
  isActive,
  mobile,
}: {
  item: (typeof navItems)[number];
  isActive: boolean;
  mobile?: boolean;
}) {
  const Icon = item.icon;

  return (
    <Button
      asChild
      variant={getNavButtonVariant(isActive, mobile)}
      size={mobile ? 'sm' : undefined}
      className={mobile ? undefined : 'w-full justify-start gap-2'}
    >
      <Link to={item.href}>
        <Icon className={mobile ? 'mr-2 h-4 w-4' : 'h-4 w-4'} />
        <span>{item.label}</span>
      </Link>
    </Button>
  );
}

function AdminNavGroups({ activeNavHref, mobile = false }: AdminNavGroupsProps) {
  return (
    <div className={mobile ? 'space-y-4' : 'space-y-6'}>
      {navGroups.map((group) => {
        const groupItems = navItems.filter((item) => item.group === group.id);

        if (groupItems.length === 0) {
          return null;
        }

        return (
          <div key={group.id}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {group.label}
            </p>
            <div className={mobile ? 'grid grid-cols-2 gap-2' : 'space-y-1'}>
              {groupItems.map((item) => (
                <AdminNavButton
                  key={item.id}
                  item={item}
                  isActive={item.href === activeNavHref}
                  mobile={mobile}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DesktopSidebar({ activeNavHref }: { activeNavHref: string }) {
  return (
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
        <AdminNavGroups activeNavHref={activeNavHref} />
      </nav>
      <div className="space-y-3 border-t border-slate-200 p-4">
        <p className="text-xs text-slate-500">Административный раздел</p>
        <p className="mt-1 text-sm font-medium">Панель управления</p>
        <Button asChild variant="outline" size="sm" className="w-full justify-start">
          <Link to="/login">К входу</Link>
        </Button>
      </div>
    </aside>
  );
}

function AdminHeader({ userLabel, activeNavHref, onLogout, isLoggingOut }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-2 md:px-6 md:py-0">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Операции</p>
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
        <AdminNavGroups activeNavHref={activeNavHref} mobile />
      </div>
    </header>
  );
}

export const AdminShell = ({
  children,
  userLabel,
  activePath,
  onLogout,
  isLoggingOut,
}: AdminShellProps) => {
  const activeNavHref = resolveActiveNavHref(activePath);

  return (
    <div className="min-h-screen w-full bg-slate-100 text-slate-900">
      <div className="grid min-h-screen w-full md:grid-cols-[18rem_minmax(0,1fr)]">
        <DesktopSidebar activeNavHref={activeNavHref} />

        <div className="flex min-w-0 flex-col">
          <AdminHeader
            userLabel={userLabel}
            activeNavHref={activeNavHref}
            onLogout={onLogout}
            isLoggingOut={isLoggingOut}
          />

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
