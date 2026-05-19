import {
  PROF_ORIENTATION_V3_PLUS_CONFIG,
  toProfOrientationResultCard,
  type ProfOrientationV3PlusConfig,
} from './prof-orientation-v3-plus.fixture';
import {
  PROF_ORIENTATION_DIRECTIONS,
  PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
  type ProfOrientationDirectionId,
  type ProfOrientationDirectionSummary,
  type ProfOrientationFlag,
  type ProfOrientationProfileType,
  type ProfOrientationSummary,
} from './prof-orientation-v3-plus.types';

type QuestionType = 'OPEN_TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'SLIDER';

interface ScoringQuestion {
  id: number;
  type: QuestionType;
  settings: unknown;
  options: Array<{
    value: string;
  }>;
}

interface ScoringAnswer {
  questionId: number;
  answerPayload: unknown;
}

interface ScoreInput {
  questions: ScoringQuestion[];
  answers: ScoringAnswer[];
  config?: ProfOrientationV3PlusConfig;
  llmStatus?: ProfOrientationSummary['llm']['status'];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const roundScore = (value: number) => Math.round(value * 10) / 10;

const createDirectionRecord = <T>(valueFactory: () => T): Record<ProfOrientationDirectionId, T> =>
  Object.fromEntries(
    PROF_ORIENTATION_DIRECTIONS.map((direction) => [direction, valueFactory()]),
  ) as Record<ProfOrientationDirectionId, T>;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const median = (values: number[]) => {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const getSettingsRecord = (question: ScoringQuestion) =>
  isRecord(question.settings) ? question.settings : null;

const getMethodologyQuestionId = (question: ScoringQuestion) => {
  const settings = getSettingsRecord(question);
  const value = settings?.methodologyQuestionId;

  return typeof value === 'string' ? value : null;
};

const getMethodologySliderId = (question: ScoringQuestion) => {
  const settings = getSettingsRecord(question);
  const value = settings?.methodologySliderId;

  return typeof value === 'string' ? value : null;
};

const getAnswerValues = (answerPayload: unknown) => {
  if (Array.isArray(answerPayload)) {
    return answerPayload.filter((value): value is string => typeof value === 'string');
  }

  return typeof answerPayload === 'string' ? [answerPayload] : [];
};

const getNumberAnswer = (answerPayload: unknown) =>
  typeof answerPayload === 'number' && Number.isFinite(answerPayload) ? answerPayload : null;

const getDirectionFromAnswerValue = (
  value: string,
  directionMap: Record<string, ProfOrientationDirectionId>,
) => directionMap[value] ?? null;

const getDirectionSummary = (
  directionId: ProfOrientationDirectionId,
  score: number,
  config: ProfOrientationV3PlusConfig,
): ProfOrientationDirectionSummary => {
  const direction = config.directions[directionId];

  return {
    id: directionId,
    block: direction.block,
    name: direction.name,
    short: direction.short,
    score: roundScore(score),
    professions: direction.professions,
    resultCard: toProfOrientationResultCard(direction.result_card),
  };
};

const getMixedProfileKey = (
  first: ProfOrientationDirectionId,
  second: ProfOrientationDirectionId,
) => {
  const sorted = [first, second].sort(
    (left, right) =>
      PROF_ORIENTATION_DIRECTIONS.indexOf(left) - PROF_ORIENTATION_DIRECTIONS.indexOf(right),
  );

  return `${sorted[0]}+${sorted[1]}`;
};

const buildProfile = (
  type: ProfOrientationProfileType,
  topDirections: ProfOrientationDirectionSummary[],
  config: ProfOrientationV3PlusConfig,
) => {
  const primary = topDirections[0];
  const secondary = topDirections[1];

  if (type === 'mixed_profile' && primary && secondary) {
    const mixedProfile = config.mixed_profiles[getMixedProfileKey(primary.id, secondary.id)];

    if (mixedProfile) {
      return {
        type,
        title: mixedProfile.title,
        meaning: mixedProfile.meaning,
        directions: mixedProfile.directions,
        miniProject: mixedProfile.mini_project,
      };
    }
  }

  if (type === 'broad_interest') {
    return {
      type,
      title: 'Широкий технический интерес',
      meaning:
        'Несколько направлений выражены близко: стоит попробовать короткие практические пробы.',
      directions: topDirections.slice(0, 3).map((direction) => direction.id),
      miniProject: null,
    };
  }

  if (type === 'low_definition') {
    return {
      type,
      title: 'Интерес пока не определен',
      meaning:
        'По ответам пока рано жестко выбирать одно направление: лучше начать с небольших проб.',
      directions: topDirections.slice(0, 3).map((direction) => direction.id),
      miniProject: null,
    };
  }

  return {
    type: 'single_profile' as const,
    title: primary?.name ?? 'Технический профиль',
    meaning: primary?.resultCard.meaning ?? 'Подходящее направление требует практической проверки.',
    directions: primary ? [primary.id] : [],
    miniProject: primary?.resultCard.miniProject ?? null,
  };
};

const confidenceLabelByLevel = {
  high: 'высокая',
  medium: 'средняя',
  mixed: 'смешанная',
  broad: 'широкий интерес',
  low: 'низкая',
} as const;

const getReadinessForDirection = (
  directionId: ProfOrientationDirectionId,
  sliderValues: Record<string, number>,
  config: ProfOrientationV3PlusConfig,
) => {
  let weightedSum = 0;
  let weightsSum = 0;

  for (const slider of config.sliders) {
    if (slider.category !== 'readiness') {
      continue;
    }

    const weight = slider.weights?.[directionId] ?? 0;
    if (weight <= 0) {
      continue;
    }

    weightedSum += (sliderValues[slider.id] ?? 0) * weight;
    weightsSum += weight;
  }

  return weightsSum > 0 ? weightedSum / weightsSum : 0;
};

const getConfidence = (input: {
  gap: number;
  consistencyIndex: number;
  readinessTop: number;
  hasStrongContradiction: boolean;
  isLow: boolean;
  isBroad: boolean;
}) => {
  if (input.isLow) {
    return 'low' as const;
  }

  if (input.isBroad) {
    return 'broad' as const;
  }

  if (input.gap < 6) {
    return 'mixed' as const;
  }

  if (
    input.gap >= 8 &&
    input.consistencyIndex >= 0.65 &&
    input.readinessTop >= 4 &&
    !input.hasStrongContradiction
  ) {
    return 'high' as const;
  }

  return input.gap >= 5 ? ('medium' as const) : ('mixed' as const);
};

export const scoreProfOrientationV3Plus = ({
  questions,
  answers,
  config = PROF_ORIENTATION_V3_PLUS_CONFIG,
  llmStatus = 'not_requested',
}: ScoreInput): ProfOrientationSummary => {
  const scores = createDirectionRecord(() => 0);
  const selectedCounts = createDirectionRecord(() => 0);
  const answerByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const questionByMethodologyId = new Map(
    questions
      .map((question) => [getMethodologyQuestionId(question), question] as const)
      .filter((item): item is readonly [string, ScoringQuestion] => item[0] !== null),
  );
  const questionBySliderId = new Map(
    questions
      .map((question) => [getMethodologySliderId(question), question] as const)
      .filter((item): item is readonly [string, ScoringQuestion] => item[0] !== null),
  );
  const sliderValues: Record<string, number> = {};
  let overchoiceQuestions = 0;

  for (const questionConfig of config.questions) {
    const question = questionByMethodologyId.get(questionConfig.id);
    const selectedValues = question
      ? getAnswerValues(answerByQuestionId.get(question.id)?.answerPayload)
      : [];

    if (selectedValues.length === 0) {
      continue;
    }

    if (selectedValues.length > questionConfig.max_choices) {
      overchoiceQuestions += 1;
    }

    const directionMap = Object.fromEntries(
      questionConfig.answers.map((answer) => [answer.id, answer.direction]),
    ) as Record<string, ProfOrientationDirectionId>;
    const selectedDirections = selectedValues
      .map((value) => getDirectionFromAnswerValue(value, directionMap))
      .filter((direction): direction is ProfOrientationDirectionId => direction !== null);
    const maxPoints = questionConfig.points_per_answer * questionConfig.max_choices;
    const pointsPerSelected =
      selectedValues.length <= questionConfig.max_choices
        ? questionConfig.points_per_answer
        : maxPoints / selectedValues.length;

    for (const direction of selectedDirections) {
      scores[direction] += pointsPerSelected;
      selectedCounts[direction] += 1;
    }
  }

  for (const sliderConfig of config.sliders) {
    const question = questionBySliderId.get(sliderConfig.id);
    const answerValue = question
      ? getNumberAnswer(answerByQuestionId.get(question.id)?.answerPayload)
      : null;
    const value = answerValue === null ? 0 : clamp(answerValue, sliderConfig.min, sliderConfig.max);
    sliderValues[sliderConfig.id] = value;

    if (sliderConfig.category === 'interest' && sliderConfig.direction) {
      scores[sliderConfig.direction] += value * config.scoring.interest_slider_multiplier;
    }

    if (sliderConfig.category === 'readiness') {
      for (const [direction, weight] of Object.entries(sliderConfig.weights ?? {})) {
        scores[direction as ProfOrientationDirectionId] +=
          value * weight * config.scoring.readiness_slider_multiplier;
      }
    }
  }

  for (const direction of PROF_ORIENTATION_DIRECTIONS) {
    const interestValue = sliderValues[`S_${direction}`] ?? 0;

    if (selectedCounts[direction] >= 3 && interestValue >= 7) {
      scores[direction] += 2;
    } else if (selectedCounts[direction] >= 2 && interestValue >= 6) {
      scores[direction] += 1;
    }
  }

  const rankedDirections = [...PROF_ORIENTATION_DIRECTIONS].sort((left, right) => {
    const scoreDifference = scores[right] - scores[left];

    return scoreDifference === 0
      ? PROF_ORIENTATION_DIRECTIONS.indexOf(left) - PROF_ORIENTATION_DIRECTIONS.indexOf(right)
      : scoreDifference;
  });
  const topDirection = rankedDirections[0];
  const secondDirection = rankedDirections[1];
  const gap = scores[topDirection] - scores[secondDirection];
  const interestValues = PROF_ORIENTATION_DIRECTIONS.map(
    (direction) => sliderValues[`S_${direction}`] ?? 0,
  );
  const interestMedian = median(interestValues);
  const interestMax = Math.max(...interestValues);
  const interestMin = Math.min(...interestValues);
  const interestAverage =
    interestValues.reduce((sum, value) => sum + value, 0) / interestValues.length;
  const readinessTop = getReadinessForDirection(topDirection, sliderValues, config);
  const consistencyIndex = selectedCounts[topDirection] / config.questions.length;
  const flags: ProfOrientationFlag[] = [];

  if (overchoiceQuestions >= 4) {
    flags.push({
      code: 'overchoice',
      label: 'Выбрано слишком много вариантов в нескольких вопросах',
      severity: 'warning',
    });
  }

  for (const direction of PROF_ORIENTATION_DIRECTIONS) {
    if (selectedCounts[direction] >= 3 && (sliderValues[`S_${direction}`] ?? 0) <= 3) {
      flags.push({
        code: 'interest_slider_conflict',
        label: 'Выборы противоречат слайдеру интереса',
        severity: 'warning',
        directionId: direction,
      });
    }
  }

  if (readinessTop < 4) {
    flags.push({
      code: 'readiness_conflict',
      label: 'Готовность к ведущему направлению пока низкая',
      severity: 'warning',
      directionId: topDirection,
    });
  }

  const isLow = interestMedian < 3 && interestMax < 6;
  const isBroad =
    overchoiceQuestions >= 4 || (interestAverage >= 5 && interestMax - interestMin <= 2);
  const hasStrongContradiction = flags.some(
    (flag) => flag.directionId === topDirection && flag.severity === 'warning',
  );
  const confidenceLevel = getConfidence({
    gap,
    consistencyIndex,
    readinessTop,
    hasStrongContradiction,
    isLow,
    isBroad,
  });
  const profileType: ProfOrientationProfileType =
    confidenceLevel === 'low'
      ? 'low_definition'
      : confidenceLevel === 'broad'
        ? 'broad_interest'
        : confidenceLevel === 'mixed'
          ? 'mixed_profile'
          : 'single_profile';
  const topDirections = rankedDirections
    .slice(0, 3)
    .map((direction) => getDirectionSummary(direction, scores[direction], config));
  const roundedScores = Object.fromEntries(
    PROF_ORIENTATION_DIRECTIONS.map((direction) => [direction, roundScore(scores[direction])]),
  ) as Record<ProfOrientationDirectionId, number>;

  return {
    resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
    scoringVersion: config.version,
    scores: roundedScores,
    selectedCounts,
    sliderValues,
    topDirections,
    primaryDirection: topDirections[0] ?? null,
    secondaryDirection: topDirections[1] ?? null,
    profile: buildProfile(profileType, topDirections, config),
    confidence: {
      level: confidenceLevel,
      label: confidenceLabelByLevel[confidenceLevel],
      gap: roundScore(gap),
      consistencyIndex: roundScore(consistencyIndex),
      readinessTop: roundScore(readinessTop),
    },
    flags,
    llm: {
      status: llmStatus,
    },
  };
};

export const isProfOrientationV3PlusSummary = (value: unknown): value is ProfOrientationSummary =>
  isRecord(value) && value.resultKind === PROF_ORIENTATION_V3_PLUS_RESULT_KIND;
