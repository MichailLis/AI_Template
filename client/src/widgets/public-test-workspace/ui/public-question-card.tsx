import { ArrowLeft, ArrowRight, SendHorizontal } from 'lucide-react';

import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';

import { getPublicQuestionCardState, type AnswerOverride } from './public-question-card-state';
import { PublicQuestionChoiceGroup } from './public-question-choice-group';
import { PublicQuestionSliderField } from './public-question-slider-field';

import type { PublicTestQuestion } from './public-test-run.types';

interface QuestionNavigationProps {
  canGoBack: boolean;
  showPrimaryAction: boolean;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  disabled: boolean;
  onBack: () => void;
  onNext: () => void;
  onFinish: () => Promise<void>;
}

interface PublicQuestionCardProps {
  question: PublicTestQuestion;
  currentAnswer: unknown;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  canGoBack: boolean;
  onAnswerChange: (questionId: number, value: unknown) => void;
  onBack: () => void;
  onNext: () => void;
  onFinish: (answerOverride?: AnswerOverride) => Promise<void>;
}

function QuestionNavigation({
  canGoBack,
  showPrimaryAction,
  isLastQuestion,
  isSubmitting,
  disabled,
  onBack,
  onNext,
  onFinish,
}: QuestionNavigationProps) {
  let content = (
    <span className="inline-flex items-center gap-2">
      Далее
      <ArrowRight className="h-4 w-4" aria-hidden="true" />
    </span>
  );

  if (isLastQuestion) {
    content = (
      <span className="inline-flex items-center gap-2">
        Завершить тест
        <SendHorizontal className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }

  if (isSubmitting) {
    content = <>Сохраняем…</>;
  }

  if (!canGoBack && !showPrimaryAction) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3 pt-6">
      {canGoBack ? (
        <Button
          type="button"
          onClick={onBack}
          variant="ghost"
          className="h-11 rounded-xl border border-primary/15 bg-white/70 px-5 font-semibold text-foreground/75 shadow-sm hover:border-primary/30 hover:bg-white hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Назад
        </Button>
      ) : (
        <span className="hidden h-11 w-28 sm:block" aria-hidden="true" />
      )}

      {showPrimaryAction ? (
        <Button
          type="button"
          onClick={() => {
            if (isLastQuestion) {
              void onFinish();
              return;
            }

            onNext();
          }}
          disabled={disabled}
          className="h-11 rounded-xl bg-gradient-to-r from-primary to-accent px-7 font-semibold shadow-lg shadow-primary/20 hover:opacity-95 disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none"
        >
          {content}
        </Button>
      ) : null}
    </div>
  );
}

export function PublicQuestionCard({
  question,
  currentAnswer,
  isLastQuestion,
  isSubmitting,
  canGoBack,
  onAnswerChange,
  onBack,
  onNext,
  onFinish,
}: PublicQuestionCardProps) {
  const { sliderMeta, hasAnswer, needsInlineAction, inlineActionIsDisabled, handleSingleSelect } =
    getPublicQuestionCardState({
      question,
      currentAnswer,
      isLastQuestion,
      isSubmitting,
      onNext,
      onFinish,
    });

  return (
    <section className="public-glass public-question-stage flex rounded-[1.75rem] px-5 py-6 md:px-10 md:py-8">
      <div className="mx-auto flex min-h-[inherit] w-full max-w-3xl flex-col">
        <div className="flex flex-1 flex-col justify-center gap-6 py-2 md:py-4">
          <div className="space-y-3 text-center">
            <h1 className="text-balance text-2xl font-bold leading-tight text-foreground md:text-4xl">
              {question.title}
            </h1>
            {question.description ? (
              <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
                {question.description}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-4">
            {question.type === 'OPEN_TEXT' ? (
              <Textarea
                value={typeof currentAnswer === 'string' ? currentAnswer : ''}
                onChange={(event) => onAnswerChange(question.id, event.target.value)}
                placeholder="Введите ответ"
                className="public-text-answer min-h-40 rounded-2xl px-5 py-4 text-base leading-relaxed placeholder:text-muted-foreground/70 focus-visible:ring-0"
              />
            ) : null}

            {question.type === 'SINGLE_CHOICE' ? (
              <PublicQuestionChoiceGroup
                mode="single"
                questionId={question.id}
                options={question.options}
                currentAnswer={currentAnswer}
                onAnswerChange={onAnswerChange}
                onSingleSelect={handleSingleSelect}
              />
            ) : null}

            {question.type === 'MULTI_CHOICE' ? (
              <PublicQuestionChoiceGroup
                mode="multi"
                questionId={question.id}
                options={question.options}
                currentAnswer={currentAnswer}
                settings={question.settings}
                onAnswerChange={onAnswerChange}
              />
            ) : null}

            {question.type === 'SLIDER' && sliderMeta ? (
              <PublicQuestionSliderField
                questionId={question.id}
                min={sliderMeta.min}
                max={sliderMeta.max}
                step={sliderMeta.step}
                value={sliderMeta.value}
                hasAnswer={hasAnswer}
                activeLabel={sliderMeta.activeLabel}
                minLabel={sliderMeta.minLabel}
                maxLabel={sliderMeta.maxLabel}
                onAnswerChange={onAnswerChange}
              />
            ) : null}
          </div>
        </div>

        <QuestionNavigation
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
    </section>
  );
}
