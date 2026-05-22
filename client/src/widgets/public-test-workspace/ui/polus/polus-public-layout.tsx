import { polusAssets } from '@/features/tests';
import { cn } from '@/shared/lib/utils';

import { PublicThemeLayout } from '../public-theme-layout';

import type { ReactNode } from 'react';

interface PolusPublicLayoutProps {
  children: ReactNode;
  view: 'entry' | 'question' | 'result';
  containerClassName?: string;
}

function PolusTopbar() {
  return (
    <header className="polus-topbar">
      <div className="polus-brand" aria-label="Полюс">
        <img
          className="polus-brand-logo"
          src={polusAssets.youthProjectLogo}
          alt="Полюс, центр поддержки молодежных инициатив"
        />
      </div>

      <div className="polus-project-logos" aria-label="Логотипы проектов">
        <img
          className="polus-project-logo"
          src={polusAssets.engineeringMindLogo}
          alt="Мастерская инженерной мысли"
        />
        <img
          className="polus-project-logo"
          src={polusAssets.digitalMindLogo}
          alt="Мастерская цифровой мысли"
        />
      </div>
    </header>
  );
}

export function PolusPublicLayout({ children, view, containerClassName }: PolusPublicLayoutProps) {
  return (
    <PublicThemeLayout
      variant="polus"
      containerClassName={cn('polus-page-shell px-0 py-0', containerClassName)}
    >
      <PolusTopbar />
      <div className={cn('polus-hero', `polus-hero--${view}`)}>{children}</div>
    </PublicThemeLayout>
  );
}
