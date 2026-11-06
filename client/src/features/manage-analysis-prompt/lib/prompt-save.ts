import type { AnalysisPromptListResponseDtoPromptsItem } from '@/shared/api/model';

export const DEFAULT_PROMPT_DESCRIPTION = 'Промпт анализа студенческих ответов';

export const preparePromptPayload = (params: {
  selectedPrompt: Pick<AnalysisPromptListResponseDtoPromptsItem, 'description'> | null;
  title: string;
  selectedModel: string;
  parsedTemperature: number;
  preparedPrompt: string;
}) => ({
  title: params.title,
  description: params.selectedPrompt?.description ?? DEFAULT_PROMPT_DESCRIPTION,
  model: params.selectedModel,
  temperature: params.parsedTemperature,
  prompt: params.preparedPrompt,
});

export const getPromptSaveError = (
  promptTitle: string,
  selectedModel: string,
  selectedModelItem: { supportsStructuredOutputs?: boolean } | null,
  preparedPrompt: string,
  temperature: number,
) => {
  if (!promptTitle) {
    return 'Укажите название промпта';
  }

  if (!selectedModel) {
    return 'Выберите модель';
  }

  if (selectedModelItem?.supportsStructuredOutputs !== true) {
    return 'Выберите модель со structured outputs';
  }

  if (!preparedPrompt) {
    return 'Шаблон промпта пуст';
  }

  if (Number.isNaN(temperature) || temperature < 0 || temperature > 2) {
    return 'Температура должна быть от 0 до 2';
  }

  return null;
};
