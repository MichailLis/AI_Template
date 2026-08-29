import {
  buildProfOrientationV3PlusQuestionPayloads,
  PROF_ORIENTATION_V3_PLUS_CONFIG,
} from './fixture';
import { resolveProfOrientationV3PlusConfig, scoreProfOrientationV3Plus } from './scoring';

const questions = buildProfOrientationV3PlusQuestionPayloads().map((question, index) => ({
  id: index + 1,
  type: question.type,
  settings: question.settings,
  options: question.options.map((option, optionIndex) => ({
    id: index * 10 + optionIndex + 1,
    value: option.value,
    label: option.label,
    order: option.order,
  })),
}));

const optionValueForDirection = (question: (typeof questions)[number], direction: string) => {
  const option = question.options.find((item) => item.value.endsWith(`_${direction}`));

  if (!option) {
    throw new Error(`Missing ${direction} option for question ${question.id}`);
  }

  return option.value;
};

const buildAnswers = (input: {
  selectedDirections: string[];
  interest: Record<string, number>;
  readiness?: Record<string, number>;
  overchoice?: boolean;
}) =>
  questions.map((question) => {
    if (question.type === 'MULTI_CHOICE') {
      return {
        questionId: question.id,
        answerPayload: input.overchoice
          ? question.options.map((option) => option.value)
          : input.selectedDirections.map((direction) =>
              optionValueForDirection(question, direction),
            ),
      };
    }

    const settings = question.settings as { methodologySliderId?: string };
    const sliderId = settings.methodologySliderId ?? '';
    const value = input.interest[sliderId] ?? input.readiness?.[sliderId] ?? 5;

    return {
      questionId: question.id,
      answerPayload: value,
    };
  });

describe('scoreProfOrientationV3Plus', () => {
  it('keeps the full built-in methodology shape for importer and scoring', () => {
    expect(PROF_ORIENTATION_V3_PLUS_CONFIG.version).toBe('3.0');
    expect(PROF_ORIENTATION_V3_PLUS_CONFIG.questions).toHaveLength(10);
    expect(PROF_ORIENTATION_V3_PLUS_CONFIG.sliders).toHaveLength(11);
    expect(buildProfOrientationV3PlusQuestionPayloads()).toHaveLength(21);
  });

  it('builds importer payloads with the updated document question wording', () => {
    const payloads = buildProfOrientationV3PlusQuestionPayloads();
    const firstQuestion = payloads[0];
    const controlQuestion = payloads[8];
    const firstSlider = payloads[10];
    const readinessSlider = payloads[20];

    expect(firstQuestion.title).toBe('Что тебе интереснее делать в техническом проекте?');
    expect(firstQuestion.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label:
            'Представлять новую деталь или устройство ещё до того, как оно появится в реальности, и создавать его цифровую модель.',
          value: 'Q1_A1',
        }),
        expect.objectContaining({
          label:
            'Управлять роботом или дроном и проверять, как он справляется с поставленной задачей.',
          value: 'Q1_B3',
        }),
      ]),
    );
    expect(controlQuestion.title).toBe('Какой формат работы тебе ближе?');
    expect(controlQuestion.options).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Продумывать каждую деталь будущего устройства ещё до его создания.',
          value: 'Q9_A1',
          weight: 2,
        }),
      ]),
    );
    expect(firstSlider.title).toBe(
      'Насколько тебе интересно представлять будущую деталь или устройство ещё до появления в реальности и создавать его цифровую модель?',
    );
    expect(firstSlider.settings).toEqual(
      expect.objectContaining({
        methodologySliderId: 'S_A1',
      }),
    );
    expect(readinessSlider.title).toBe(
      'Насколько ты готов действовать по правилам, чек-листам и требованиям безопасности во время запуска, испытаний или работы с оборудованием?',
    );
    expect(readinessSlider.settings).toEqual(
      expect.objectContaining({
        methodologySliderId: 'R_REGULATIONS',
      }),
    );
  });

  it('resolves persisted scoring config with fallback to the built-in methodology', () => {
    const customConfig = {
      ...PROF_ORIENTATION_V3_PLUS_CONFIG,
      version: '3.1-custom',
    };

    expect(resolveProfOrientationV3PlusConfig(customConfig).version).toBe('3.1-custom');
    expect(resolveProfOrientationV3PlusConfig({ version: 'broken' }).version).toBe('3.0');
  });

  it('returns a high-confidence single profile for a strong A1 result', () => {
    const result = scoreProfOrientationV3Plus({
      questions,
      answers: buildAnswers({
        selectedDirections: ['A1'],
        interest: {
          S_A1: 10,
          S_A2: 2,
          S_A3: 2,
          S_B1: 2,
          S_B2: 2,
          S_B3: 2,
        },
        readiness: {
          R_DIGITAL: 8,
          R_HANDS: 4,
          R_CODE_MATH: 6,
          R_PRECISION: 8,
          R_REGULATIONS: 4,
        },
      }),
    });

    expect(result.resultKind).toBe('prof_orientation_v3_plus');
    expect(result.primaryDirection?.id).toBe('A1');
    expect(result.profile.type).toBe('single_profile');
    expect(result.confidence.level).toBe('high');
  });

  it('caps overchoice scoring and marks wide selections as broad interest', () => {
    const result = scoreProfOrientationV3Plus({
      questions,
      answers: buildAnswers({
        selectedDirections: ['A1'],
        overchoice: true,
        interest: {
          S_A1: 8,
          S_A2: 8,
          S_A3: 8,
          S_B1: 8,
          S_B2: 8,
          S_B3: 8,
        },
      }),
    });

    expect(result.profile.type).toBe('broad_interest');
    expect(result.flags.some((flag) => flag.code === 'overchoice')).toBe(true);
  });

  it('marks flat low interest as low definition even when choices point to a direction', () => {
    const result = scoreProfOrientationV3Plus({
      questions,
      answers: buildAnswers({
        selectedDirections: ['B2'],
        interest: {
          S_A1: 1,
          S_A2: 1,
          S_A3: 2,
          S_B1: 1,
          S_B2: 2,
          S_B3: 1,
        },
      }),
    });

    expect(result.profile.type).toBe('low_definition');
    expect(result.confidence.level).toBe('low');
  });

  it('flags contradiction when repeated choices conflict with an interest slider', () => {
    const result = scoreProfOrientationV3Plus({
      questions,
      answers: buildAnswers({
        selectedDirections: ['A1'],
        interest: {
          S_A1: 2,
          S_A2: 7,
          S_A3: 7,
          S_B1: 7,
          S_B2: 7,
          S_B3: 7,
        },
      }),
    });

    expect(result.flags.some((flag) => flag.code === 'interest_slider_conflict')).toBe(true);
    expect(result.confidence.level).not.toBe('high');
  });
});
