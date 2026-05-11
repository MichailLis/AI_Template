import { useEffect, useRef, useState } from 'react';

type QuestionTransitionDirection = 'forward' | 'backward';

interface UseQuestionTransitionParams {
  currentQuestionIndex: number;
  questionCount: number;
  onQuestionIndexChange: (questionIndex: number) => void;
}

const QUESTION_LEAVE_MS = 150;
const QUESTION_ENTER_MS = 260;

const getLeaveClass = (direction: QuestionTransitionDirection) =>
  direction === 'forward' ? 'public-question-leave-next' : 'public-question-leave-prev';

const getEnterClass = (direction: QuestionTransitionDirection) =>
  direction === 'forward' ? 'public-question-enter-next' : 'public-question-enter-prev';

export function useQuestionTransition({
  currentQuestionIndex,
  questionCount,
  onQuestionIndexChange,
}: UseQuestionTransitionParams) {
  const [questionTransitionClass, setQuestionTransitionClass] = useState('');
  const isTransitioningRef = useRef(false);
  const leaveTimeoutRef = useRef<number | null>(null);
  const enterTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (leaveTimeoutRef.current !== null) {
        window.clearTimeout(leaveTimeoutRef.current);
      }

      if (enterTimeoutRef.current !== null) {
        window.clearTimeout(enterTimeoutRef.current);
      }
    },
    [],
  );

  const goToQuestionIndex = (nextQuestionIndex: number) => {
    if (
      isTransitioningRef.current ||
      nextQuestionIndex === currentQuestionIndex ||
      nextQuestionIndex < 0 ||
      nextQuestionIndex >= questionCount
    ) {
      return;
    }

    const direction = nextQuestionIndex > currentQuestionIndex ? 'forward' : 'backward';
    isTransitioningRef.current = true;
    setQuestionTransitionClass(getLeaveClass(direction));

    leaveTimeoutRef.current = window.setTimeout(() => {
      onQuestionIndexChange(nextQuestionIndex);
      setQuestionTransitionClass(getEnterClass(direction));

      enterTimeoutRef.current = window.setTimeout(() => {
        isTransitioningRef.current = false;
      }, QUESTION_ENTER_MS);
    }, QUESTION_LEAVE_MS);
  };

  return {
    goToQuestionIndex,
    questionTransitionClass,
  };
}
