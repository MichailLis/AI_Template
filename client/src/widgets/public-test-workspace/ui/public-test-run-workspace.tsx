import { useCallback, useState } from 'react';
import { Navigate } from 'react-router-dom';

import { getApiErrorStatus } from '@/shared/lib/api-error';

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

  const handleCountdownExpire = useCallback(() => {
    void sessionQuery.refetch();
  }, [sessionQuery]);

  const remainingSeconds = usePublicTestRunCountdown(
    session?.expiresAt ?? null,
    session?.serverTime ?? null,
    handleCountdownExpire,
  );

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

  // One failed poll must not wipe the screen of a student who is answering: keep the loaded
  // session unless the server says it is gone.
  if (!session || getApiErrorStatus(sessionQuery.error) === 404) {
    return (
      <PublicTestRunStateScreen
        message="Сессия недоступна или уже завершена. Свяжитесь с администратором теста для получения новой ссылки."
        tone="danger"
      />
    );
  }

  // The server matches the code case-insensitively and the code can be reissued under an open
  // attempt, so the URL follows the session's own code. The empty-code guard prevents a redirect loop.
  const canonicalCode = session.shortCode || code;
  if (canonicalCode !== code) {
    return <Navigate to={`/t/${canonicalCode}/session/${sessionToken}`} replace />;
  }

  if (session.questions.length === 0) {
    return <PublicTestRunStateScreen message="Тест пока не содержит вопросов." tone="danger" />;
  }

  // Завершенная сессия не должна снова показывать вопросы — перенаправляем на результат.
  if (session.status === 'COMPLETED') {
    return <Navigate to={`/t/${code}/result/${sessionToken}`} replace />;
  }

  // Статус с сервера является авторитетным: переход на экран истечения происходит, когда сервер зафиксировал EXPIRED или ABANDONED.
  if (session.status === 'EXPIRED' || session.status === 'ABANDONED') {
    return <PublicTestRunExpiredScreen code={code} session={session} />;
  }

  const currentQuestion = session.questions[currentQuestionIndex];
  const currentAnswer = getCurrentAnswer(currentQuestion.id);

  if (session.publicTemplate === 'POLUS') {
    return (
      <PolusPublicRun
        session={session}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestionsCount={totalQuestionsCount}
        currentAnswer={currentAnswer}
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
      </div>
    </PublicThemeLayout>
  );
}
