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

  const defaultFreeModel = allModels.find((item) => item.isFree)?.id;
  const selectedModelCandidate =
    model || defaultFreeModel || modelsQuery.data?.defaultModel || allModels[0]?.id || '';
  const selectedModel = filteredModels.some((item) => item.id === selectedModelCandidate)
    ? selectedModelCandidate
    : filteredModels[0]?.id || selectedModelCandidate;

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
    if (!selectedModel) {
      toast.error('Select a model first');
      return;
    }

    if (duplicateVariableData.duplicateKeys.length > 0) {
      toast.error(`Duplicate variable keys: ${duplicateVariableData.duplicateKeys.join(', ')}`);
      return;
    }

    const parsedTemperature = Number(temperature);

    if (Number.isNaN(parsedTemperature) || parsedTemperature < 0 || parsedTemperature > 2) {
      toast.error('Temperature must be between 0 and 2');
      return;
    }

    const preparedPrompt = renderedPrompt.trim();

    if (!preparedPrompt) {
      toast.error('Prompt is empty after variable substitution');
      return;
    }

    const runId = generateRunId();
    const startedAt = Date.now();

    setRuns((prev) => [
      {
        id: runId,
        createdAt: formatNow(),
        status: 'running',
        model: selectedModel,
        prompt: preparedPrompt,
      },
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

          setRuns((prev) =>
            prev.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'success',
                    output: data.output,
                    latencyMs,
                    totalTokens,
                  }
                : run,
            ),
          );
        },
        onError: (error: unknown) => {
          setRuns((prev) =>
            prev.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    status: 'error',
                    errorMessage: getApiErrorMessage(error),
                  }
                : run,
            ),
          );
          toast.error(getApiErrorMessage(error));
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
