import type { ChangeEvent, CSSProperties, FormEvent } from 'react';

interface PublicQuestionSliderFieldProps {
  questionId: number;
  min: number;
  max: number;
  step: number;
  value: number;
  hasAnswer: boolean;
  activeLabel: string | null;
  minLabel: string | null;
  maxLabel: string | null;
  onAnswerChange: (questionId: number, value: unknown) => void;
}

const getPosition = (min: number, max: number, value: number) => {
  if (max <= min) {
    return 0;
  }

  return ((value - min) / (max - min)) * 100;
};

const getSliderOptions = (min: number, max: number, step: number) => {
  const normalizedStep = step > 0 ? step : 1;
  const options: number[] = [];

  for (let option = min; option <= max && options.length <= 11; option += normalizedStep) {
    options.push(option);
  }

  return options.length <= 11 ? options : [];
};

const getAriaValueText = ({
  hasAnswer,
  activeText,
  value,
}: {
  hasAnswer: boolean;
  activeText: string | null;
  value: number;
}) => {
  if (!hasAnswer) {
    return 'Значение не выбрано';
  }

  if (activeText) {
    return `${value}: ${activeText}`;
  }

  return String(value);
};

export function PublicQuestionSliderField({
  questionId,
  min,
  max,
  step,
  value,
  hasAnswer,
  activeLabel,
  minLabel,
  maxLabel,
  onAnswerChange,
}: PublicQuestionSliderFieldProps) {
  const progress = hasAnswer ? getPosition(min, max, value) : 0;
  const activeText = hasAnswer ? activeLabel : 'Выберите значение';
  const sliderOptions = getSliderOptions(min, max, step);
  const sliderStyle = {
    '--slider-progress': `${progress}%`,
  } as CSSProperties;
  const ariaValueText = getAriaValueText({ hasAnswer, activeText, value });

  const commitValue = (nextValue: number) => {
    onAnswerChange(questionId, Math.min(max, Math.max(min, nextValue)));
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    commitValue(Number(event.currentTarget.value));
  };

  const handleInput = (event: FormEvent<HTMLInputElement>) => {
    commitValue(Number(event.currentTarget.value));
  };

  return (
    <div className="public-slider-field" style={sliderStyle}>
      <div className="public-slider-readout">
        <output
          className="public-slider-value"
          htmlFor={`question-${questionId}-slider`}
          aria-live="polite"
        >
          {hasAnswer ? value : '—'}
        </output>
        <span className="public-slider-value-label">{activeText}</span>
      </div>

      <div className="space-y-4">
        <input
          id={`question-${questionId}-slider`}
          name={`question-${questionId}-slider`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onInput={handleInput}
          onChange={handleChange}
          className="public-slider w-full"
          style={sliderStyle}
          aria-label="Оценка по шкале"
          aria-valuetext={ariaValueText}
        />

        {minLabel || maxLabel ? (
          <div className="public-slider-scale">
            <div className="min-w-0 text-left">
              {minLabel ? <span className="public-slider-scale-label">{minLabel}</span> : null}
            </div>
            <div className="min-w-0 text-right">
              {maxLabel ? <span className="public-slider-scale-label">{maxLabel}</span> : null}
            </div>
          </div>
        ) : null}

        {sliderOptions.length > 0 ? (
          <div className="public-slider-options" aria-label="Значения шкалы">
            {sliderOptions.map((option) => (
              <button
                key={option}
                type="button"
                className="public-slider-option"
                data-active={hasAnswer && option === value}
                onClick={() => commitValue(option)}
                aria-label={`Выбрать оценку ${option}`}
              >
                {option}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
