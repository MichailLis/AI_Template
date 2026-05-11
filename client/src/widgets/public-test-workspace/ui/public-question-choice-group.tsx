import { getChoiceOptionClass } from './public-question-card.utils';

import type { PublicTestQuestionOption } from './public-test-run.types';

interface PublicQuestionChoiceGroupProps {
  mode: 'single' | 'multi';
  questionId: number;
  options: PublicTestQuestionOption[];
  currentAnswer: unknown;
  onAnswerChange: (questionId: number, value: unknown) => void;
  onSingleSelect?: (value: string) => void;
}

export function PublicQuestionChoiceGroup({
  mode,
  questionId,
  options,
  currentAnswer,
  onAnswerChange,
  onSingleSelect,
}: PublicQuestionChoiceGroupProps) {
  const selectedValues = Array.isArray(currentAnswer) ? (currentAnswer as string[]) : [];

  return (
    <div className={mode === 'multi' ? 'grid gap-3 md:grid-cols-2' : 'space-y-3'}>
      {options.map((option) => {
        const checked =
          mode === 'single'
            ? currentAnswer === option.value
            : selectedValues.includes(option.value);

        return (
          <label
            key={option.id}
            className={`public-choice-option group flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border px-5 py-3 text-sm transition-[border-color,background-color,box-shadow,transform,color] duration-200 active:scale-[0.99] ${getChoiceOptionClass(checked)}`}
          >
            <input
              type={mode === 'single' ? 'radio' : 'checkbox'}
              name={mode === 'single' ? `single-${questionId}` : undefined}
              checked={checked}
              onChange={(event) => {
                if (mode === 'single') {
                  onAnswerChange(questionId, option.value);
                  onSingleSelect?.(option.value);
                  return;
                }

                if (event.target.checked) {
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
  );
}
