import { usePromptEditActions } from './use-admin-prompts-actions-editor';
import { usePromptSaveAction } from './use-admin-prompts-actions-save';
import { useAdminPromptsVariableActions } from './use-admin-prompts-actions-variable';

import type { UseAdminPromptsActionsParams } from './use-admin-prompts-actions.types';

export function useAdminPromptsActions({
  prompts,
  structuredOutputModels,
  defaultModel,
  selectedPromptId,
  selectedPrompt,
  promptTitle,
  selectedModel,
  selectedModelItem,
  temperature,
  promptTemplate,
  variables,
  promptsQuery,
  createPromptMutation,
  updatePromptMutation,
  deletePromptMutation,
  publishVersionMutation,
  setSelectedPromptId,
  setPromptTitle,
  setModel,
  setTemperature,
  setPromptTemplate,
  setPromptEditorScrollTop,
  setModelSearch,
  setModelFilter,
  setVariables,
}: UseAdminPromptsActionsParams) {
  const variableActions = useAdminPromptsVariableActions({
    variables,
    setVariables,
  });
  const editActions = usePromptEditActions({
    prompts,
    structuredOutputModels,
    selectedPromptId,
    defaultModel,
    setSelectedPromptId,
    setPromptTitle,
    setModel,
    setTemperature,
    setPromptTemplate,
    setPromptEditorScrollTop,
    setModelSearch,
    setModelFilter,
    deletePromptMutation,
    promptsQuery,
  });
  const saveAction = usePromptSaveAction({
    selectedPromptId,
    selectedPrompt,
    promptTitle,
    selectedModel,
    selectedModelItem,
    temperature,
    promptTemplate,
    setSelectedPromptId,
    createPromptMutation,
    updatePromptMutation,
    promptsQuery,
    publishVersionMutation,
  });

  return {
    ...variableActions,
    ...editActions,
    ...saveAction,
  };
}
