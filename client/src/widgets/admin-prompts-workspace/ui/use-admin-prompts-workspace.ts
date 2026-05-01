import { useMemo } from 'react';

import {
  useAdminControllerGetPromptModels,
  useAnalysisPromptsControllerCreatePrompt,
  useAnalysisPromptsControllerDeletePrompt,
  useAnalysisPromptsControllerListPrompts,
  useAnalysisPromptsControllerListTestQuestions,
  useAnalysisPromptsControllerPublishVersion,
  useAnalysisPromptsControllerSimulatePrompt,
  useAnalysisPromptsControllerUpdatePrompt,
} from '@/shared/api/generated/admin/admin';

import { getDuplicateVariableData, interpolatePrompt } from '../lib/utils';

import { resolveSelectedPromptModel } from './admin-prompts-workspace.helpers';
import { useAdminPromptsActions } from './use-admin-prompts-actions';
import { useAdminPromptsEditorState } from './use-admin-prompts-editor-state';
import { useAdminPromptsSimulation } from './use-admin-prompts-simulation';

export function useAdminPromptsWorkspace() {
  const modelsQuery = useAdminControllerGetPromptModels();
  const promptsQuery = useAnalysisPromptsControllerListPrompts();
  const testQuestionsQuery = useAnalysisPromptsControllerListTestQuestions();
  const createPromptMutation = useAnalysisPromptsControllerCreatePrompt();
  const updatePromptMutation = useAnalysisPromptsControllerUpdatePrompt();
  const deletePromptMutation = useAnalysisPromptsControllerDeletePrompt();
  const publishVersionMutation = useAnalysisPromptsControllerPublishVersion();
  const simulateMutation = useAnalysisPromptsControllerSimulatePrompt();

  const editorState = useAdminPromptsEditorState();
  const {
    selectedPromptId,
    promptTitle,
    model,
    temperature,
    responseFormat,
    modelSearch,
    modelFilter,
    systemRole,
    maxTokens,
    promptTemplate,
    promptEditorScrollTop,
    variables,
    showMetrics,
    diffView,
    selectedTestId,
  } = editorState;

  const allModels = useMemo(() => modelsQuery.data?.models ?? [], [modelsQuery.data?.models]);
  const structuredOutputModels = useMemo(
    () => allModels.filter((item) => item.supportsStructuredOutputs),
    [allModels],
  );
  const prompts = useMemo(() => promptsQuery.data?.prompts ?? [], [promptsQuery.data?.prompts]);
  const testQuestionGroups = useMemo(
    () => testQuestionsQuery.data?.tests ?? [],
    [testQuestionsQuery.data?.tests],
  );

  const filteredModels = useMemo(() => {
    const normalizedSearch = modelSearch.trim().toLowerCase();
    const hasFreeModels = structuredOutputModels.some((item) => item.isFree);
    const effectiveModelFilter = modelFilter === 'free' && !hasFreeModels ? 'all' : modelFilter;

    return structuredOutputModels.filter((item) => {
      const byType =
        effectiveModelFilter === 'all' ||
        (effectiveModelFilter === 'free' && item.isFree) ||
        (effectiveModelFilter === 'paid' && !item.isFree);

      if (!byType) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return (
        item.id.toLowerCase().includes(normalizedSearch) ||
        item.label.toLowerCase().includes(normalizedSearch) ||
        item.provider.toLowerCase().includes(normalizedSearch)
      );
    });
  }, [modelFilter, modelSearch, structuredOutputModels]);

  const selectedModel = useMemo(
    () =>
      resolveSelectedPromptModel(
        model,
        filteredModels,
        structuredOutputModels,
        modelsQuery.data?.defaultModel,
      ),
    [filteredModels, model, modelsQuery.data?.defaultModel, structuredOutputModels],
  );

  const selectedModelItem =
    structuredOutputModels.find((item) => item.id === selectedModel) ?? null;

  const selectedPrompt = useMemo(
    () => prompts.find((prompt) => prompt.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId],
  );

  const selectedPromptVersionNumber = selectedPrompt?.versions[0]?.versionNumber ?? null;

  const renderedPrompt = useMemo(
    () => interpolatePrompt(promptTemplate, variables),
    [promptTemplate, variables],
  );

  const promptLineCount = useMemo(
    () => Math.max(1, promptTemplate.split('\n').length),
    [promptTemplate],
  );

  const duplicateVariableData = useMemo(() => getDuplicateVariableData(variables), [variables]);

  const detectedVariablesCount = useMemo(() => {
    const matches = promptTemplate.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) ?? [];
    return new Set(matches).size;
  }, [promptTemplate]);

  const selectedTest = useMemo(
    () =>
      testQuestionGroups.find((testGroup) => testGroup.id === selectedTestId) ??
      testQuestionGroups[0] ??
      null,
    [selectedTestId, testQuestionGroups],
  );

  const selectedQuestionIds = useMemo(
    () => selectedTest?.questions.map((question) => question.id) ?? [],
    [selectedTest],
  );

  const actions = useAdminPromptsActions({
    prompts,
    structuredOutputModels,
    defaultModel: modelsQuery.data?.defaultModel,
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
    setSelectedPromptId: editorState.setSelectedPromptId,
    setPromptTitle: editorState.setPromptTitle,
    setModel: editorState.setModel,
    setTemperature: editorState.setTemperature,
    setPromptTemplate: editorState.setPromptTemplate,
    setPromptEditorScrollTop: editorState.setPromptEditorScrollTop,
    setModelSearch: editorState.setModelSearch,
    setModelFilter: editorState.setModelFilter,
    setVariables: editorState.setVariables,
  });

  const simulation = useAdminPromptsSimulation({
    selectedModel,
    selectedModelItem,
    duplicateVariableData,
    temperature,
    renderedPrompt,
    selectedTest,
    selectedQuestionIds,
    responseFormat,
    simulateMutation,
  });

  return {
    modelsQuery,
    promptsQuery,
    testQuestionsQuery,
    createPromptMutation,
    updatePromptMutation,
    deletePromptMutation,
    publishVersionMutation,
    simulateMutation,
    selectedPromptId,
    selectedPrompt,
    selectedPromptVersionNumber,
    promptTitle,
    model,
    temperature,
    responseFormat,
    modelSearch,
    modelFilter,
    systemRole,
    maxTokens,
    promptTemplate,
    promptEditorScrollTop,
    variables,
    showMetrics,
    diffView,
    runs: simulation.runs,
    prompts,
    testQuestionGroups,
    selectedTest,
    selectedTestId: selectedTest?.id ?? null,
    selectedQuestionIds,
    allModels: structuredOutputModels,
    filteredModels,
    selectedModel,
    selectedModelItem,
    promptLineCount,
    duplicateVariableData,
    detectedVariablesCount,
    setModel: editorState.setModel,
    setPromptTitle: editorState.setPromptTitle,
    setTemperature: editorState.setTemperature,
    setResponseFormat: editorState.setResponseFormat,
    setModelSearch: editorState.setModelSearch,
    setModelFilter: editorState.setModelFilter,
    setSystemRole: editorState.setSystemRole,
    setMaxTokens: editorState.setMaxTokens,
    setPromptTemplate: editorState.setPromptTemplate,
    setPromptEditorScrollTop: editorState.setPromptEditorScrollTop,
    setShowMetrics: editorState.setShowMetrics,
    setDiffView: editorState.setDiffView,
    setRuns: simulation.setRuns,
    setSelectedTestId: editorState.setSelectedTestId,
    updateVariable: actions.updateVariable,
    addVariable: actions.addVariable,
    removeVariable: actions.removeVariable,
    copyRunJson: simulation.copyRunJson,
    handleCreateNewPrompt: actions.handleCreateNewPrompt,
    handleSelectPrompt: actions.handleSelectPrompt,
    handleDeletePrompt: actions.handleDeletePrompt,
    handleGenerate: simulation.handleGenerate,
    handleSavePromptVersion: actions.handleSavePromptVersion,
  };
}
