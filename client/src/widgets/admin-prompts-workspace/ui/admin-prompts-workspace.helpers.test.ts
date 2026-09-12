import { describe, expect, it } from 'vitest';

import {
  applySimulationError,
  applySimulationSuccess,
  buildRunningSimulationRun,
  getPromptModelMismatch,
  getPromptUsageSummary,
  resolveSelectedPromptModel,
  validateSimulationInput,
} from './admin-prompts-workspace.helpers';

import type { DuplicateVariableData, SimulationRun } from '../model/types';
import type {
  AdminPromptModelsResponseDtoModelsItem,
  AnalysisPromptListResponseDtoPromptsItem,
  AnalysisPromptListResponseDtoPromptsItemVersionsItem,
  PromptSimulationResponseDto,
} from '@/shared/api/model';

const makePromptVersion = (
  overrides: Partial<AnalysisPromptListResponseDtoPromptsItemVersionsItem>,
): AnalysisPromptListResponseDtoPromptsItemVersionsItem => ({
  id: 1,
  promptId: 7,
  versionNumber: 1,
  status: 'PUBLISHED',
  model: 'openai/gpt-oss-120b',
  temperature: 0.2,
  prompt: 'Analyze',
  usedInTestCount: 0,
  publishedAt: '2026-09-01T10:00:00.000Z',
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  ...overrides,
});

const makePrompt = (
  versions: AnalysisPromptListResponseDtoPromptsItemVersionsItem[],
): AnalysisPromptListResponseDtoPromptsItem => ({
  id: 7,
  title: 'Профориентация v3+',
  description: null,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  versions,
});

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
    expect(resolveSelectedPromptModel('hidden', [paidModel], [freeModel, paidModel])).toBe(
      'model-paid',
    );
  });

  /**
   * Находка аудита UX-07: фильтр «Бесплатные» скрывал модель по умолчанию и сохраненную модель
   * промпта, и выбор молча переключался на первую бесплатную модель — ее и сохраняли. Прежнее
   * ожидание `('', [paid], [free, paid], 'model-free') → 'model-paid'` закрепляло именно эту подмену.
   */
  it('does not swap a catalog model for another one just because the filter hides it', () => {
    const freeModel = makeModel('model-free', true);
    const paidModel = makeModel('model-paid', false);

    expect(resolveSelectedPromptModel('', [freeModel], [freeModel, paidModel], 'model-paid')).toBe(
      'model-paid',
    );
    expect(resolveSelectedPromptModel('model-paid', [freeModel], [freeModel, paidModel])).toBe(
      'model-paid',
    );
    expect(resolveSelectedPromptModel('', [paidModel], [freeModel, paidModel], 'model-free')).toBe(
      'model-free',
    );
  });
});

describe('getPromptModelMismatch', () => {
  const prompt = makePrompt([
    makePromptVersion({ id: 43, versionNumber: 2, model: 'deepseek/deepseek-v4-flash' }),
    makePromptVersion({ id: 42, versionNumber: 1, model: 'openai/gpt-oss-120b' }),
  ]);

  it('reports the saved model when the editor model differs from the latest version', () => {
    expect(getPromptModelMismatch(prompt, 'dots/dots3-note:free')).toEqual({
      versionNumber: 2,
      savedModel: 'deepseek/deepseek-v4-flash',
    });
  });

  it('reports nothing for a new prompt or for the saved model', () => {
    expect(getPromptModelMismatch(null, 'dots/dots3-note:free')).toBeNull();
    expect(getPromptModelMismatch(prompt, 'deepseek/deepseek-v4-flash')).toBeNull();
    expect(getPromptModelMismatch(makePrompt([]), 'deepseek/deepseek-v4-flash')).toBeNull();
  });
});

describe('getPromptUsageSummary', () => {
  it('separates tests on the published version from tests left on older versions', () => {
    const prompt = makePrompt([
      makePromptVersion({ id: 43, versionNumber: 2, status: 'PUBLISHED', usedInTestCount: 1 }),
      makePromptVersion({ id: 42, versionNumber: 1, status: 'ARCHIVED', usedInTestCount: 3 }),
    ]);

    expect(getPromptUsageSummary(prompt)).toEqual({
      publishedVersionNumber: 2,
      testsOnPublishedVersion: 1,
      testsOnOutdatedVersions: 3,
    });
  });

  it('reports no published version while the prompt is still a draft', () => {
    const prompt = makePrompt([
      makePromptVersion({ id: 42, versionNumber: 1, status: 'DRAFT', usedInTestCount: 0 }),
    ]);

    expect(getPromptUsageSummary(prompt)).toEqual({
      publishedVersionNumber: null,
      testsOnPublishedVersion: 0,
      testsOnOutdatedVersions: 0,
    });
  });

  it('counts draft versions that tests still reference as outdated usage', () => {
    const prompt = makePrompt([
      makePromptVersion({ id: 44, versionNumber: 3, status: 'DRAFT', usedInTestCount: 2 }),
      makePromptVersion({ id: 43, versionNumber: 2, status: 'PUBLISHED', usedInTestCount: 5 }),
    ]);

    expect(getPromptUsageSummary(prompt)).toEqual({
      publishedVersionNumber: 2,
      testsOnPublishedVersion: 5,
      testsOnOutdatedVersions: 2,
    });
  });

  it('handles a prompt without versions', () => {
    expect(getPromptUsageSummary(makePrompt([]))).toEqual({
      publishedVersionNumber: null,
      testsOnPublishedVersion: 0,
      testsOnOutdatedVersions: 0,
    });
  });
});
