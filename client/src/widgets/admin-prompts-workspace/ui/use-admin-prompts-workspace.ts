import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useAdminControllerGeneratePrompt,
  useAdminControllerGetPromptModels,
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

export function useAdminPromptsWorkspace() {
  const modelsQuery = useAdminControllerGetPromptModels();
  const generateMutation = useAdminControllerGeneratePrompt();

  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState('0.7');
  const [responseFormat, setResponseFormat] = useState<ResponseFormat>('text');
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

  const allModels = useMemo(() => modelsQuery.data?.models ?? [], [modelsQuery.data?.models]);

  const filteredModels = useMemo(() => {
    const normalizedSearch = modelSearch.trim().toLowerCase();
    const hasFreeModels = allModels.some((item) => item.isFree);
    const effectiveModelFilter = modelFilter === 'free' && !hasFreeModels ? 'all' : modelFilter;

    return allModels.filter((item) => {
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
  }, [allModels, modelFilter, modelSearch]);

  const selectedModel = useMemo(
    () =>
      resolveSelectedPromptModel(model, filteredModels, allModels, modelsQuery.data?.defaultModel),
    [allModels, filteredModels, model, modelsQuery.data?.defaultModel],
  );

  const selectedModelItem = allModels.find((item) => item.id === selectedModel) ?? null;

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

    const { parsedTemperature, preparedPrompt } = validation;

    const runId = generateRunId();
    const startedAt = Date.now();

    setRuns((prev) => [
      buildRunningSimulationRun(runId, selectedModel, preparedPrompt, formatNow()),
      ...prev,
    ]);

    generateMutation.mutate(
      {
        data: {
          model: selectedModel,
          prompt: preparedPrompt,
          temperature: parsedTemperature,
          responseFormat,
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

  return {
    modelsQuery,
    generateMutation,
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
    allModels,
    filteredModels,
    selectedModel,
    selectedModelItem,
    promptLineCount,
    duplicateVariableData,
    detectedVariablesCount,
    setModel,
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
    updateVariable,
    addVariable,
    removeVariable,
    copyRunJson,
    handleGenerate,
  };
}
