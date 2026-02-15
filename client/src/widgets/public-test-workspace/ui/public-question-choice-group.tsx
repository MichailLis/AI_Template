import { getChoiceOptionClass } from './public-question-card.utils';

import type { PublicTestQuestionOption } from './public-test-run.types';

interface PublicQuestionChoiceGroupProps {
  mode: 'single' | 'multi';
  questionId: number;
  options: PublicTestQuestionOption[];
  currentAnswer: unknown;
  onAnswerChange: (questionId: number, value: unknown) => void;
}

export function PublicQuestionChoiceGroup({
  mode,
  questionId,
  options,
  currentAnswer,
  onAnswerChange,
}: PublicQuestionChoiceGroupProps) {
  const selectedValues = Array.isArray(currentAnswer) ? (currentAnswer as string[]) : [];

  return (
    <div className="space-y-2">
      {options.map((option) => {
        const checked =
          mode === 'single'
            ? currentAnswer === option.value
            : selectedValues.includes(option.value);

        return (
          <label
            key={option.id}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${getChoiceOptionClass(checked)}`}
          >
            <input
              type={mode === 'single' ? 'radio' : 'checkbox'}
              name={mode === 'single' ? `single-${questionId}` : undefined}
              checked={checked}
              onChange={(event) => {
                if (mode === 'single') {
                  onAnswerChange(questionId, option.value);
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
              className="h-4 w-4 border-border text-primary"
            />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
