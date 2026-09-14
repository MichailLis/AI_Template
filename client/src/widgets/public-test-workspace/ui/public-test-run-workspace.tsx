import { useState } from 'react';
import { Navigate } from 'react-router-dom';

import { PolusPublicRun } from './polus/polus-public-run';
import { PublicQuestionCard } from './public-question-card';
import { PublicTestRunExpiredScreen } from './public-test-run-expired-screen';
import { PublicTestRunProgress } from './public-test-run-progress';
import { PublicTestRunStateScreen } from './public-test-run-state-screen';
import { PublicTestRunTimer } from './public-test-run-timer';
import { PublicThemeLayout } from './public-theme-layout';
import { usePublicTestRunCountdown } from './use-public-test-run-countdown';
import { usePublicTestRunWorkspace } from './use-public-test-run-workspace';
import { useQuestionTransition } from './use-question-transition';

export function PublicTestRunWorkspace() {
  const {
    code,
    sessionToken,
    sessionQuery,
    saveAnswersMutation,
    finishMutation,
    session,
    totalQuestionsCount,
    getCurrentAnswer,
    setQuestionAnswer,
    handleFinish,
  } = usePublicTestRunWorkspace();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const { goToQuestionIndex, questionTransitionClass } = useQuestionTransition({
    currentQuestionIndex,
    questionCount: session?.questions.length ?? 0,
    onQuestionIndexChange: setCurrentQuestionIndex,
  });
  const remainingSeconds = usePublicTestRunCountdown(session?.expiresAt ?? null);

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

  // Завершенная сессия не должна снова показывать вопросы — перенаправляем на результат.
  if (session.status === 'COMPLETED') {
    return <Navigate to={`/t/${code}/result/${sessionToken}`} replace />;
  }

  // Статус с сервера приходит раз в несколько секунд, поэтому истечение по часам закрывает вопросы сразу.
  if (session.status === 'EXPIRED' || session.status === 'ABANDONED' || remainingSeconds === 0) {
    return <PublicTestRunExpiredScreen code={code} session={session} />;
  }

  if (session.publicTemplate === 'POLUS') {
    const currentQuestion = session.questions[currentQuestionIndex];

    return (
      <PolusPublicRun
        session={session}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestionsCount={totalQuestionsCount}
        currentAnswer={getCurrentAnswer(currentQuestion.id)}
        questionTransitionClass={questionTransitionClass}
        remainingSeconds={remainingSeconds}
        isSubmitting={saveAnswersMutation.isPending || finishMutation.isPending}
        onAnswerChange={setQuestionAnswer}
        onBack={() => goToQuestionIndex(currentQuestionIndex - 1)}
        onNext={() => goToQuestionIndex(currentQuestionIndex + 1)}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <PublicThemeLayout
      branding={session.publicBranding}
      containerClassName="grid min-h-screen max-w-3xl place-items-center py-5 md:py-7"
    >
      <div className="w-full space-y-5">
        <div className="space-y-3 px-1">
          {remainingSeconds !== null ? (
            <PublicTestRunTimer remainingSeconds={remainingSeconds} variant="standard" />
          ) : null}
          <PublicTestRunProgress
            currentQuestionIndex={currentQuestionIndex}
            totalQuestionsCount={totalQuestionsCount}
          />
        </div>

        {(() => {
          const currentQuestion = session.questions[currentQuestionIndex];
          const currentAnswer = getCurrentAnswer(currentQuestion.id);
          return (
            <div
              key={currentQuestion.id}
              className={`public-question-transition ${questionTransitionClass}`}
            >
              <PublicQuestionCard
                question={currentQuestion}
                currentAnswer={currentAnswer}
                isLastQuestion={currentQuestionIndex === session.questions.length - 1}
                isSubmitting={saveAnswersMutation.isPending || finishMutation.isPending}
                canGoBack={currentQuestionIndex > 0}
                onAnswerChange={setQuestionAnswer}
                onBack={() => goToQuestionIndex(currentQuestionIndex - 1)}
                onNext={() => goToQuestionIndex(currentQuestionIndex + 1)}
                onFinish={handleFinish}
              />
            </div>
          );
        })()}
      </div>
    </PublicThemeLayout>
  );
}
