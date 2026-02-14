import { cn } from '@/shared/lib/utils';

import type { ReactNode } from 'react';

import './public-theme.css';

interface PublicThemeLayoutProps {
  children: ReactNode;
  containerClassName?: string;
}

export function PublicThemeLayout({ children, containerClassName }: PublicThemeLayoutProps) {
  return (
    <main className="theme-public relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_12%_12%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(1000px_500px_at_88%_0%,hsl(var(--accent)/0.1),transparent_52%)]" />
      </div>
      <div className={cn('relative mx-auto w-full px-4 py-10', containerClassName)}>{children}</div>
    </main>
  );
}
