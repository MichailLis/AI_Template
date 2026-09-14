import { Clock3 } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

import { formatRemainingTime, isPublicTestTimeWarning } from './public-test-run-timer.helpers';

interface PublicTestRunTimerProps {
  remainingSeconds: number;
  variant: 'standard' | 'polus';
}

const timerClassNames = {
  standard: {
    root: 'flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground',
    warning: 'text-amber-800',
    clock: 'font-semibold tabular-nums text-foreground',
  },
  polus: {
    root: 'polus-run-timer',
    warning: 'polus-run-timer--warning',
    clock: 'polus-run-timer-clock',
  },
} as const;

export function PublicTestRunTimer({ remainingSeconds, variant }: PublicTestRunTimerProps) {
  const isWarning = isPublicTestTimeWarning(remainingSeconds);
  const classNames = timerClassNames[variant];

  return (
    <div className={cn(classNames.root, isWarning && classNames.warning)}>
      <span className="inline-flex items-center gap-1.5">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        Осталось
        <span role="timer" aria-label="Оставшееся время" className={classNames.clock}>
          {formatRemainingTime(remainingSeconds)}
        </span>
      </span>
      {isWarning ? (
        <span role="status" className="font-medium">
          Меньше минуты — ответьте на оставшиеся вопросы и завершите тест.
        </span>
      ) : null}
    </div>
  );
}
