// Mock of the student API for the result scenarios of `verify:e2e:critical`.
// The shapes follow the generated DTOs in `client/src/shared/api/model` (PublicSession*ResponseDto,
// PublicAiAnalysisSummary, PublicProfOrientationSummary). The texts are unique on purpose: a
// scenario proves the screen by reading them, so they must not occur anywhere else in the app.

export const sessionToken = 'session-smoke';

export const publicQuestions = [
  {
    id: 1,
    type: 'OPEN_TEXT',
    title: 'Что вам нравится в инженерных задачах?',
    description: null,
    required: true,
    order: 1,
    settings: null,
    options: [],
    sliderBands: [],
  },
  {
    id: 2,
    type: 'OPEN_TEXT',
    title: 'Какой прибор вы бы собрали сами?',
    description: null,
    required: true,
    order: 2,
    settings: null,
    options: [],
    sliderBands: [],
  },
];

export const studentAnswers = ['Люблю разбираться, как устроены механизмы', 'Датчик температуры'];

export const aiText = {
  introduction: 'E2E-введение: ответы показывают интерес к аккуратной инженерной работе.',
  skillsTitle: 'Уровень ключевых навыков',
  skillName: 'Инженерное мышление',
  thinkingType: 'Системный конструктор',
  nextStep: 'Собрать прототип датчика температуры',
};

export const profText = {
  headline: 'Профиль: проектирование и цифровая модель',
  professorSummary: 'E2E-пояснение профессора: вам ближе работа с цифровыми моделями изделий.',
  profession: 'Инженер-конструктор',
};

const hourAgo = () => new Date(Date.now() - 3_600_000).toISOString();

const aiSummary = () => ({
  resultKind: 'ai_analysis',
  introduction: aiText.introduction,
  skillsLevel: {
    title: aiText.skillsTitle,
    summary: 'Сводка по навыкам.',
    items: [
      { name: aiText.skillName, level: 'high', score: 82, description: 'Уверенно решает задачи.' },
    ],
  },
  thinkingType: {
    title: 'Тип мышления',
    type: aiText.thinkingType,
    description: 'Раскладывает задачу на части.',
    strengths: ['Внимание к деталям'],
  },
  personalityTraits: {
    title: 'Черты характера',
    traits: [{ name: 'Усидчивость', description: 'Доводит работу.', careerImpact: 'Ценится.' }],
  },
  careerDevelopment: {
    summary: 'Карьерный план.',
    recommendedDirections: ['Конструирование'],
    developmentRecommendations: ['Изучить CAD'],
    professionalNextSteps: [aiText.nextStep],
  },
});

const profSummary = (llmStatus) => {
  const direction = (id, name, score) => ({
    id,
    name,
    score,
    resultCard: {
      headline: profText.headline,
      meaning: 'Вам ближе этап, где идея становится цифровой моделью.',
      fitsIf: ['интересно работать с чертежами'],
      tryActions: ['смоделировать корпус датчика'],
      learn: ['основы черчения'],
      miniProject: 'Смоделируйте корпус небольшого устройства.',
    },
    professions: [{ code: '201524', title: profText.profession }],
  });
  const primary = direction('A1', '3D-моделирование', 54.2);

  return {
    resultKind: 'prof_orientation_v3_plus',
    primaryDirection: primary,
    topDirections: [primary, direction('A2', '3D-печать', 46.4)],
    confidence: { label: 'высокая' },
    profile: {
      type: 'single_profile',
      title: '3D-моделирование',
      meaning: 'Профиль по методике.',
      miniProject: null,
    },
    llm: {
      status: llmStatus,
      analysis:
        llmStatus === 'ready'
          ? {
              professorSummary: profText.professorSummary,
              summary: 'Кратко о результате.',
              firstSteps: ['Освоить базовый CAD'],
              learningPlan: ['Курс по черчению'],
              professionNotes: [],
              nextMiniProject: 'Смоделируйте корпус датчика.',
            }
          : null,
    },
    atlas: null,
  };
};

const resultBody = ({ template, summary, status = 'READY', providerMode = 'ALGORITHM_LLM' }) => ({
  sessionToken,
  publicTemplate: template,
  publicBranding: null,
  status: 'COMPLETED',
  finishedAt: hourAgo(),
  analysis: { providerMode, status, summary, errorMessage: null, generatedAt: hourAgo() },
  professionAtlasUrl: null,
});

/** Ready-made `/result` bodies. `finishedAt` is an hour back, so POLUS does not hold its 10 s screen. */
export const resultBodies = {
  aiAnalysis: (template) => resultBody({ template, summary: aiSummary(), providerMode: 'LLM' }),
  profOrientation: (template, llmStatus = 'ready') =>
    resultBody({ template, summary: profSummary(llmStatus) }),
  none: (template) =>
    resultBody({ template, summary: { resultKind: 'none' }, providerMode: 'STUB' }),
  failed: (template) =>
    resultBody({
      template,
      summary: { resultKind: 'none' },
      status: 'FAILED',
      providerMode: 'LLM',
    }),
};

const buildSession = (template, answers) => ({
  sessionToken,
  shortCode: 'SMOKE',
  publicTemplate: template,
  publicBranding: null,
  attemptNumber: 1,
  status: 'IN_PROGRESS',
  startedAt: hourAgo(),
  expiresAt: null,
  finishedAt: null,
  timeLimitMinutes: null,
  questions: publicQuestions,
  answers,
  serverTime: new Date().toISOString(),
});

/**
 * Handler for the student endpoints of one scenario.
 * `results` lists the `/result` replies in order (the last one repeats): a body, or
 * `{ httpStatus: 503 }` for a failed poll. `calls` is the log of what the page did.
 */
export const createPublicMock = ({ template, results }) => {
  let savedAnswers = [];
  let resultCalls = 0;
  const calls = [];
  const savedPayloads = [];

  const handle = async ({ method, apiPath, request, respond }) => {
    const sessionPath = `/tests/public/sessions/${sessionToken}`;

    if (method === 'POST' && apiPath === '/tests/public/links/SMOKE/start') {
      await respond({ session: buildSession(template, savedAnswers) }, 201);
    } else if (method === 'GET' && apiPath === sessionPath) {
      await respond({ session: buildSession(template, savedAnswers) });
    } else if (method === 'PUT' && apiPath === `${sessionPath}/answers`) {
      const { answers } = request.postDataJSON();
      savedPayloads.push(answers);
      savedAnswers = answers.map((answer) => ({ ...answer, updatedAt: hourAgo() }));
      calls.push('PUT answers');
      await respond({ sessionToken, status: 'IN_PROGRESS', answers: savedAnswers });
    } else if (method === 'POST' && apiPath === `${sessionPath}/finish`) {
      calls.push('POST finish');
      // The page only reads `sessionToken` from this reply; the result comes from `/result`.
      const { finishedAt, analysis } = resultBodies.none(template);
      await respond({ sessionToken, status: 'COMPLETED', finishedAt, analysis }, 201);
    } else if (method === 'GET' && apiPath === `${sessionPath}/result`) {
      const reply = results[Math.min(resultCalls, results.length - 1)];
      resultCalls += 1;
      calls.push('GET result');
      await (reply.httpStatus
        ? respond({ success: false, error: { message: 'Mock 5xx' } }, reply.httpStatus)
        : respond(reply));
    } else {
      return false;
    }

    return true;
  };

  return {
    handle,
    calls,
    savedPayloads,
    getResultCalls: () => resultCalls,
  };
};
