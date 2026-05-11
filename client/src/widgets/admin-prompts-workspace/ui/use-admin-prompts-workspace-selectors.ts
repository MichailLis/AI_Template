import { useMemo } from 'react';

import { getDuplicateVariableData, interpolatePrompt } from '../lib/utils';

import { resolveSelectedPromptModel } from './admin-prompts-workspace.helpers';

import type { ModelFilter, PromptVariable } from '../model/types';
import type {
  AdminPromptModelsResponseDto,
  AdminPromptModelsResponseDtoModelsItem,
  AnalysisPromptListResponseDto,
  AnalysisPromptListResponseDtoPromptsItem,
  PromptTestQuestionsResponseDto,
  PromptTestQuestionsResponseDtoTestsItem,
} from '@/shared/api/model';

interface ModelsQueryResult {
  data?: AdminPromptModelsResponseDto;
}

interface PromptsQueryResult {
  data?: AnalysisPromptListResponseDto;
}

interface TestQuestionsQueryResult {
  data?: PromptTestQuestionsResponseDto;
}

const selectAllModels = (
  modelsQuery: ModelsQueryResult,
): AdminPromptModelsResponseDtoModelsItem[] => modelsQuery.data?.models ?? [];

export const selectStructuredOutputModels = (
  allModels: AdminPromptModelsResponseDtoModelsItem[],
): AdminPromptModelsResponseDtoModelsItem[] =>
  allModels.filter((item) => item.supportsStructuredOutputs);

const selectFilteredModels = (
  modelSearch: string,
  modelFilter: ModelFilter,
  structuredOutputModels: AdminPromptModelsResponseDtoModelsItem[],
): AdminPromptModelsResponseDtoModelsItem[] => {
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
};

const selectPrompts = (
  promptsQuery: PromptsQueryResult,
): AnalysisPromptListResponseDtoPromptsItem[] => promptsQuery.data?.prompts ?? [];
const selectTestQuestionGroups = (
  testQuestionsQuery: TestQuestionsQueryResult,
): PromptTestQuestionsResponseDtoTestsItem[] => testQuestionsQuery.data?.tests ?? [];

const selectSelectedPrompt = (
  prompts: AnalysisPromptListResponseDtoPromptsItem[],
  selectedPromptId: number | null,
) => prompts.find((prompt) => prompt.id === selectedPromptId) ?? null;

const selectRenderedPrompt = (promptTemplate: string, variables: PromptVariable[]) =>
  interpolatePrompt(promptTemplate, variables);

const selectPromptLineCount = (promptTemplate: string) =>
  Math.max(1, promptTemplate.split('\n').length);

const selectDetectedVariables = (promptTemplate: string) => {
  const matches = promptTemplate.match(/{{\s*([a-zA-Z0-9_]+)\s*}}/g) ?? [];
  return new Set(matches).size;
};

const selectSelectedTest = (
  testQuestionGroups: PromptTestQuestionsResponseDtoTestsItem[],
  selectedTestId: number | null,
) =>
  testQuestionGroups.find((testGroup) => testGroup.id === selectedTestId) ??
  testQuestionGroups[0] ??
  null;

const selectSelectedQuestionIds = (selectedTest: PromptTestQuestionsResponseDtoTestsItem | null) =>
  selectedTest?.questions.map((question) => question.id) ?? [];

export function usePromptCatalog({
  model,
  modelSearch,
  modelFilter,
  modelsQuery,
}: {
  model: string;
  modelSearch: string;
  modelFilter: ModelFilter;
  modelsQuery: ModelsQueryResult;
}) {
  const allModels = useMemo(() => selectAllModels(modelsQuery), [modelsQuery]);
  const structuredOutputModels = useMemo(
    () => selectStructuredOutputModels(allModels),
    [allModels],
  );
  const filteredModels = useMemo(
    () => selectFilteredModels(modelSearch, modelFilter, structuredOutputModels),
    [modelSearch, modelFilter, structuredOutputModels],
  );
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

  return {
    allModels: allModels,
    structuredOutputModels,
    filteredModels,
    selectedModel,
    selectedModelItem: structuredOutputModels.find((item) => item.id === selectedModel) ?? null,
  };
}

export function usePromptWorkspaceDerivedState({
  promptsQuery,
  testQuestionsQuery,
  selectedPromptId,
  selectedTestId,
  promptTemplate,
  variables,
}: {
  promptsQuery: PromptsQueryResult;
  testQuestionsQuery: TestQuestionsQueryResult;
  selectedPromptId: number | null;
  selectedTestId: number | null;
  promptTemplate: string;
  variables: PromptVariable[];
}) {
  const prompts = useMemo(() => selectPrompts(promptsQuery), [promptsQuery]);
  const testQuestionGroups = useMemo(
    () => selectTestQuestionGroups(testQuestionsQuery),
    [testQuestionsQuery],
  );
  const selectedPrompt = useMemo(
    () => selectSelectedPrompt(prompts, selectedPromptId),
    [prompts, selectedPromptId],
  );

  const selectedTest = selectSelectedTest(testQuestionGroups, selectedTestId);

  return {
    prompts,
    testQuestionGroups,
    selectedPrompt,
    selectedPromptVersionNumber: selectedPrompt?.versions[0]?.versionNumber ?? null,
    renderedPrompt: selectRenderedPrompt(promptTemplate, variables),
    promptLineCount: selectPromptLineCount(promptTemplate),
    duplicateVariableData: getDuplicateVariableData(variables),
    detectedVariablesCount: selectDetectedVariables(promptTemplate),
    selectedTest,
    selectedQuestionIds: selectSelectedQuestionIds(selectedTest),
  };
}
