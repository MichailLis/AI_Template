import { cn } from '@/shared/lib/utils';

import type { ReactNode } from 'react';

interface AdminStateBlockProps {
  children: ReactNode;
  action?: ReactNode;
  tone?: 'muted' | 'danger';
  className?: string;
}

const toneClassName = {
  muted: 'text-slate-500',
  danger: 'text-red-700',
} as const;

export function AdminStateBlock({
  children,
  action,
  tone = 'muted',
  className,
}: AdminStateBlockProps) {
  return (
    <div className={cn('p-8 text-center text-sm', toneClassName[tone], className)}>
      <div>{children}</div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
