import { getSliderQuestionMeta } from './public-question-card.utils';
import { hasMeaningfulQuestionAnswer } from './public-test-run-answer.helpers';

import type { PublicTestQuestion } from './public-test-run.types';

export interface AnswerOverride {
  questionId: number;
  value: unknown;
}

interface PublicQuestionCardStateParams {
  question: PublicTestQuestion;
  currentAnswer: unknown;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  onNext: () => void;
  onFinish: (answerOverride?: AnswerOverride) => Promise<void>;
}

export function getPublicQuestionCardState({
  question,
  currentAnswer,
  isLastQuestion,
  isSubmitting,
  onNext,
  onFinish,
}: PublicQuestionCardStateParams) {
  const sliderMeta =
    question.type === 'SLIDER'
      ? getSliderQuestionMeta(question.settings, question.sliderBands, currentAnswer)
      : null;
  const hasAnswer = hasMeaningfulQuestionAnswer(question.type, currentAnswer);
  const needsInlineAction = question.type !== 'SINGLE_CHOICE';
  const inlineActionIsDisabled = isSubmitting || (question.required && !hasAnswer);
  const handleSingleSelect = (value: string) => {
    if (isSubmitting) {
      return;
    }

    if (isLastQuestion) {
      void onFinish({ questionId: question.id, value });
      return;
    }

    onNext();
  };

  return {
    sliderMeta,
    hasAnswer,
    needsInlineAction,
    inlineActionIsDisabled,
    handleSingleSelect,
  };
}
