import { BarChart3, LayoutDashboard, LogOut, ShieldCheck, Users } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

import type { ReactNode } from 'react';

interface AdminShellProps {
  children: ReactNode;
  userLabel: string;
  onLogout: () => void;
  isLoggingOut: boolean;
}

const navItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    active: true,
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    active: false,
  },
  {
    id: 'security',
    label: 'Security',
    icon: ShieldCheck,
    active: false,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    active: false,
  },
];

export const AdminShell = ({ children, userLabel, onLogout, isLoggingOut }: AdminShellProps) => {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px]">
        <aside className="hidden w-72 shrink-0 border-r border-slate-200 bg-white md:flex md:flex-col">
          <div className="flex h-16 items-center border-b border-slate-200 px-5">
            <div className="rounded-md bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
              ADMIN
            </div>
          </div>
          <nav className="flex-1 p-4">
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Button
                    key={item.id}
                    variant={item.active ? 'secondary' : 'ghost'}
                    className="w-full justify-start gap-2"
                    disabled={!item.active}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                );
              })}
            </div>
          </nav>
          <div className="border-t border-slate-200 p-4">
            <p className="text-xs text-slate-500">Template baseline mode</p>
            <p className="mt-1 text-sm font-medium">Admin skeleton</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Input
                  className="max-w-xs border-slate-300 bg-slate-50"
                  placeholder="Search admin tools"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-600">
                  {userLabel}
                </span>
                <Button variant="outline" size="sm" onClick={onLogout} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  {isLoggingOut ? 'Logout...' : 'Logout'}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
};
