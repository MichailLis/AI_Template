import { useMemo, useState } from 'react';
import { toast } from 'sonner';

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

import { INITIAL_PROMPT, INITIAL_RUNS, INITIAL_VARIABLES } from '../lib/constants';
import {
  createVariableId,
  estimateTokens,
  formatNow,
  generateRunId,
  getApiErrorMessage,
  getDuplicateVariableData,
  interpolatePrompt,
} from '../lib/utils';

import {
  applySimulationError,
  applySimulationSuccess,
  buildRunningSimulationRun,
  resolveSelectedPromptModel,
  validateSimulationInput,
} from './admin-prompts-workspace.helpers';

import type { ModelFilter, PromptVariable, ResponseFormat, SimulationRun } from '../model/types';

const DEFAULT_PROMPT_TITLE = 'Карьерный анализ по тесту';
const DEFAULT_PROMPT_DESCRIPTION = 'Промпт анализа студенческих ответов';

export function useAdminPromptsWorkspace() {
  const modelsQuery = useAdminControllerGetPromptModels();
  const promptsQuery = useAnalysisPromptsControllerListPrompts();
  const testQuestionsQuery = useAnalysisPromptsControllerListTestQuestions();
  const createPromptMutation = useAnalysisPromptsControllerCreatePrompt();
  const updatePromptMutation = useAnalysisPromptsControllerUpdatePrompt();
  const deletePromptMutation = useAnalysisPromptsControllerDeletePrompt();
  const publishVersionMutation = useAnalysisPromptsControllerPublishVersion();
  const simulateMutation = useAnalysisPromptsControllerSimulatePrompt();

  const [selectedPromptId, setSelectedPromptId] = useState<number | null>(null);
  const [promptTitle, setPromptTitle] = useState(DEFAULT_PROMPT_TITLE);
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('json');
  const [modelSearch, setModelSearch] = useState('');
  const [modelFilter, setModelFilter] = useState<ModelFilter>('free');
  const [systemRole, setSystemRole] = useState('Career Counselor Expert');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [promptTemplate, setPromptTemplate] = useState(INITIAL_PROMPT);
  const [promptEditorScrollTop, setPromptEditorScrollTop] = useState(0);
  const [variables, setVariables] = useState<PromptVariable[]>(INITIAL_VARIABLES);
  const [showMetrics, setShowMetrics] = useState(true);
  const [diffView, setDiffView] = useState(false);
  const [runs, setRuns] = useState<SimulationRun[]>(INITIAL_RUNS);
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

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

  const updateVariable = (variableId: string, field: 'key' | 'value', value: string) => {
    setVariables((prev) =>
      prev.map((item) => {
        if (item.id !== variableId) {
          return item;
        }

        return field === 'key' ? { ...item, key: value } : { ...item, value };
      }),
    );
  };

  const addVariable = () => {
    const nextIndex = variables.length + 1;

    setVariables((prev) => [
      ...prev,
      {
        id: createVariableId(),
        key: `variable_${nextIndex}`,
        value: '',
      },
    ]);
  };

  const removeVariable = (variableId: string) => {
    setVariables((prev) => prev.filter((item) => item.id !== variableId));
  };

  const copyRunJson = async (run: SimulationRun) => {
    const payload = {
      createdAt: run.createdAt,
      status: run.status,
      model: run.model,
      prompt: run.prompt,
      output: run.output,
      errorMessage: run.errorMessage,
      latencyMs: run.latencyMs,
      totalTokens: run.totalTokens,
      responseFormat,
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success('Run JSON copied');
    } catch {
      toast.error('Unable to copy run JSON');
    }
  };

  const getDefaultModel = () =>
    modelsQuery.data?.defaultModel ??
    structuredOutputModels.find((item) => item.isFree)?.id ??
    structuredOutputModels[0]?.id ??
    '';

  const resetPromptEditor = () => {
    setSelectedPromptId(null);
    setPromptTitle(DEFAULT_PROMPT_TITLE);
    setModel(getDefaultModel());
    setTemperature('0.7');
    setPromptTemplate(INITIAL_PROMPT);
    setPromptEditorScrollTop(0);
    setModelSearch('');
    setModelFilter('free');
  };

  const handleCreateNewPrompt = () => {
    resetPromptEditor();
    toast.success('Открыт новый промпт');
  };

  const handleSelectPrompt = (promptId: number) => {
    const prompt = prompts.find((item) => item.id === promptId);
    const latestVersion = prompt?.versions[0];

    if (!prompt || !latestVersion) {
      toast.error('Промпт не найден');
      return;
    }

    const selectedCatalogModel = structuredOutputModels.find(
      (item) => item.id === latestVersion.model,
    );
    let nextModelFilter: ModelFilter = 'all';

    if (selectedCatalogModel) {
      nextModelFilter = selectedCatalogModel.isFree ? 'free' : 'paid';
    }

    setSelectedPromptId(prompt.id);
    setPromptTitle(prompt.title);
    setModel(latestVersion.model);
    setTemperature(String(latestVersion.temperature));
    setPromptTemplate(latestVersion.prompt);
    setPromptEditorScrollTop(0);
    setModelSearch('');
    setModelFilter(nextModelFilter);
    toast.success('Промпт загружен в редактор');
  };

  const publishDraftPromptVersion = (
    draftVersionId: number | undefined,
    successMessage: string,
  ) => {
    if (!draftVersionId) {
      void promptsQuery.refetch();
      toast.success(successMessage);
      return;
    }

    publishVersionMutation.mutate(
      { versionId: draftVersionId },
      {
        onSuccess: () => {
          void promptsQuery.refetch();
          toast.success(successMessage);
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const handleDeletePrompt = (promptId: number) => {
    deletePromptMutation.mutate(
      { promptId },
      {
        onSuccess: () => {
          void promptsQuery.refetch();

          if (selectedPromptId === promptId) {
            resetPromptEditor();
          }

          toast.success('Промпт удален');
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

  const handleGenerate = () => {
    const validation = validateSimulationInput({
      selectedModel,
      duplicateVariableData,
      temperature,
      renderedPrompt,
    });

    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    if (!selectedTest || selectedQuestionIds.length === 0) {
      toast.error('Выберите тест с вопросами для симуляции');
      return;
    }

    if (selectedModelItem?.supportsStructuredOutputs !== true) {
      toast.error('Выберите модель OpenRouter со structured outputs');
      return;
    }

    const { parsedTemperature, preparedPrompt } = validation;

    const runId = generateRunId();
    const startedAt = Date.now();

    setRuns((prev) => [
      buildRunningSimulationRun(runId, selectedModel, preparedPrompt, formatNow()),
      ...prev,
    ]);

    simulateMutation.mutate(
      {
        data: {
          model: selectedModel,
          prompt: preparedPrompt,
          temperature: parsedTemperature,
          questionIds: selectedQuestionIds,
          generateAnswers: true,
        },
      },
      {
        onSuccess: (data) => {
          const latencyMs = Date.now() - startedAt;
          const totalTokens = estimateTokens(preparedPrompt + data.output);

          setRuns((prev) => applySimulationSuccess(prev, runId, data, latencyMs, totalTokens));
        },
        onError: (error: unknown) => {
          const message = getApiErrorMessage(error);
          setRuns((prev) => applySimulationError(prev, runId, message));
          toast.error(message);
        },
      },
    );
  };

  const handleSavePromptVersion = () => {
    const parsedTemperature = Number(temperature);
    const preparedPrompt = promptTemplate.trim();
    const title = promptTitle.trim();

    if (!title) {
      toast.error('Укажите название промпта');
      return;
    }

    if (!selectedModel) {
      toast.error('Выберите модель');
      return;
    }

    if (selectedModelItem?.supportsStructuredOutputs !== true) {
      toast.error('Выберите модель OpenRouter со structured outputs');
      return;
    }

    if (!preparedPrompt) {
      toast.error('Шаблон промпта пуст');
      return;
    }

    if (Number.isNaN(parsedTemperature) || parsedTemperature < 0 || parsedTemperature > 2) {
      toast.error('Temperature must be between 0 and 2');
      return;
    }

    const promptPayload = {
      title,
      description: selectedPrompt?.description ?? DEFAULT_PROMPT_DESCRIPTION,
      model: selectedModel,
      temperature: parsedTemperature,
      prompt: preparedPrompt,
    };

    if (selectedPromptId) {
      updatePromptMutation.mutate(
        {
          promptId: selectedPromptId,
          data: promptPayload,
        },
        {
          onSuccess: (data) => {
            setSelectedPromptId(data.prompt.id);
            publishDraftPromptVersion(
              data.prompt.versions[0]?.id,
              'Новая версия промпта опубликована',
            );
          },
          onError: (error: unknown) => {
            toast.error(getApiErrorMessage(error));
          },
        },
      );
      return;
    }

    createPromptMutation.mutate(
      {
        data: promptPayload,
      },
      {
        onSuccess: (data) => {
          setSelectedPromptId(data.prompt.id);
          publishDraftPromptVersion(data.prompt.versions[0]?.id, 'Промпт опубликован');
        },
        onError: (error: unknown) => {
          toast.error(getApiErrorMessage(error));
        },
      },
    );
  };

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
    runs,
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
    setModel,
    setPromptTitle,
    setTemperature,
    setResponseFormat,
    setModelSearch,
    setModelFilter,
    setSystemRole,
    setMaxTokens,
    setPromptTemplate,
    setPromptEditorScrollTop,
    setShowMetrics,
    setDiffView,
    setRuns,
    setSelectedTestId,
    updateVariable,
    addVariable,
    removeVariable,
    copyRunJson,
    handleCreateNewPrompt,
    handleSelectPrompt,
    handleDeletePrompt,
    handleGenerate,
    handleSavePromptVersion,
  };
}
