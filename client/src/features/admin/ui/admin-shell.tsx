import { LogOut, Search } from 'lucide-react';
import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
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
        adminClassNames.nav.button,
        mobile && adminClassNames.nav.mobileButton,
        isActive && tone.active,
      )}
    >
      <Link to={item.href} aria-current={isActive ? 'page' : undefined}>
        <span className={cn(adminClassNames.nav.icon, isActive && tone.icon)}>
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
                  ? adminClassNames.nav.groupLabelMobile
                  : adminClassNames.nav.groupLabelDesktop
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
    <aside className={adminClassNames.sidebar.desktop}>
      <div className={adminClassNames.sidebar.header}>
        <Button asChild variant="ghost" className="h-auto p-0 text-left hover:bg-transparent">
          <Link to="/admin" className="flex items-center gap-2">
            <span className={adminClassNames.sidebar.brandMark}>AI</span>
            <span>
              <span className={adminClassNames.sidebar.brandTitle}>Админка</span>
              <span className={adminClassNames.sidebar.brandSubtitle}>AI Template</span>
            </span>
          </Link>
        </Button>
      </div>
      <nav className={adminClassNames.sidebar.nav}>
        <AdminNavGroups activeNavHref={activeNavHref} />
      </nav>
      <div className={adminClassNames.sidebar.footer}>
        <div className={adminClassNames.sidebar.workspaceCard}>
          <p className={adminClassNames.sidebar.workspaceLabel}>
            <span className={adminClassNames.sidebar.workspaceDot} />
            Workspace
          </p>
          <p className={adminClassNames.sidebar.workspaceTitle}>Панель управления</p>
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
    <header className={adminClassNames.header.root}>
      <div className="flex min-h-16 flex-wrap items-center gap-3 px-4 py-3 md:px-6">
        <div className="min-w-0">
          <p className={adminClassNames.header.eyebrow}>
            {activeNavItem?.description ?? 'Операции'}
          </p>
          <p className={adminClassNames.header.title}>{activeNavItem?.label ?? 'Админ-панель'}</p>
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <form className="hidden items-center gap-2 md:flex" onSubmit={handleSearchSubmit}>
            <Input
              list="admin-search-options"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              className={adminClassNames.header.input}
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
              className={adminClassNames.header.button}
              disabled={normalizeSearchValue(searchValue).length > 0 && !searchSuggestion}
              aria-label="Перейти к разделу"
            >
              <Search />
            </Button>
          </form>
          <span className={adminClassNames.header.userBadge}>{userLabel}</span>
          <Button
            variant="outline"
            size="sm"
            className={adminClassNames.header.button}
            onClick={onLogout}
            disabled={isLoggingOut}
          >
            <LogOut />
            {isLoggingOut ? 'Выход…' : 'Выйти'}
          </Button>
        </div>
      </div>
      <div className={adminClassNames.header.mobileNav}>
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
    <div className={adminClassNames.shell.root}>
      <div className={adminClassNames.shell.layout}>
        <DesktopSidebar activeNavHref={activeNavHref} />

        <div className={adminClassNames.shell.content}>
          <AdminHeader
            userLabel={userLabel}
            activeNavHref={activeNavHref}
            onLogout={onLogout}
            isLoggingOut={isLoggingOut}
          />

          <main className={adminClassNames.shell.main}>{children}</main>
        </div>
      </div>
    </div>
  );
};
