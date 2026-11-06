import type { UseAdminPromptsActionsParams } from './actions.types';
import type { useManageAnalysisPrompt } from '@/features/manage-analysis-prompt';

export function usePromptSaveAction({
  selectedPromptId,
  selectedPrompt,
  promptTitle,
  selectedModel,
  selectedModelItem,
  temperature,
  promptTemplate,
  setSelectedPromptId,
  savePrompt,
}: Pick<
  UseAdminPromptsActionsParams,
  | 'selectedPromptId'
  | 'selectedPrompt'
  | 'promptTitle'
  | 'selectedModel'
  | 'selectedModelItem'
  | 'temperature'
  | 'promptTemplate'
  | 'setSelectedPromptId'
> &
  Pick<ReturnType<typeof useManageAnalysisPrompt>, 'savePrompt'>) {
  const handleSavePromptVersion = () => {
    savePrompt({
      selectedPromptId,
      selectedPrompt,
      promptTitle,
      selectedModel,
      selectedModelItem,
      temperature,
      promptTemplate,
      onSaved: setSelectedPromptId,
    });
  };

  return { handleSavePromptVersion };
}
