import { PolusPublicLayout } from './polus-public-layout';
import { PolusPublicQuestionCard } from './polus-public-question-card';

import type { PublicTestSession } from '../public-test-run.types';

interface AnswerOverride {
  questionId: number;
  value: unknown;
}

interface PolusPublicRunProps {
  session: PublicTestSession;
  currentQuestionIndex: number;
  totalQuestionsCount: number;
  currentAnswer: unknown;
  questionTransitionClass: string;
  isSubmitting: boolean;
  onAnswerChange: (questionId: number, value: unknown) => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: (answerOverride?: AnswerOverride) => Promise<void>;
}

export function PolusPublicRun({
  session,
  currentQuestionIndex,
  totalQuestionsCount,
  currentAnswer,
  questionTransitionClass,
  isSubmitting,
  onAnswerChange,
  onBack,
  onNext,
  onFinish,
}: PolusPublicRunProps) {
  const currentQuestion = session.questions[currentQuestionIndex];

  return (
    <PolusPublicLayout view="question">
      <div
        key={currentQuestion.id}
        className={`public-question-transition ${questionTransitionClass}`}
      >
        <PolusPublicQuestionCard
          question={currentQuestion}
          currentAnswer={currentAnswer}
          currentQuestionIndex={currentQuestionIndex}
          totalQuestionsCount={totalQuestionsCount}
          isLastQuestion={currentQuestionIndex === session.questions.length - 1}
          isSubmitting={isSubmitting}
          canGoBack={currentQuestionIndex > 0}
          onAnswerChange={onAnswerChange}
          onBack={onBack}
          onNext={onNext}
          onFinish={onFinish}
        />
      </div>
    </PolusPublicLayout>
  );
}
