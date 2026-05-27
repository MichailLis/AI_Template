import { AlertTriangle, CheckCircle2, Cloud, Loader2 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import type { PublicTestAutosaveStatus as PublicTestAutosaveStatusValue } from './public-test-run.types';

interface PublicTestAutosaveStatusProps {
  status: PublicTestAutosaveStatusValue;
  error: string | null;
  className?: string;
}

const getAutosaveStatusView = (status: PublicTestAutosaveStatusValue, error: string | null) => {
  if (status === 'pending') {
    return {
      icon: Cloud,
      label: 'Есть изменения',
      className: 'border-amber-200/70 bg-amber-50/80 text-amber-800',
    };
  }

  if (status === 'saving') {
    return {
      icon: Loader2,
      label: 'Сохраняем...',
      className: 'border-sky-200/70 bg-sky-50/80 text-sky-800',
    };
  }

  if (status === 'saved') {
    return {
      icon: CheckCircle2,
      label: 'Сохранено',
      className: 'border-emerald-200/70 bg-emerald-50/80 text-emerald-800',
    };
  }

  if (status === 'error') {
    return {
      icon: AlertTriangle,
      label: error ?? 'Не сохранено',
      className: 'border-destructive/25 bg-destructive/10 text-destructive',
    };
  }

  return null;
};

export function PublicTestAutosaveStatus({
  status,
  error,
  className,
}: PublicTestAutosaveStatusProps) {
  const view = getAutosaveStatusView(status, error);

  if (!view) {
    return null;
  }

  const Icon = view.icon;

  return (
    <div
      aria-live="polite"
      className={cn(
        'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm backdrop-blur',
        view.className,
        className,
      )}
      role={status === 'error' ? 'alert' : 'status'}
    >
      <Icon
        aria-hidden="true"
        className={cn('h-3.5 w-3.5 shrink-0', status === 'saving' ? 'animate-spin' : '')}
      />
      <span className="min-w-0 truncate">{view.label}</span>
    </div>
  );
}
