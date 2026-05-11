import type { CSSProperties } from 'react';

interface PublicQuestionSliderFieldProps {
  questionId: number;
  min: number;
  max: number;
  step: number;
  value: number;
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

export function PublicQuestionSliderField({
  questionId,
  min,
  max,
  step,
  value,
  activeLabel,
  minLabel,
  maxLabel,
  onAnswerChange,
}: PublicQuestionSliderFieldProps) {
  const progress = getPosition(min, max, value);
  const activeText = activeLabel;
  const sliderStyle = {
    '--slider-progress': `${progress}%`,
  } as CSSProperties;

  return (
    <div className="public-slider-field" style={sliderStyle}>
      <div className="public-slider-readout">
        <output
          className="public-slider-value"
          htmlFor={`question-${questionId}-slider`}
          aria-live="polite"
        >
          {value}
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
          onChange={(event) => onAnswerChange(questionId, Number(event.target.value))}
          className="public-slider w-full"
          style={sliderStyle}
          aria-label="Оценка по шкале"
          aria-valuetext={activeText ? `${value}: ${activeText}` : String(value)}
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
      </div>
    </div>
  );
}
