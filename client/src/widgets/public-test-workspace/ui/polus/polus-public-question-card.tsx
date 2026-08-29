import { ArrowLeft, ArrowRight, SendHorizontal } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

import { getMaxChoices, isChoiceLimitReached } from '@/features/tests';

import { getPublicQuestionCardState, type AnswerOverride } from '../public-question-card-state';

import { PolusPublicSliderField } from './polus-public-slider-field';
import { getPolusSliderPresentation } from './polus-public-slider-presentation';

import type { PublicTestQuestion } from '../public-test-run.types';

interface PolusPublicQuestionCardProps {
  question: PublicTestQuestion;
  currentAnswer: unknown;
  currentQuestionIndex: number;
  totalQuestionsCount: number;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  canGoBack: boolean;
  onAnswerChange: (questionId: number, value: unknown) => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: (answerOverride?: AnswerOverride) => Promise<void>;
}

const markerLetters = ['А', 'Б', 'В', 'Г', 'Д', 'Е'];

function getPrimaryActionContent(isSubmitting: boolean, isLastQuestion: boolean) {
  if (isSubmitting) {
    return 'Сохраняем...';
  }

  if (isLastQuestion) {
    return (
      <>
        Завершить тест
        <SendHorizontal className="h-4 w-4" aria-hidden="true" />
      </>
    );
  }

  return (
    <>
      Далее
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </>
  );
}

function PolusQuestionActions({
  canGoBack,
  showPrimaryAction,
  isLastQuestion,
  isSubmitting,
  disabled,
  onBack,
  onNext,
  onFinish,
}: {
  canGoBack: boolean;
  showPrimaryAction: boolean;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  disabled: boolean;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => Promise<void>;
}) {
  if (!canGoBack && !showPrimaryAction) {
    return null;
  }

  return (
    <div className="polus-question-actions">
      {canGoBack ? (
        <button className="polus-secondary-action" type="button" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад
        </button>
      ) : (
        <span aria-hidden="true" />
      )}

      {showPrimaryAction ? (
        <button
          className="polus-primary-action"
          type="button"
          disabled={disabled}
          onClick={() => {
            if (isLastQuestion) {
              void onFinish();
              return;
            }

            onNext();
          }}
        >
          {getPrimaryActionContent(isSubmitting, isLastQuestion)}
        </button>
      ) : null}
    </div>
  );
}

