import type { PublicTestQuestionSliderBand } from './public-test-run.types';

interface SliderQuestionMeta {
  min: number;
  max: number;
  step: number;
  value: number;
  activeLabel: string | null;
  minLabel: string | null;
  maxLabel: string | null;
}

export const getChoiceOptionClass = (checked: boolean) => {
  return checked
    ? 'border-primary/80 bg-primary/15 text-foreground shadow-[0_18px_45px_hsl(var(--primary)/0.16)]'
    : 'border-primary/20 bg-white text-foreground shadow-[0_12px_32px_hsl(207_45%_28%/0.08)] hover:border-primary/45 hover:bg-white hover:shadow-[0_16px_38px_hsl(207_45%_28%/0.12)]';
};

const getSliderBand = (sortedBands: PublicTestQuestionSliderBand[], value: number) => {
  if (sortedBands.length === 0) {
    return null;
  }

  const activeBand = sortedBands.find((band) => value >= band.minValue && value <= band.maxValue);

  if (activeBand) {
    return activeBand;
  }

  return sortedBands.reduce((closestBand, band) => {
    const bandCenter = (band.minValue + band.maxValue) / 2;
    const closestCenter = (closestBand.minValue + closestBand.maxValue) / 2;

    return Math.abs(bandCenter - value) < Math.abs(closestCenter - value) ? band : closestBand;
  });
};

const getSliderBandLabel = (sortedBands: PublicTestQuestionSliderBand[], value: number) => {
  return getSliderBand(sortedBands, value)?.label ?? null;
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

  const sortedBands = [...sliderBands].sort((left, right) => left.minValue - right.minValue);
  const fallbackMin = sortedBands[0]?.minValue ?? 0;
  const fallbackMax = sortedBands.length > 0 ? sortedBands[sortedBands.length - 1].maxValue : 100;
  const min = typeof settingsRecord?.min === 'number' ? settingsRecord.min : fallbackMin;
  const max = typeof settingsRecord?.max === 'number' ? settingsRecord.max : fallbackMax;
  const step = typeof settingsRecord?.step === 'number' ? settingsRecord.step : 1;
  const answerValue = typeof currentAnswer === 'number' ? currentAnswer : min;
  const value = Math.min(max, Math.max(min, answerValue));
  const activeBand = getSliderBand(sortedBands, value);

  return {
    min,
    max,
    step,
    value,
    activeLabel: activeBand?.label ?? null,
    minLabel: getSliderBandLabel(sortedBands, min),
    maxLabel: getSliderBandLabel(sortedBands, max),
  };
};
