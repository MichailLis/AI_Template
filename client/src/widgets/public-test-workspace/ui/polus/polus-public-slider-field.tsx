import type { CSSProperties } from 'react';

interface PolusPublicSliderFieldProps {
  questionId: number;
  min: number;
  max: number;
  step: number;
  value: number;
  hasAnswer: boolean;
  activeLabel: string | null;
  ariaLabel?: string;
  minLabel: string | null;
  maxLabel: string | null;
  onAnswerChange: (questionId: number, value: unknown) => void;
}

const formatSliderValue = (value: number) => Number.parseFloat(value.toFixed(2)).toString();

const sliderLowColor = { red: 43, green: 67, blue: 127 };
const sliderHighColor = { red: 249, green: 0, blue: 82 };

const clampRatio = (value: number) => Math.min(1, Math.max(0, value));

const getSliderColor = (ratio: number, alpha?: number) => {
  const clampedRatio = clampRatio(ratio);
  const red = Math.round(
    sliderLowColor.red + (sliderHighColor.red - sliderLowColor.red) * clampedRatio,
  );
  const green = Math.round(
    sliderLowColor.green + (sliderHighColor.green - sliderLowColor.green) * clampedRatio,
  );
  const blue = Math.round(
    sliderLowColor.blue + (sliderHighColor.blue - sliderLowColor.blue) * clampedRatio,
  );

  return typeof alpha === 'number'
    ? `rgba(${red}, ${green}, ${blue}, ${alpha})`
    : `rgb(${red}, ${green}, ${blue})`;
};

export function PolusPublicSliderField({
  questionId,
  min,
  max,
  step,
  value,
  hasAnswer,
  activeLabel,
  ariaLabel = 'Оценка по шкале',
  minLabel,
  maxLabel,
  onAnswerChange,
}: PolusPublicSliderFieldProps) {
  const displayValue = hasAnswer ? value : min + (max - min) / 2;
  const progress = max > min ? ((displayValue - min) / (max - min)) * 100 : 0;
  const sliderRatio = clampRatio(progress / 100);
  const sliderStyle = {
    '--polus-slider-progress': `${progress}%`,
    '--polus-slider-active-color': getSliderColor(sliderRatio),
    '--polus-slider-active-shadow': getSliderColor(sliderRatio, 0.26),
  } as CSSProperties;

  const commitValue = (rawValue: number) => {
    const nextValue = Math.min(max, Math.max(min, rawValue));
    onAnswerChange(questionId, nextValue);
  };

  return (
    <div className="polus-slider-field" data-has-answer={hasAnswer} style={sliderStyle}>
      <div className="polus-slider-readout" aria-live="polite">
        <output className="polus-slider-value" htmlFor={`polus-question-${questionId}-slider`}>
          {hasAnswer ? formatSliderValue(value) : '—'}
        </output>
        <span className="polus-slider-value-label">
          {hasAnswer ? (activeLabel ?? 'Выбрана оценка') : 'Выберите значение'}
        </span>
      </div>

      <input
        id={`polus-question-${questionId}-slider`}
        name={`polus-question-${questionId}-slider`}
        className="polus-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={displayValue}
        aria-label={ariaLabel}
        aria-valuetext={hasAnswer ? `${formatSliderValue(value)}: ${activeLabel ?? ''}` : undefined}
        onInput={(event) => commitValue(Number(event.currentTarget.value))}
        onChange={(event) => commitValue(Number(event.currentTarget.value))}
      />

      <div className="polus-slider-scale" aria-hidden="true">
        <span className="polus-slider-scale-label">
          <strong>{formatSliderValue(min)}</strong>
          {minLabel ? <small>{minLabel}</small> : null}
        </span>
        <span className="polus-slider-scale-label">
          <strong>{formatSliderValue(max)}</strong>
          {maxLabel ? <small>{maxLabel}</small> : null}
        </span>
      </div>
    </div>
  );
}
