import { getMaxChoices, isChoiceLimitReached } from '@/features/tests';

import { getChoiceOptionClass } from './public-question-card.utils';

import type { PublicTestQuestionOption } from './public-test-run.types';

interface ChoiceGroupBaseProps {
  questionId: number;
  options: PublicTestQuestionOption[];
  currentAnswer: unknown;
  onAnswerChange: (questionId: number, value: unknown) => void;
}

/**
 * `settings` is required in multi mode on purpose: the cap it carries is enforced by the
 * server, so a caller that forgets to pass it should fail to compile rather than ship a
 * template where the student can exceed a limit the backend will then reject.
 */
type PublicQuestionChoiceGroupProps = ChoiceGroupBaseProps &
  (
    | { mode: 'single'; settings?: never; onSingleSelect?: (value: string) => void }
    | { mode: 'multi'; settings: unknown; onSingleSelect?: never }
  );

export function PublicQuestionChoiceGroup({
  mode,
  questionId,
  options,
  currentAnswer,
  settings,
  onAnswerChange,
  onSingleSelect,
}: PublicQuestionChoiceGroupProps) {
  const selectedValues = Array.isArray(currentAnswer) ? (currentAnswer as string[]) : [];
  const maxChoices = mode === 'multi' ? getMaxChoices(settings) : null;
  const limitReached = isChoiceLimitReached(selectedValues.length, maxChoices);

  return (
    <div className="flex flex-col gap-3">
      {maxChoices ? (
        <p className="text-sm text-muted-foreground" aria-live="polite">
          Выбрано {selectedValues.length} из {maxChoices}
        </p>
      ) : null}

      <div className={mode === 'multi' ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'}>
        {options.map((option) => {
          const checked =
            mode === 'single'
              ? currentAnswer === option.value
              : selectedValues.includes(option.value);
          const disabled = mode === 'multi' && !checked && limitReached;

          return (
            <label
              key={option.id}
              aria-disabled={disabled}
              className={`public-choice-option group flex min-h-14 items-center gap-4 rounded-2xl border px-5 py-3 text-sm transition-[border-color,background-color,box-shadow,transform,color] duration-200 ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-[0.99]'
              } ${getChoiceOptionClass(checked)}`}
            >
              <input
                type={mode === 'single' ? 'radio' : 'checkbox'}
                name={mode === 'single' ? `single-${questionId}` : undefined}
                checked={checked}
                disabled={disabled}
                onChange={(event) => {
                  if (mode === 'single') {
                    onAnswerChange(questionId, option.value);
                    onSingleSelect?.(option.value);
                    return;
                  }

                  if (event.target.checked) {
                    if (isChoiceLimitReached(selectedValues.length, maxChoices)) {
                      return;
                    }

                    onAnswerChange(questionId, [...selectedValues, option.value]);
                  } else {
                    onAnswerChange(
                      questionId,
                      selectedValues.filter((value) => value !== option.value),
                    );
                  }
                }}
                className="sr-only"
              />
              <span className="min-w-0 text-base leading-relaxed">{option.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
