import { ArrowLeft, ArrowRight, Clock3, ListChecks, SendHorizontal } from 'lucide-react';

import { Button } from '@/shared/ui/button';
interface PublicTestRunActionBarProps {
  finishIsPending: boolean;
  sessionStatus: string;
  totalQuestionsCount: number;
  currentQuestionIndex: number;
  canGoBack: boolean;
  canGoNext: boolean;
  isLastQuestion: boolean;
  onFinish: () => Promise<void>;
  onBack: () => void;
  onNext: () => void;
}

export function PublicTestRunActionBar({
  finishIsPending,
  sessionStatus,
  totalQuestionsCount,
  currentQuestionIndex,
  canGoBack,
  canGoNext,
  isLastQuestion,
  onFinish,
  onBack,
  onNext,
}: PublicTestRunActionBarProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-card/95 p-3 shadow-lg backdrop-blur md:sticky md:bottom-3">
      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
        <Clock3 className="h-4 w-4" />
        <ListChecks className="h-4 w-4" />
        Шаг {currentQuestionIndex + 1}/{totalQuestionsCount}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={finishIsPending || !canGoBack}
          size="sm"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Назад</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onNext}
          disabled={finishIsPending || !canGoNext}
          size="sm"
        >
          <span className="hidden sm:inline">Далее</span>
          <ArrowRight className="h-4 w-4" />
        </Button>

        {isLastQuestion && (
          <Button
            type="button"
            onClick={() => void onFinish()}
            disabled={finishIsPending || sessionStatus !== 'IN_PROGRESS'}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-95"
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
        )}
      </div>
    </div>
  );
}
