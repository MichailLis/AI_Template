import '@/features/tests/theme';

import { cn } from '@/shared/lib/utils';

import type { ReactNode } from 'react';

interface PublicThemeLayoutProps {
  children: ReactNode;
  containerClassName?: string;
  variant?: 'standard' | 'polus';
  withDefaultBackground?: boolean;
}

/**
 * Обертка для публичных `/t/*` страниц.
 *
 * Инвариант: тема должна быть строго scoped через `.theme-public`,
 * чтобы визуальные токены публичного контура не протекали в admin/login.
 */
export function PublicThemeLayout({
  children,
  containerClassName,
  variant = 'standard',
  withDefaultBackground = variant === 'standard',
}: PublicThemeLayoutProps) {
  return (
    <main
      className={cn(
        'theme-public relative min-h-screen overflow-hidden bg-background text-foreground',
        variant === 'standard' ? 'theme-public--standard' : 'theme-public--polus',
      )}
    >
      {withDefaultBackground ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_12%_12%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(1000px_500px_at_88%_0%,hsl(var(--accent)/0.1),transparent_52%)]" />
        </div>
      ) : null}
      <div className={cn('relative mx-auto w-full px-4 py-10', containerClassName)}>{children}</div>
    </main>
  );
}
