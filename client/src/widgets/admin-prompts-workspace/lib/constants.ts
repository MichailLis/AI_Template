import type { PromptVariable, SimulationRun } from '../model/types';

export const INITIAL_PROMPT = `# SYSTEM PROMPT
Ты аналитик профориентационного тестирования. Проанализируй ответы студента на выбранные вопросы.

Верни строго JSON по схеме результата анализа:
- introduction: короткое введение к результату на 2-4 предложения;
- skillsLevel: текущий уровень базовых навыков;
- thinkingType: тип мышления;
- personalityTraits: личностные особенности;
- careerDevelopment: рекомендации для карьеры и профессионального развития.

# USER CONTEXT
Студент: {{student_name}}
Контекст теста: {{test_context}}

Ответы студента:
"""
{{student_answers}}
"""`;

export const INITIAL_VARIABLES: PromptVariable[] = [
  { id: 'var-student-name', key: 'student_name', value: 'Тестовый студент' },
  {
    id: 'var-test-context',
    key: 'test_context',
    value: 'Диагностика базовых навыков, мышления и карьерных ориентиров',
  },
  {
    id: 'var-student-answers',
    key: 'student_answers',
    value: 'Система подставит сюда выбранные вопросы и тестовые ответы при проверке промпта.',
  },
];

export const INITIAL_RUNS: SimulationRun[] = [
  {
    id: 'seed-success',
    createdAt: '14:23:05',
    status: 'success',
    model: 'deepseek/deepseek-chat-v3-0324:free',
    prompt: 'Пример симуляции анализа',
    output:
      '{"introduction":"По результатам теста видно, что студент уверенно связывает учебные задачи с практическими действиями. Такой профиль хорошо раскрывается там, где нужно анализировать информацию и доводить решение до результата.","skillsLevel":{"title":"Базовые навыки","summary":"Студент уверенно справляется с анализом информации.","items":[{"name":"Самоорганизация","level":"medium","score":72,"description":"Есть устойчивые привычки планирования."}]},"thinkingType":{"title":"Тип мышления","type":"Аналитико-практический","description":"Склонен связывать факты с действиями.","strengths":["Структурирует информацию"]},"personalityTraits":{"title":"Личностные особенности","traits":[{"name":"Ответственность","description":"Доводит задачи до завершения.","careerImpact":"Подходит для ролей с понятной зоной результата."}]},"careerDevelopment":{"summary":"Стоит развивать проектное мышление.","recommendedDirections":["Аналитика"],"developmentRecommendations":["Практиковать декомпозицию задач"],"professionalNextSteps":["Собрать учебное портфолио"]}}',
    latencyMs: 840,
    totalTokens: 452,
  },
  {
    id: 'seed-error',
    createdAt: '14:15:22',
    status: 'error',
    model: 'deepseek/deepseek-chat-v3-0324:free',
    prompt: 'Пример ошибки симуляции',
    errorMessage: 'Для проверки промпта выберите хотя бы один вопрос.',
  },
];

export const DEFAULT_PROMPT_TITLE = 'Карьерный анализ по тесту';
export const DEFAULT_PROMPT_DESCRIPTION = 'Промпт анализа студенческих ответов';
