import { buildProfOrientationV3PlusQuestionPayloads } from '../prof-orientation-v3-plus/fixture';
import { scoreProfOrientationV3Plus } from '../prof-orientation-v3-plus/scoring';

import type { ProfOrientationAtlasRecommendations } from '../prof-orientation-v3-plus/types';

const questions = buildProfOrientationV3PlusQuestionPayloads().map((question, index) => ({
  id: index + 1,
  type: question.type,
  settings: question.settings,
  options: question.options.map((option) => ({ value: option.value })),
}));

const answers = questions.map((question) => {
  const settings = question.settings as { methodologySliderId?: string } | null;

  return {
    questionId: question.id,
    answerPayload:
      question.type === 'MULTI_CHOICE'
        ? question.options.filter((option) => option.value.endsWith('_A1')).map((o) => o.value)
        : settings?.methodologySliderId === 'S_A1'
          ? 10
          : 3,
  };
});

/** A summary exactly as the algorithm phase stores it: scores, counters, sliders and flags included. */
export const buildStoredProfOrientationSummary = () =>
  scoreProfOrientationV3Plus({ questions, answers, llmStatus: 'pending' });

/** An atlas block as `saveEnrichedAnalysis` stores it, diagnostics included. */
export const storedAtlas: ProfOrientationAtlasRecommendations = {
  version: 2,
  status: 'partial',
  publicUrl: 'https://atlas.example',
  apiUrl: 'https://atlas.internal.example/api-backend',
  errorMessage: 'ECONNREFUSED atlas.internal.example:443',
  checkedAt: '2026-10-30T10:00:00.000Z',
  unmatchedProfessions: ['Профессия без совпадения'],
  duplicateProfessions: ['Повторяющаяся профессия'],
  professions: [
    {
      source: 'primary',
      requestedTitle: 'Инженер-конструктор',
      title: 'Инженер-конструктор',
      slug: 'inzhener-konstruktor',
      url: 'https://atlas.example/professions/inzhener-konstruktor',
      summary: 'Проектирует детали и сборки.',
      demandLevel: 'high',
      industry: 'Машиностроение',
      municipality: 'Казань',
      skills: ['CAD'],
    },
  ],
  enterprises: [
    {
      title: 'Завод',
      slug: 'zavod',
      url: 'https://atlas.example/enterprises/zavod',
      summary: null,
      subtitle: 'Казань',
    },
  ],
  events: [],
  institutions: [],
};

/** What the model returned for the LLM phase, with the fields no screen renders. */
export const storedEnrichment = {
  professorSummary:
    'Тебе ближе 3D-моделирование: идеи хочется превращать в понятные цифровые модели и проверять их.',
  summary: 'Профиль 3D-моделирования означает, что участнику ближе точная цифровая модель.',
  confidenceComment: 'Уверенность высокая: большой отрыв ведущего направления.',
  methodSignals: ['Выбран вариант Q1_A1.', 'Интерес S_A1 выше остальных.'],
  firstSteps: ['Смоделировать простой корпус.', 'Сделать сборку из деталей.'],
  learningPlan: ['основы черчения', 'CAD/САПР'],
  professionNotes: ['Инженер-конструктор: разрабатывает детали и сборки.'],
  nextMiniProject: 'Смоделируй корпус небольшого устройства.',
  cautions: ['Результат нужно проверить практикой.'],
};

/** A result of the standard AI analysis as the current schema stores it. */
export const storedAiAnalysis = {
  introduction: 'По результатам теста виден устойчивый интерес к практическим задачам.',
  skillsLevel: {
    title: 'Базовые навыки',
    summary: 'Навыки развиты на среднем уровне.',
    items: [
      { name: 'Коммуникация', level: 'medium', score: 68, description: 'Объясняет решения.' },
    ],
  },
  thinkingType: {
    title: 'Тип мышления',
    type: 'Аналитический',
    description: 'Сначала ищет структуру.',
    strengths: ['структурность'],
  },
  personalityTraits: {
    title: 'Личностные особенности',
    traits: [
      {
        name: 'Самостоятельность',
        description: 'Берет ответственность за задачи.',
        careerImpact: 'Подходит для самостоятельных ролей.',
      },
    ],
  },
  careerDevelopment: {
    summary: 'Стоит развивать портфолио.',
    recommendedDirections: ['аналитика'],
    developmentRecommendations: ['делать мини-проекты'],
    professionalNextSteps: ['получить обратную связь'],
  },
};