function PolusChoiceAnswers({
  mode,
  question,
  currentAnswer,
  isSubmitting,
  onAnswerChange,
  onSingleSelect,
}: {
  mode: 'single' | 'multi';
  question: PublicTestQuestion;
  currentAnswer: unknown;
  isSubmitting: boolean;
  onAnswerChange: (questionId: number, value: unknown) => void;
  onSingleSelect?: (value: string) => void;
}) {
  const selectedValues = useMemo(
    () => (Array.isArray(currentAnswer) ? (currentAnswer as string[]) : []),
    [currentAnswer],
  );
  const latestMultiValuesRef = useRef<string[]>(selectedValues);
  const maxChoices = mode === 'multi' ? getMaxChoices(question.settings) : null;
  const selectedCount = selectedValues.length;

  useEffect(() => {
    latestMultiValuesRef.current = selectedValues;
  }, [selectedValues]);

  return (
    <>
      {maxChoices ? (
        <p className="polus-question-description" aria-live="polite">
          {selectedCount} из {maxChoices}
        </p>
      ) : null}

      <div
        className={
          mode === 'multi' ? 'polus-answer-list polus-answer-list--multi' : 'polus-answer-list'
        }
        role="group"
        aria-label="Варианты ответа"
      >
        {question.options.map((option, index) => {
          const selected =
            mode === 'single'
              ? currentAnswer === option.value
              : selectedValues.includes(option.value);
          const limitReached = isChoiceLimitReached(selectedCount, maxChoices);
          const disabled = isSubmitting || (mode === 'multi' && !selected && limitReached);

          return (
            <button
              key={option.id}
              className="polus-answer-option"
              type="button"
              data-selected={selected}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => {
                if (mode === 'single') {
                  onAnswerChange(question.id, option.value);
                  onSingleSelect?.(option.value);
                  return;
                }

                const latestSelectedValues = latestMultiValuesRef.current;
                const latestSelected = latestSelectedValues.includes(option.value);

                if (!latestSelected && maxChoices && latestSelectedValues.length >= maxChoices) {
                  return;
                }

                const nextValues = latestSelected
                  ? latestSelectedValues.filter((value) => value !== option.value)
                  : [...latestSelectedValues, option.value];

                latestMultiValuesRef.current = nextValues;
                onAnswerChange(question.id, nextValues);
              }}
            >
              <span className="polus-answer-marker">{markerLetters[index] ?? index + 1}</span>
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function PolusPublicQuestionCard({
  question,
  currentAnswer,
  currentQuestionIndex,
  totalQuestionsCount,
  isLastQuestion,
  isSubmitting,
  canGoBack,
  onAnswerChange,
  onBack,
  onNext,
  onFinish,
}: PolusPublicQuestionCardProps) {
  const { sliderMeta, hasAnswer, needsInlineAction, inlineActionIsDisabled, handleSingleSelect } =
    getPublicQuestionCardState({
      question,
      currentAnswer,
      isLastQuestion,
      isSubmitting,
      onNext,
      onFinish,
    });
  const sliderPresentation = sliderMeta
    ? getPolusSliderPresentation(question.settings, sliderMeta.value, hasAnswer)
    : null;
  const progress =
    totalQuestionsCount > 0 ? ((currentQuestionIndex + 1) / totalQuestionsCount) * 100 : 0;

  return (
    <div className="polus-question-shell">
      <div
        className="polus-progress-block"
        aria-label={`Прогресс ${currentQuestionIndex + 1} из ${totalQuestionsCount}`}
      >
        <div className="polus-progress-meta">
          <strong>Вопрос {currentQuestionIndex + 1}</strong>
          <span>из {totalQuestionsCount}</span>
        </div>
        <div className="polus-progress-line">
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>

      <article className="polus-question-card">
        {sliderPresentation?.stageLabel ? (
          <p className="polus-question-kicker">{sliderPresentation.stageLabel}</p>
        ) : null}
        <h2>{sliderPresentation?.title ?? question.title}</h2>
        {question.description ? (
          <p className="polus-question-description">{question.description}</p>
        ) : null}

        {question.type === 'OPEN_TEXT' ? (
          <textarea
            className="polus-textarea"
            aria-label="Ответ"
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChange={(event) => onAnswerChange(question.id, event.target.value)}
            placeholder="Введите ответ"
          />
        ) : null}

        {question.type === 'SINGLE_CHOICE' ? (
          <PolusChoiceAnswers
            mode="single"
            question={question}
            currentAnswer={currentAnswer}
            isSubmitting={isSubmitting}
            onAnswerChange={onAnswerChange}
            onSingleSelect={handleSingleSelect}
          />
        ) : null}

        {question.type === 'MULTI_CHOICE' ? (
          <PolusChoiceAnswers
            mode="multi"
            question={question}
            currentAnswer={currentAnswer}
            isSubmitting={isSubmitting}
            onAnswerChange={onAnswerChange}
          />
        ) : null}

        {question.type === 'SLIDER' && sliderMeta ? (
          <PolusPublicSliderField
            questionId={question.id}
            min={sliderMeta.min}
            max={sliderMeta.max}
            step={sliderMeta.step}
            value={sliderMeta.value}
            hasAnswer={hasAnswer}
            activeLabel={sliderPresentation?.activeLabel ?? sliderMeta.activeLabel}
            ariaLabel={sliderPresentation?.ariaLabel}
            minLabel={sliderPresentation?.minLabel ?? sliderMeta.minLabel}
            maxLabel={sliderPresentation?.maxLabel ?? sliderMeta.maxLabel}
            onAnswerChange={onAnswerChange}
          />
        ) : null}
      </article>

      <PolusQuestionActions
        canGoBack={canGoBack}
        showPrimaryAction={needsInlineAction}
        isLastQuestion={isLastQuestion}
        isSubmitting={isSubmitting}
        disabled={inlineActionIsDisabled}
        onBack={onBack}
        onNext={onNext}
        onFinish={onFinish}
      />
    </div>
  );
}
