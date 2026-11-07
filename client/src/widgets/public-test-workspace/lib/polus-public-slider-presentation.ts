interface PolusSliderPresentation {
  activeLabel: string | null;
  ariaLabel: string;
  maxLabel: string | null;
  minLabel: string | null;
  stageLabel: string | null;
  title: string | null;
}

type PolusSliderKind = 'interest' | 'readiness';

const getSettingsRecord = (settings: unknown) => {
  return typeof settings === 'object' && settings !== null && !Array.isArray(settings)
    ? (settings as Record<string, unknown>)
    : null;
};

const interestLabels = [
  'Пока не интересно',
  'Слабый интерес',
  'Есть интерес',
  'Интересно',
  'Очень интересно',
];
const readinessLabels = [
  'Пока не готов',
  'Нужна подготовка',
  'Можно попробовать',
  'Готов',
  'Полностью готов',
];

const getScaleLabel = (value: number, kind: PolusSliderKind) => {
  const labels = kind === 'interest' ? interestLabels : readinessLabels;

  if (value <= 2) {
    return labels[0];
  }

  if (value <= 4) {
    return labels[1];
  }

  if (value <= 6) {
    return labels[2];
  }

  if (value <= 8) {
    return labels[3];
  }

  return labels[4];
};

export const getPolusSliderPresentation = (
  settings: unknown,
  value: number,
  hasAnswer: boolean,
): PolusSliderPresentation => {
  const settingsRecord = getSettingsRecord(settings);
  const sliderKind = settingsRecord?.sliderKind;
  const methodologySliderId = settingsRecord?.methodologySliderId;

  if (sliderKind === 'interest') {
    return {
      activeLabel: hasAnswer ? getScaleLabel(value, 'interest') : null,
      ariaLabel: 'Оценка интереса по шкале',
      maxLabel: 'Очень интересно',
      minLabel: 'Совсем не интересно',
      stageLabel: 'Интерес',
      title: null,
    };
  }

  if (sliderKind === 'readiness') {
    return {
      activeLabel: hasAnswer ? getScaleLabel(value, 'readiness') : null,
      ariaLabel: 'Оценка готовности по шкале',
      maxLabel: 'Полностью готов',
      minLabel: 'Совсем не готов',
      stageLabel: 'Готовность',
      title:
        methodologySliderId === 'R_PRECISION'
          ? 'Насколько ты готов внимательно работать с размерами, качеством, измерениями и документацией?'
          : null,
    };
  }

  return {
    activeLabel: null,
    ariaLabel: 'Оценка по шкале',
    maxLabel: null,
    minLabel: null,
    stageLabel: null,
    title: null,
  };
};
