interface PublicTestRunProgressProps {
  currentQuestionIndex: number;
  totalQuestionsCount: number;
  answeredQuestionsCount: number;
}

export function PublicTestRunProgress({
  currentQuestionIndex,
  totalQuestionsCount,
  answeredQuestionsCount,
}: PublicTestRunProgressProps) {
  const progress =
    totalQuestionsCount > 0
      ? Math.round(((currentQuestionIndex + 1) / totalQuestionsCount) * 100)
      : 0;

  return (
    <div className="mb-6 space-y-3 rounded-xl border border-border/60 bg-card/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">
          {`Вопрос ${Math.min(currentQuestionIndex + 1, totalQuestionsCount)}/${totalQuestionsCount}`}
        </p>
        <p className="text-xs text-muted-foreground">{`${answeredQuestionsCount} заполнено`}</p>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted/70">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{`${progress}% прохождения`}</span>
        <span>{`Осталось: ${Math.max(totalQuestionsCount - (currentQuestionIndex + 1), 0)}`}</span>
      </div>
    </div>
  );
}
