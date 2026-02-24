import { PublicQuestionCard } from './public-question-card';
import { PublicTestRunActionBar } from './public-test-run-action-bar';
import { PublicTestRunStateScreen } from './public-test-run-state-screen';
import { PublicTestRunSummaryCard } from './public-test-run-summary-card';
import { PublicThemeLayout } from './public-theme-layout';
import { usePublicTestRunWorkspace } from './use-public-test-run-workspace';

export function PublicTestRunWorkspace() {
  const {
    code,
    sessionToken,
    sessionQuery,
    saveAnswersMutation,
    finishMutation,
    session,
    totalQuestionsCount,
    answeredQuestionsCount,
    getCurrentAnswer,
    setQuestionAnswer,
    handleFinish,
  } = usePublicTestRunWorkspace();

  if (!code || !sessionToken) {
    return (
      <PublicTestRunStateScreen
        message="Ссылка недействительна. Проверьте, что вы перешли по верной ссылке или запросите новую у администратора."
        tone="danger"
      />
    );
  }

  if (sessionQuery.isLoading) {
    return <PublicTestRunStateScreen message="Загружаем сессию теста..." />;
  }

  if (sessionQuery.isError || !session) {
    return (
      <PublicTestRunStateScreen
        message="Сессия недоступна или уже завершена. Свяжитесь с администратором теста для получения новой ссылки."
        tone="danger"
      />
    );
  }

  if (session.shortCode !== code) {
    return (
      <PublicTestRunStateScreen
        message="Ссылка недействительна. Проверьте, что вы перешли по верной ссылке или запросите новую у администратора."
        tone="danger"
      />
    );
  }

  if (session.questions.length === 0) {
    return <PublicTestRunStateScreen message="Тест пока не содержит вопросов." tone="danger" />;
  }

  return (
    <PublicThemeLayout containerClassName="max-w-4xl">
      <PublicTestRunSummaryCard
        session={session}
        totalQuestionsCount={totalQuestionsCount}
        answeredQuestionsCount={answeredQuestionsCount}
      />

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Заполните все вопросы и нажмите «Завершить тест», чтобы отправить ответы.
      </p>

      <div className="space-y-4">
        {session.questions.map((question) => {
          const currentAnswer = getCurrentAnswer(question.id);

          return (
            <PublicQuestionCard
              key={question.id}
              question={question}
              currentAnswer={currentAnswer}
              onAnswerChange={setQuestionAnswer}
            />
          );
        })}
      </div>

      <PublicTestRunActionBar
        finishIsPending={saveAnswersMutation.isPending || finishMutation.isPending}
        sessionStatus={session.status}
        answeredQuestionsCount={answeredQuestionsCount}
        totalQuestionsCount={totalQuestionsCount}
        onFinish={handleFinish}
      />
    </PublicThemeLayout>
  );
}
