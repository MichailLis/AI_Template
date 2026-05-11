interface PublicTestRunProgressProps {
  currentQuestionIndex: number;
  totalQuestionsCount: number;
}

export function PublicTestRunProgress({
  currentQuestionIndex,
  totalQuestionsCount,
}: PublicTestRunProgressProps) {
  const progress =
    totalQuestionsCount > 0
      ? Math.round(((currentQuestionIndex + 1) / totalQuestionsCount) * 100)
      : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-xs font-medium text-muted-foreground">
        <span>{`${Math.min(currentQuestionIndex + 1, totalQuestionsCount)} / ${totalQuestionsCount}`}</span>
        <span>{`${progress}%`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-white/60 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-[width] duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
