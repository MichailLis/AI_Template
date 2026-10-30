import type { CreateTestsTopicFromAiDtoQuestionsItemType } from '@/shared/api/model';

export const AI_QUESTION_TYPE_LABELS: Record<CreateTestsTopicFromAiDtoQuestionsItemType, string> = {
  OPEN_TEXT: 'Открытый текст',
  SINGLE_CHOICE: 'Один вариант',
  MULTI_CHOICE: 'Несколько вариантов',
  SLIDER: 'Слайдер',
};

export const AI_QUESTION_TYPES = Object.keys(
  AI_QUESTION_TYPE_LABELS,
) as Array<CreateTestsTopicFromAiDtoQuestionsItemType>;

interface BuildAiPromptParams {
  topicTitle: string;
  topicDescription: string;
  generationTask: string;
  questionCount: number;
  allowedTypes: Array<CreateTestsTopicFromAiDtoQuestionsItemType>;
}

export const buildAiQuestionGenerationPrompt = ({
  topicTitle,
  topicDescription,
  generationTask,
  questionCount,
  allowedTypes,
}: BuildAiPromptParams) => {
  const typeLabels = allowedTypes.map((type) => `${type} (${AI_QUESTION_TYPE_LABELS[type]})`);

  return [
    'Ты проектируешь структуру теста для админки образовательного продукта.',
    'Ответ должен быть СТРОГО JSON-объектом без markdown и без дополнительного текста.',
    'Верни JSON формата:',
    '{',
    '  "questions": [',
    '    {',
    '      "type": "OPEN_TEXT | SINGLE_CHOICE | MULTI_CHOICE | SLIDER",',
    '      "title": "string",',
    '      "description": "string|null",',
    '      "required": true,',
    '      "options": [{ "label": "string", "value": "string", "weight": 0 }],',
    '      "settings": { "min": 0, "max": 10, "step": 1 },',
    '      "sliderBands": [{ "minValue": 0, "maxValue": 3, "label": "string", "weight": 0 }]',
    '    }',
    '  ]',
    '}',
    '',
    'Ограничения:',
    `1) Ровно ${questionCount} вопросов.`,
    `2) Допустимые типы: ${typeLabels.join(', ')}.`,
    '3) Для OPEN_TEXT не добавляй options и sliderBands.',
    '4) Для SINGLE_CHOICE и MULTI_CHOICE минимум 2 options.',
    '5) Для SLIDER обязательно заполни settings (min/max/step) и минимум 1 sliderBands.',
    '6) Для options.weight и sliderBands.weight используй целые числа от -1000 до 1000.',
    '7) Формулировки вопросов и вариантов ответа — на русском языке.',
    '',
    `Тема теста: ${topicTitle}`,
    `Описание теста: ${topicDescription || 'не задано'}`,
    `Задача/контекст: ${generationTask}`,
  ].join('\n');
};
