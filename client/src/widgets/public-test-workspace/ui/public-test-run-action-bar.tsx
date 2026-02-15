import { Clock3, ListChecks, Save, SendHorizontal } from 'lucide-react';

import { Button } from '@/shared/ui/button';

interface PublicTestRunActionBarProps {
  saveIsPending: boolean;
  finishIsPending: boolean;
  sessionStatus: string;
  answeredQuestionsCount: number;
  totalQuestionsCount: number;
  onSaveAnswers: () => Promise<void>;
  onFinish: () => Promise<void>;
}

export function PublicTestRunActionBar({
  saveIsPending,
  finishIsPending,
  sessionStatus,
  answeredQuestionsCount,
  totalQuestionsCount,
  onSaveAnswers,
  onFinish,
}: PublicTestRunActionBarProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur md:sticky md:bottom-3">
      <Button
        type="button"
        variant="outline"
        onClick={() => void onSaveAnswers()}
        disabled={saveIsPending || sessionStatus !== 'IN_PROGRESS'}
        className="min-w-44"
      >
        {saveIsPending ? (
          'Сохраняем...'
        ) : (
          <span className="inline-flex items-center gap-2">
            <Save className="h-4 w-4" />
            Сохранить ответы
          </span>
        )}
      </Button>
      <Button
        type="button"
        onClick={() => void onFinish()}
        disabled={finishIsPending || sessionStatus !== 'IN_PROGRESS'}
        className="min-w-44 bg-gradient-to-r from-primary to-accent hover:opacity-95"
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
      <div className="ml-auto inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="h-4 w-4" />
        <ListChecks className="h-4 w-4" />
        {answeredQuestionsCount}/{totalQuestionsCount} заполнено
      </div>
    </div>
  );
}
