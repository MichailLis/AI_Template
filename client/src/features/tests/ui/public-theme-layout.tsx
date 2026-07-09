import '../theme';

import { cn } from '@/shared/lib/utils';

import {
  resolvePublicBrandingTheme,
  type PublicBrandingConfig,
  type PublicBrandingLogo,
} from '../public-branding';

import type { ReactNode } from 'react';

interface PublicThemeLayoutProps {
  children: ReactNode;
  branding?: PublicBrandingConfig;
  builderHeaderSlot?: ReactNode;
  containerClassName?: string;
  variant?: 'standard' | 'polus';
  withDefaultBackground?: boolean;
}

const logoSizeClassNames: Record<PublicBrandingLogo['size'], string> = {
  sm: 'max-h-8 max-w-28',
  md: 'max-h-11 max-w-36',
  lg: 'max-h-14 max-w-44',
};

function PublicBrandHeader({
  builderHeaderSlot,
  logos,
}: {
  builderHeaderSlot?: ReactNode;
  logos: PublicBrandingLogo[];
}) {
  if (logos.length === 0 && !builderHeaderSlot) {
    return null;
  }

  return (
    <div className="mb-6 flex min-h-14 flex-wrap items-center justify-between gap-4">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        {logos.map((logo) => (
          <img
            key={`${logo.url}-${logo.alt}`}
            src={logo.url}
            alt={logo.alt}
            className={cn('h-auto object-contain', logoSizeClassNames[logo.size])}
          />
        ))}
      </div>
      {builderHeaderSlot ? <div className="shrink-0">{builderHeaderSlot}</div> : null}
    </div>
  );
}

/**
 * Scoped wrapper for public `/t/*` pages and admin branding previews.
 */
export function PublicThemeLayout({
  children,
  branding = null,
  builderHeaderSlot,
  containerClassName,
  variant = 'standard',
  withDefaultBackground = variant === 'standard',
}: PublicThemeLayoutProps) {
  const resolvedBranding = resolvePublicBrandingTheme(variant === 'standard' ? branding : null);
  const showImageBackground =
    resolvedBranding.backgroundMode === 'image' && resolvedBranding.backgroundImageUrl;
  const showDefaultBackground =
    withDefaultBackground && resolvedBranding.backgroundMode === 'default';

  return (
    <main
      className={cn(
        'theme-public relative min-h-screen overflow-hidden bg-background text-foreground',
        variant === 'standard' ? 'theme-public--standard' : 'theme-public--polus',
        resolvedBranding.className,
      )}
      style={resolvedBranding.style}
    >
      {showImageBackground ? (
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url("${resolvedBranding.backgroundImageUrl}")` }}
          />
          <div
            className="absolute inset-0 bg-background"
            style={{ opacity: resolvedBranding.backgroundOverlay }}
          />
        </div>
      ) : null}
      {showDefaultBackground ? (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_12%_12%,hsl(var(--primary)/0.12),transparent_55%),radial-gradient(1000px_500px_at_88%_0%,hsl(var(--accent)/0.1),transparent_52%)]" />
        </div>
      ) : null}
      <div className={cn('relative mx-auto w-full px-4 py-10', containerClassName)}>
        <PublicBrandHeader logos={resolvedBranding.logos} builderHeaderSlot={builderHeaderSlot} />
        {children}
        <footer className="mt-8 border-t border-foreground/10 pt-4 text-center text-xs text-foreground/70">
          <a href="/privacy" className="font-medium underline underline-offset-4">
            Политика обработки персональных данных
          </a>
        </footer>
      </div>
    </main>
  );
}
