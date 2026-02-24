import { Clock3, ListChecks, SendHorizontal } from 'lucide-react';

import { Button } from '@/shared/ui/button';

interface PublicTestRunActionBarProps {
  finishIsPending: boolean;
  sessionStatus: string;
  answeredQuestionsCount: number;
  totalQuestionsCount: number;
  onFinish: () => Promise<void>;
}

export function PublicTestRunActionBar({
  finishIsPending,
  sessionStatus,
  answeredQuestionsCount,
  totalQuestionsCount,
  onFinish,
}: PublicTestRunActionBarProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur md:sticky md:bottom-3">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="h-4 w-4" />
        <ListChecks className="h-4 w-4" />
        Шаг {answeredQuestionsCount}/{totalQuestionsCount}
      </div>

      <Button
        type="button"
        onClick={() => void onFinish()}
        disabled={finishIsPending || sessionStatus !== 'IN_PROGRESS'}
        className="ml-auto min-w-44 bg-gradient-to-r from-primary to-accent hover:opacity-95"
      >
        {finishIsPending ? (
          'Завершаем...'
        ) : (
          <span className="inline-flex items-center gap-2">
            <SendHorizontal className="h-4 w-4" />
            Завершить тест
          </span>
        )}
      </Button>
    </div>
  );
}
