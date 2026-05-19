import type { CSSProperties } from 'react';

interface PolusPublicSliderFieldProps {
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

const formatSliderValue = (value: number) => Number.parseFloat(value.toFixed(2)).toString();

export function PolusPublicSliderField({
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
}: PolusPublicSliderFieldProps) {
  const progress = max > min ? ((value - min) / (max - min)) * 100 : 0;

  const commitValue = (rawValue: number) => {
    const nextValue = Math.min(max, Math.max(min, rawValue));
    onAnswerChange(questionId, nextValue);
  };

  return (
    <div
      className="polus-slider-field"
      style={{ '--polus-slider-progress': `${progress}%` } as CSSProperties}
    >
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
        value={value}
        aria-label="Оценка по шкале"
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
