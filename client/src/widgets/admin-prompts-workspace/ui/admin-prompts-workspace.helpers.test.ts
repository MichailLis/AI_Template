import { describe, expect, it } from 'vitest';

import {
  applySimulationError,
  applySimulationSuccess,
  buildRunningSimulationRun,
  resolveSelectedPromptModel,
  validateSimulationInput,
} from './admin-prompts-workspace.helpers';

import type { DuplicateVariableData, SimulationRun } from '../model/types';
import type {
  AdminPromptModelsResponseDtoModelsItem,
  PromptSimulationResponseDto,
} from '@/shared/api/model';

const emptyDuplicateData: DuplicateVariableData = {
  duplicateKeys: [],
  duplicateIds: new Set<string>(),
};

const makeModel = (id: string, isFree: boolean): AdminPromptModelsResponseDtoModelsItem => ({
  id,
  label: id,
  provider: 'openrouter',
  isFree,
  supportsStructuredOutputs: true,
  contextLength: null,
  promptPrice: null,
  completionPrice: null,
});

describe('admin prompts workspace helpers', () => {
  it('validates simulation input before sending it to the backend', () => {
    expect(
      validateSimulationInput({
        selectedModel: '',
        duplicateVariableData: emptyDuplicateData,
        temperature: '0.2',
        renderedPrompt: 'Prompt',
      }),
    ).toEqual({ ok: false, error: 'Select a model first' });

    expect(
      validateSimulationInput({
        selectedModel: 'model-a',
        duplicateVariableData: {
          duplicateKeys: ['name'],
          duplicateIds: new Set(['variable-1']),
        },
        temperature: '0.2',
        renderedPrompt: 'Prompt',
      }),
    ).toEqual({ ok: false, error: 'Duplicate variable keys: name' });

    expect(
      validateSimulationInput({
        selectedModel: 'model-a',
        duplicateVariableData: emptyDuplicateData,
        temperature: '2.5',
        renderedPrompt: 'Prompt',
      }),
    ).toEqual({ ok: false, error: 'Temperature must be between 0 and 2' });

    expect(
      validateSimulationInput({
        selectedModel: 'model-a',
        duplicateVariableData: emptyDuplicateData,
        temperature: '0.2',
        renderedPrompt: '  Prompt  ',
      }),
    ).toEqual({ ok: true, parsedTemperature: 0.2, preparedPrompt: 'Prompt' });
  });

  it('updates simulation runs immutably for success and error states', () => {
    const initialRun = buildRunningSimulationRun('run-1', 'model-a', 'Prompt', '2026-05-12');
    const runs: SimulationRun[] = [initialRun];
    const result = {
      output: 'Generated answer',
    } as PromptSimulationResponseDto;

    expect(applySimulationSuccess(runs, 'run-1', result, 120, 40)).toEqual([
      {
        ...initialRun,
        status: 'success',
        output: 'Generated answer',
        latencyMs: 120,
        totalTokens: 40,
      },
    ]);
    expect(applySimulationError(runs, 'run-1', 'Backend error')).toEqual([
      {
        ...initialRun,
        status: 'error',
        errorMessage: 'Backend error',
      },
    ]);
    expect(runs).toEqual([initialRun]);
  });

  it('keeps the selected model when visible and otherwise falls back predictably', () => {
    const freeModel = makeModel('model-free', true);
    const paidModel = makeModel('model-paid', false);

    expect(
      resolveSelectedPromptModel('model-paid', [freeModel, paidModel], [freeModel, paidModel]),
    ).toBe('model-paid');
    expect(
      resolveSelectedPromptModel('', [freeModel, paidModel], [freeModel, paidModel], 'model-free'),
    ).toBe('model-free');
    expect(resolveSelectedPromptModel('', [paidModel], [freeModel, paidModel], 'model-free')).toBe(
      'model-paid',
    );
    expect(resolveSelectedPromptModel('hidden', [paidModel], [freeModel, paidModel])).toBe(
      'model-paid',
    );
  });
});
