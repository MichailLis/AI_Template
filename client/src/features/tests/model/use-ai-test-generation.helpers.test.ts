import { describe, expect, it, vi } from 'vitest';

import {
  buildCreatePayloadResult,
  executeAiGeneration,
  handleTypeToggle,
  resolveEffectiveModel,
  validateGenerationInput,
} from './use-ai-test-generation.helpers';

import type {
  AdminPromptResponseDto,
  CreateTestsTopicFromAiDtoQuestionsItem,
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

describe('AI test generation helpers', () => {
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

  it('validates generation inputs and question count bounds', () => {
    expect(
      validateGenerationInput({
        topicTitle: '',
        generationTask: 'Generate',
        effectiveModel: 'model-a',
        allowedTypes: ['OPEN_TEXT'],
        questionCount: '5',
      }),
    ).toEqual({ ok: false, error: 'Укажите тему теста' });

    expect(
      validateGenerationInput({
        topicTitle: 'Topic',
        generationTask: 'Generate',
        effectiveModel: 'model-a',
        allowedTypes: ['OPEN_TEXT'],
        questionCount: '61',
      }),
    ).toEqual({ ok: false, error: 'Количество вопросов должно быть от 1 до 60' });

    expect(
      validateGenerationInput({
        topicTitle: 'Topic',
        generationTask: 'Generate',
        effectiveModel: 'model-a',
        allowedTypes: ['OPEN_TEXT'],
        questionCount: '2',
      }),
    ).toEqual({ ok: true, parsedQuestionCount: 2 });
  });

  it('uses visible free models before default fallbacks', () => {
    expect(
      resolveEffectiveModel({
        selectedModel: 'selected',
        visibleModelOptions: [{ id: 'selected' }],
        modelOptions: [{ id: 'selected' }],
      }),
    ).toBe('selected');

    expect(
      resolveEffectiveModel({
        selectedModel: 'hidden',
        visibleModelOptions: [{ id: 'free', isFree: true }],
        modelOptions: [{ id: 'hidden' }, { id: 'free' }],
        defaultModel: 'hidden',
      }),
    ).toBe('free');
  });

  it('builds create payloads only when a title and preview questions are present', () => {
    const questions: CreateTestsTopicFromAiDtoQuestionsItem[] = [
      {
        type: 'OPEN_TEXT',
        title: 'Question',
        description: null,
        required: true,
      },
    ];

    expect(
      buildCreatePayloadResult({
        topicTitle: '  Topic  ',
        topicDescription: '  Description  ',
        previewQuestions: questions,
      }),
    ).toEqual({
      ok: true,
      payload: {
        title: 'Topic',
        description: 'Description',
        questions,
      },
    });

    expect(
      buildCreatePayloadResult({
        topicTitle: 'Topic',
        topicDescription: '',
        previewQuestions: [],
      }),
    ).toEqual({ ok: false, error: 'Сначала сгенерируйте вопросы' });
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
