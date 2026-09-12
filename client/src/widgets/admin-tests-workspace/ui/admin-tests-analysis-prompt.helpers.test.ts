import { describe, expect, it } from 'vitest';

import { getNewerAnalysisPromptVersion } from './admin-tests-analysis-prompt.helpers';

import type { AnalysisPromptVersionSummary } from './admin-tests-analysis-prompt-settings-section';
import type {
  AnalysisPromptListResponseDtoPromptsItem,
  AnalysisPromptListResponseDtoPromptsItemVersionsItem,
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
  activeTests: [],
});

const attachedV1: AnalysisPromptVersionSummary = {
  id: 42,
  promptId: 7,
  promptTitle: 'Профориентация v3+',
  versionNumber: 1,
  model: 'openai/gpt-oss-120b',
};

describe('getNewerAnalysisPromptVersion', () => {
  it('reports the published version when the test is pinned to an older one', () => {
    const prompts = [
      makePrompt([
        makePromptVersion({
          id: 43,
          versionNumber: 2,
          status: 'PUBLISHED',
          model: 'deepseek/deepseek-v4-flash',
        }),
        makePromptVersion({ id: 42, versionNumber: 1, status: 'ARCHIVED' }),
      ]),
    ];

    expect(getNewerAnalysisPromptVersion({ attachedVersion: attachedV1, prompts })).toEqual({
      versionId: 43,
      versionNumber: 2,
      model: 'deepseek/deepseek-v4-flash',
    });
  });

  it('reports nothing when the test already uses the published version', () => {
    const prompts = [makePrompt([makePromptVersion({ id: 42, versionNumber: 1 })])];

    expect(getNewerAnalysisPromptVersion({ attachedVersion: attachedV1, prompts })).toBeNull();
  });

  it('reports nothing when no version of the prompt is published', () => {
    const prompts = [
      makePrompt([makePromptVersion({ id: 43, versionNumber: 2, status: 'DRAFT' })]),
    ];

    expect(getNewerAnalysisPromptVersion({ attachedVersion: attachedV1, prompts })).toBeNull();
  });

  it('reports nothing when no prompt is attached or the prompt list has not loaded', () => {
    expect(getNewerAnalysisPromptVersion({ attachedVersion: null, prompts: [] })).toBeNull();
    expect(getNewerAnalysisPromptVersion({ attachedVersion: attachedV1, prompts: [] })).toBeNull();
  });
});
