import rawConfig from './prof-orientation-v3-plus/site-config.json';

import type { PersistQuestionPayload } from './tests-topic-version.utils';
import type {
  ProfOrientationDirectionId,
  ProfOrientationResultCard,
} from './prof-orientation-v3-plus.types';

interface SiteConfigAnswer {
  id: string;
  direction: ProfOrientationDirectionId;
  text: string;
  points: number;
}

interface SiteConfigQuestion {
  id: string;
  text: string;
  max_choices: number;
  choice_instruction: string;
  points_per_answer: number;
  answers: SiteConfigAnswer[];
}

interface SiteConfigSlider {
  id: string;
  category: 'interest' | 'readiness';
  direction?: ProfOrientationDirectionId;
  text: string;
  min: number;
  max: number;
  weights?: Partial<Record<ProfOrientationDirectionId, number>>;
}

interface SiteConfigDirection {
  block: string;
  name: string;
  short: string;
  professions: Array<{
    code: string;
    title: string;
    type: string;
  }>;
  result_card: {
    headline: string;
    meaning: string;
    fits_if: string[];
    try_actions: string[];
    learn: string[];
    mini_project: string;
  };
}

interface SiteConfigMixedProfile {
  directions: ProfOrientationDirectionId[];
  title: string;
  meaning: string;
  professions: Array<{
    code: string;
    title: string;
    type: string;
  }>;
  mini_project: string;
}

export interface ProfOrientationV3PlusConfig {
  version: string;
  purpose: string;
  directions: Record<ProfOrientationDirectionId, SiteConfigDirection>;
  mixed_profiles: Record<string, SiteConfigMixedProfile>;
  questions: SiteConfigQuestion[];
  sliders: SiteConfigSlider[];
  scoring: {
    max_choices_per_mc_question: number;
    interest_slider_multiplier: number;
    readiness_slider_multiplier: number;
  };
  control_rules: Record<string, string>;
  result_output: Record<string, string[]>;
}

export const PROF_ORIENTATION_V3_PLUS_TITLE = 'Профориентационный тест v3+';
export const PROF_ORIENTATION_V3_PLUS_SLUG = 'prof-orientation-v3-plus';
export const PROF_ORIENTATION_V3_PLUS_PROMPT_TITLE = 'Профориентация v3+: обогащение результата';
export const PROF_ORIENTATION_V3_PLUS_PROMPT_MODEL = 'openai/gpt-oss-120b';
export const PROF_ORIENTATION_V3_PLUS_PROMPT = [
  'Ты помогаешь школьнику понять результат профориентационного теста.',
  'Работай строго в рамках методики v3+: направления, карточка результата, профессии, мини-проект, уверенность и flags уже рассчитаны алгоритмом.',
  'Нельзя менять top direction, confidence, scores, classification или список профессий.',
  'Не добавляй общий психологический профиль, тип личности или направления вне методики.',
  'Для блока "Профессор Полюс говорит" напиши простое саммари карточки на 2-3 предложения: смысл результата, чем направление может быть интересно и какую практическую пробу сделать первой.',
  'В объяснениях не показывай школьнику внутренние JSON-ключи, технические коды профилей, формулы, значения слайдеров и расчетные поля.',
  'Сформируй бережное пояснение в JSON по методической схеме: что означает профиль, какие первые пробы сделать, что изучать дальше и как связаны подходящие профессии.',
].join('\n');

export const PROF_ORIENTATION_V3_PLUS_CONFIG = rawConfig as ProfOrientationV3PlusConfig;

export const toProfOrientationScoringConfig = () => PROF_ORIENTATION_V3_PLUS_CONFIG;

export const getProfOrientationV3PlusProfessions = () => {
  const professions = new Map<string, { code: string; title: string }>();

  for (const direction of Object.values(PROF_ORIENTATION_V3_PLUS_CONFIG.directions)) {
    for (const profession of direction.professions) {
      professions.set(profession.code, {
        code: profession.code,
        title: profession.title,
      });
    }
  }

  return [...professions.values()];
};

export const toProfOrientationResultCard = (
  resultCard: SiteConfigDirection['result_card'],
): ProfOrientationResultCard => ({
  headline: resultCard.headline,
  meaning: resultCard.meaning,
  fitsIf: resultCard.fits_if,
  tryActions: resultCard.try_actions,
  learn: resultCard.learn,
  miniProject: resultCard.mini_project,
});

const sliderBands = [
  { minValue: 0, maxValue: 2, label: 'Почти нет', weight: 0, order: 1 },
  { minValue: 3, maxValue: 4, label: 'Слабо', weight: 0, order: 2 },
  { minValue: 5, maxValue: 6, label: 'Умеренно', weight: 0, order: 3 },
  { minValue: 7, maxValue: 8, label: 'Заметно', weight: 0, order: 4 },
  { minValue: 9, maxValue: 10, label: 'Очень сильно', weight: 0, order: 5 },
];

export const buildProfOrientationV3PlusQuestionPayloads = (): PersistQuestionPayload[] => {
  const multipleChoiceQuestions = PROF_ORIENTATION_V3_PLUS_CONFIG.questions.map((question) => ({
    type: 'MULTI_CHOICE' as const,
    title: question.text,
    description: question.choice_instruction,
    required: true,
    settings: {
      methodologyQuestionId: question.id,
      maxChoices: question.max_choices,
      pointsPerAnswer: question.points_per_answer,
      directionMap: Object.fromEntries(
        question.answers.map((answer) => [answer.id, answer.direction]),
      ),
    },
    options: question.answers.map((answer, index) => ({
      label: answer.text,
      value: answer.id,
      weight: Math.round(answer.points),
      order: index + 1,
    })),
    sliderBands: [],
  }));

  const sliderQuestions = PROF_ORIENTATION_V3_PLUS_CONFIG.sliders.map((slider) => ({
    type: 'SLIDER' as const,
    title: slider.text,
    description: null,
    required: true,
    settings: {
      methodologySliderId: slider.id,
      sliderKind: slider.category,
      ...(slider.direction ? { direction: slider.direction } : {}),
      ...(slider.weights ? { weights: slider.weights } : {}),
      min: slider.min,
      max: slider.max,
      step: 1,
    },
    options: [],
    sliderBands,
  }));

  return [...multipleChoiceQuestions, ...sliderQuestions];
};
