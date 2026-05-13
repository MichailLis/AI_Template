import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';

import type { ReactNode } from 'react';

interface AdminStateBlockProps {
  children: ReactNode;
  action?: ReactNode;
  tone?: 'muted' | 'danger';
  className?: string;
}

const toneClassName = {
  muted: adminClassNames.stateBlock.muted,
  danger: adminClassNames.stateBlock.danger,
} as const;

export function AdminStateBlock({
  children,
  action,
  tone = 'muted',
  className,
}: AdminStateBlockProps) {
  return (
    <div className={cn(adminClassNames.stateBlock.base, toneClassName[tone], className)}>
      <div>{children}</div>
      {action ? <div className={adminClassNames.stateBlock.action}>{action}</div> : null}
    </div>
  );
}
