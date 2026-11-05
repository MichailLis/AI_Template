/**
 * Что из алгоритмического результата уходит в промпт: без атласа и прежнего llm-блока, без баллов
 * и версии методики, без `primaryDirection`/`secondaryDirection` (это `topDirections[0]` и `[1]`).
 */
const ENRICHMENT_PROMPT_OMITTED_FIELDS = new Set([
  'atlas',
  'llm',
  'scores',
  'resultKind',
  'scoringVersion',
  'primaryDirection',
  'secondaryDirection',
]);

const toEnrichmentPromptSummary = (summary: object) =>
  Object.fromEntries(
    Object.entries(summary).filter(([key]) => !ENRICHMENT_PROMPT_OMITTED_FIELDS.has(key)),
  );

export function buildAttemptAnalysisPrompt(input: {
  prompt: string;
  questions: unknown[];
  answers: unknown[];
}) {
  return [
    input.prompt.trim(),
    '',
    'Данные завершенного тестирования студента:',
    JSON.stringify(
      {
        questions: input.questions,
        answers: input.answers,
      },
      null,
      2,
    ),
    '',
    'Сформируй анализ в JSON по заданной схеме.',
    'Обязательно заполни introduction: короткое введение к результату на 2-4 предложения без маркированного списка.',
    'Остальные блоки: текущий уровень базовых навыков, тип мышления, личностные особенности, рекомендации по карьерному и профессиональному развитию.',
  ].join('\n');
}

export function buildProfOrientationEnrichmentPrompt(input: {
  prompt: string;
  algorithmSummary: object;
  questions: unknown[];
  answers: unknown[];
}) {
  return [
    input.prompt.trim(),
    '',
    'Алгоритмический результат профориентационного теста:',
    JSON.stringify(toEnrichmentPromptSummary(input.algorithmSummary)),
    '',
    'Исходные вопросы и ответы участника:',
    JSON.stringify({ questions: input.questions, answers: input.answers }),
    '',
    'Сформируй только дополнительное текстовое пояснение в JSON по методической схеме профориентации v3+.',
    'Не меняй рассчитанные алгоритмом направление, уверенность, баллы, профиль и профессии.',
    'professorSummary — 2-3 предложения для блока "Профессор Полюс говорит": простым языком объясни карточку результата, ближайший смысл для школьника и одну понятную практическую пробу; это должна быть законченная фраза 240-420 символов, не заголовок и не знак препинания. Не копируй дословно resultCard.meaning или profile.meaning, переформулируй их как живое ИИ-пояснение.',
    'summary — человекочитаемое пояснение карточки результата для блока "Как читать результат": без нового вывода, без пересчета профиля и без внутренних деталей методики.',
    'Пиши для школьника и педагога простым языком: не используй технические ключи JSON и внутренние коды вроде single_profile, mixed_profile, broad_interest, low_definition, topDirections, A1, gap, consistencyIndex, readinessTop, selectedCounts или sliderValues.',
    'не раскрывай внутреннюю механику подсчета: не называй веса, формулы, балльные отрывы, значения слайдеров, номера вопросов и служебные признаки.',
    'Опирайся на profile.type, profile, topDirections (первое — главное направление, второе — дополнительное), их resultCard, confidence, flags, selectedCounts и sliderValues.',
    'Ветвление по profile.type обязательно: single_profile объясняй через resultCard первого направления из topDirections; mixed_profile — через profile.title, две topDirections и общий miniProject; broad_interest/low_definition — без жесткой рекомендации, как практические пробы нескольких направлений.',
    'methodSignals нужны как внутренние опорные наблюдения; пиши их без кодов, чисел шкал, формул и служебных терминов.',
    'firstSteps должны быть основаны на resultCard.tryActions, profile.miniProject или практических пробах из методики.',
    'learningPlan должен быть основан на resultCard.learn и близких topDirections.',
    'professionNotes комментируют только профессии из рассчитанных направлений; для broad_interest/low_definition можно вернуть пустой массив.',
    'cautions заполняй только при низкой/широкой уверенности или flags; если сильных предупреждений нет, верни пустой массив.',
    'Не создавай общий psychological/personality анализ и не используй старые блоки skillsLevel, thinkingType, personalityTraits, careerDevelopment.',
  ].join('\n');
}
