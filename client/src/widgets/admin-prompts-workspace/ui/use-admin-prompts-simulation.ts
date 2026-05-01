import { useState } from 'react';
import { toast } from 'sonner';

import { INITIAL_RUNS } from '../lib/constants';
import { estimateTokens, formatNow, generateRunId, getApiErrorMessage } from '../lib/utils';

import {
  applySimulationError,
  applySimulationSuccess,
  buildRunningSimulationRun,
  validateSimulationInput,
} from './admin-prompts-workspace.helpers';

import type { DuplicateVariableData, ResponseFormat, SimulationRun } from '../model/types';
import type { useAnalysisPromptsControllerSimulatePrompt } from '@/shared/api/generated/admin/admin';
import type { PromptTestQuestionsResponseDtoTestsItem } from '@/shared/api/model';

interface UseAdminPromptsSimulationParams {
  selectedModel: string;
  selectedModelItem: { supportsStructuredOutputs?: boolean } | null;
  duplicateVariableData: DuplicateVariableData;
  temperature: string;
  renderedPrompt: string;
  selectedTest: PromptTestQuestionsResponseDtoTestsItem | null;
  selectedQuestionIds: number[];
  responseFormat: ResponseFormat;
  simulateMutation: ReturnType<typeof useAnalysisPromptsControllerSimulatePrompt>;
}

export function useAdminPromptsSimulation({
  selectedModel,
  selectedModelItem,
  duplicateVariableData,
  temperature,
  renderedPrompt,
  selectedTest,
  selectedQuestionIds,
  responseFormat,
  simulateMutation,
}: UseAdminPromptsSimulationParams) {
  const [runs, setRuns] = useState<SimulationRun[]>(INITIAL_RUNS);

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

  return {
    runs,
    setRuns,
    copyRunJson,
    handleGenerate,
  };
}
