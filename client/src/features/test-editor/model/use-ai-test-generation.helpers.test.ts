import { describe, expect, it, vi } from 'vitest';

import { executeAiGeneration, handleTypeToggle } from './use-ai-test-generation.helpers';

import type {
  AdminPromptResponseDto,
  CreateTestsTopicFromAiDtoQuestionsItemType,
  GeneratePromptDto,
} from '@/shared/api/model';
import type { SetStateAction } from 'react';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('AI test generation orchestration helpers', () => {
  it('toggles selected question types without mutating the previous state', () => {
    type SelectedTypes = Record<CreateTestsTopicFromAiDtoQuestionsItemType, boolean>;
    const capturedUpdaters: Array<(previous: SelectedTypes) => SelectedTypes> = [];
    const setSelectedTypes = vi.fn((updater: SetStateAction<SelectedTypes>) => {
      if (typeof updater === 'function') {
        capturedUpdaters.push(updater as (previous: SelectedTypes) => SelectedTypes);
      }
    });

    handleTypeToggle({
      type: 'SLIDER',
      setSelectedTypes,
    });

    const previous = {
      OPEN_TEXT: true,
      SINGLE_CHOICE: true,
      MULTI_CHOICE: false,
      SLIDER: false,
    };

    expect(capturedUpdaters).toHaveLength(1);
    expect(capturedUpdaters[0](previous)).toEqual({
      ...previous,
      SLIDER: true,
    });
    expect(previous.SLIDER).toBe(false);
  });

  it('rejects invalid AI model output without keeping stale preview questions', () => {
    const setGenerationError = vi.fn();
    const setPreviewQuestions = vi.fn();
    const mutate = vi.fn(
      (
        _variables: { data: GeneratePromptDto },
        options: {
          onSuccess: (result: AdminPromptResponseDto) => void;
          onError: (error: unknown) => void;
        },
      ) => {
        options.onSuccess({ output: 'not json' } as AdminPromptResponseDto);
      },
    );

    executeAiGeneration({
      topicTitle: 'Topic',
      topicDescription: '',
      generationTask: 'Generate',
      effectiveModel: 'model-a',
      allowedTypes: ['OPEN_TEXT'],
      parsedQuestionCount: 1,
      setGenerationError,
      setPreviewQuestions,
      mutate,
    });

    expect(setPreviewQuestions).toHaveBeenCalledWith([]);
    expect(setGenerationError).toHaveBeenCalledWith('ИИ вернул невалидный JSON');
  });
});
