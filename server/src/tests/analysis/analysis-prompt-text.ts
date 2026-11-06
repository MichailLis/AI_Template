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
