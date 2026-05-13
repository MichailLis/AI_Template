import { LogOut, Search } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import {
  findNavItem,
  navGroups,
  navItems,
  navToneClassNames,
  normalizeSearchValue,
  resolveActiveNavHref,
  type AdminNavItem,
} from './admin-navigation';

interface AdminShellProps {
  children: ReactNode;
  userLabel: string;
  activePath: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}

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
  item: AdminNavItem;
  isActive: boolean;
  mobile?: boolean;
}) {
  const Icon = item.icon;
  const tone = navToneClassNames[item.group];

  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className={cn(
        'h-9 w-full justify-start gap-2 rounded-lg border border-transparent px-2.5 text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-950 hover:shadow-sm',
        mobile && 'h-8 bg-white/80 shadow-sm',
        isActive && tone.active,
      )}
    >
      <Link to={item.href} aria-current={isActive ? 'page' : undefined}>
        <span
          className={cn(
            'grid size-6 place-items-center rounded-md bg-slate-100 text-slate-500',
            isActive && tone.icon,
          )}
        >
          <Icon aria-hidden="true" />
        </span>
        <span className="truncate">{item.label}</span>
      </Link>
    </Button>
  );
}

function AdminNavGroups({ activeNavHref, mobile = false }: AdminNavGroupsProps) {
  return (
    <div className="flex flex-col gap-4">
      {navGroups.map((group) => {
        const groupItems = navItems.filter((item) => item.group === group.id);

        if (groupItems.length === 0) {
          return null;
        }

        return (
          <div key={group.id}>
            <p
              className={
                mobile
                  ? 'mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500'
                  : 'mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500'
              }
            >
              {group.label}
            </p>
            <div className={mobile ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-1'}>
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
    <aside className="hidden overflow-hidden border-r border-slate-200/80 bg-white/90 text-slate-900 shadow-[1px_0_0_rgba(15,23,42,0.03)] backdrop-blur md:sticky md:top-0 md:flex md:h-screen md:flex-col">
      <div className="flex h-16 items-center border-b border-slate-200/80 px-5">
        <Button asChild variant="ghost" className="h-auto p-0 text-left hover:bg-transparent">
          <Link to="/admin" className="flex items-center gap-2">
            <span className="rounded-lg bg-gradient-to-br from-sky-500 via-cyan-400 to-emerald-400 px-2 py-1 text-xs font-semibold text-white shadow-sm">
              AI
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">Админка</span>
              <span className="block text-xs text-slate-500">AI Template</span>
            </span>
          </Link>
        </Button>
      </div>
      <nav className="flex-1 overflow-hidden p-3">
        <AdminNavGroups activeNavHref={activeNavHref} />
      </nav>
      <div className="border-t border-slate-200/80 p-4">
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
          <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-800">
            <span className="size-2 rounded-full bg-emerald-500" />
            Workspace
          </p>
          <p className="mt-1 text-sm font-medium text-slate-900">Панель управления</p>
        </div>
      </div>
    </aside>
  );
}

function AdminHeader({ userLabel, activeNavHref, onLogout, isLoggingOut }: AdminHeaderProps) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const activeNavItem = navItems.find((item) => item.href === activeNavHref);
  const searchSuggestion = useMemo(() => findNavItem(searchValue), [searchValue]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchSuggestion) {
      return;
    }

    navigate(searchSuggestion.href);
    setSearchValue('');
  };

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {activeNavItem?.description ?? 'Операции'}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {activeNavItem?.label ?? 'Админ-панель'}
          </p>
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <form className="hidden items-center gap-2 md:flex" onSubmit={handleSearchSubmit}>
            <Input
              list="admin-search-options"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className="w-64 border-slate-200 bg-slate-50/80 shadow-sm lg:w-80"
              placeholder="Найти раздел"
              aria-label="Найти раздел админки"
            />
            <datalist id="admin-search-options">
              {navItems.map((item) => (
                <option key={item.id} value={item.label} />
              ))}
            </datalist>
            <Button
              type="submit"
              variant="outline"
              size="icon"
              className="bg-white shadow-sm"
              disabled={normalizeSearchValue(searchValue).length > 0 && !searchSuggestion}
              aria-label="Перейти к разделу"
            >
              <Search />
            </Button>
          </form>
          <span className="max-w-48 truncate rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
            {userLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="bg-white shadow-sm"
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <LogOut />
            {isLoggingOut ? 'Выход…' : 'Выйти'}
          </Button>
        </div>
      </div>
      <div className="border-t border-slate-200/80 bg-slate-50/80 px-4 py-3 md:hidden">
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
    <div className="min-h-screen w-full bg-[linear-gradient(180deg,#f8fbff_0%,#f4f7fb_48%,#eef6f3_100%)] text-slate-900">
      <div className="grid min-h-screen w-full md:grid-cols-[18rem_minmax(0,1fr)]">
        <DesktopSidebar activeNavHref={activeNavHref} />

        <div className="flex min-w-0 flex-col">
          <AdminHeader
            userLabel={userLabel}
            activeNavHref={activeNavHref}
            onLogout={onLogout}
            isLoggingOut={isLoggingOut}
          />

          <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
};
