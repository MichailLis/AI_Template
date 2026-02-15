import type { PublicTestQuestionSliderBand } from './public-test-run.types';

interface SliderQuestionMeta {
  min: number;
  max: number;
  step: number;
  value: number;
}

export const getChoiceOptionClass = (checked: boolean) => {
  return checked ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/30';
};

export const getSliderQuestionMeta = (
  settings: unknown,
  sliderBands: PublicTestQuestionSliderBand[],
  currentAnswer: unknown,
): SliderQuestionMeta => {
  const settingsRecord =
    typeof settings === 'object' && settings !== null
      ? (settings as Record<string, unknown>)
      : null;

  const fallbackMin = sliderBands[0]?.minValue ?? 0;
  const fallbackMax = sliderBands.length > 0 ? sliderBands[sliderBands.length - 1].maxValue : 100;
  const min = typeof settingsRecord?.min === 'number' ? settingsRecord.min : fallbackMin;
  const max = typeof settingsRecord?.max === 'number' ? settingsRecord.max : fallbackMax;
  const step = typeof settingsRecord?.step === 'number' ? settingsRecord.step : 1;
  const value = typeof currentAnswer === 'number' ? currentAnswer : min;

  return {
    min,
    max,
    step,
    value,
  };
};
