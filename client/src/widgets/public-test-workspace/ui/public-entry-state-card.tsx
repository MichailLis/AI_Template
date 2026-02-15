import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

import { PublicThemeLayout } from './public-theme-layout';

import type { ReactNode } from 'react';

interface PublicEntryStateCardProps {
  title: string;
  description?: string;
  accentClassName: string;
  icon?: ReactNode;
}

export function PublicEntryStateCard({
  title,
  description,
  accentClassName,
  icon,
}: PublicEntryStateCardProps) {
  return (
    <PublicThemeLayout containerClassName="max-w-4xl">
      <Card className="relative w-full overflow-hidden border border-border/50 bg-card shadow-xl">
        <div className={`absolute inset-x-0 top-0 h-1 ${accentClassName}`} />
        <CardHeader className="pb-4 pt-6 text-center">
          <CardTitle className="text-2xl font-bold text-foreground">{title}</CardTitle>
        </CardHeader>
        {description || icon ? (
          <CardContent className="px-6 pb-6 text-center">
            {icon ? <div className="mb-4 flex justify-center">{icon}</div> : null}
            {description ? <p className="text-muted-foreground">{description}</p> : null}
          </CardContent>
        ) : null}
      </Card>
    </PublicThemeLayout>
  );
}
