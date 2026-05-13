import { cn } from '@/shared/lib/utils';

import type { ReactNode } from 'react';

interface AdminStateBlockProps {
  children: ReactNode;
  action?: ReactNode;
  tone?: 'muted' | 'danger';
  className?: string;
}

const toneClassName = {
  muted: 'border-border bg-muted/30 text-muted-foreground',
  danger: 'border-red-200 bg-red-50 text-red-700',
} as const;

export function AdminStateBlock({
  children,
  action,
  tone = 'muted',
  className,
}: AdminStateBlockProps) {
  return (
    <div
      className={cn(
        'flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center text-sm',
        toneClassName[tone],
        className,
      )}
    >
      <div>{children}</div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
