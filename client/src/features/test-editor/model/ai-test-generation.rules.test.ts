import { describe, expect, it } from 'vitest';

import {
  buildCreatePayloadResult,
  buildGenerateVariables,
  resolveEffectiveModel,
  validateGenerationInput,
} from './ai-test-generation.rules';

import type { CreateTestsTopicFromAiDtoQuestionsItem } from '@/shared/api/model';

describe('AI test generation rules', () => {
  it('keeps a selected model when it remains visible', () => {
    expect(
      resolveEffectiveModel({
        selectedModel: 'selected',
        visibleModelOptions: [{ id: 'selected' }],
        modelOptions: [{ id: 'selected' }],
      }),
    ).toBe('selected');
  });

  it('prefers a visible free model before hidden defaults', () => {
    expect(
      resolveEffectiveModel({
        selectedModel: 'hidden',
        visibleModelOptions: [{ id: 'free', isFree: true }],
        modelOptions: [{ id: 'hidden' }, { id: 'free' }],
        defaultModel: 'hidden',
      }),
    ).toBe('free');
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

  it('builds a trimmed create payload when title and questions are present', () => {
    const questions: CreateTestsTopicFromAiDtoQuestionsItem[] = [
      { type: 'OPEN_TEXT', title: 'Question', description: null, required: true },
    ];

    expect(
      buildCreatePayloadResult({
        topicTitle: '  Topic  ',
        topicDescription: '  Description  ',
        previewQuestions: questions,
      }),
    ).toEqual({
      ok: true,
      payload: { title: 'Topic', description: 'Description', questions },
    });

    expect(
      buildCreatePayloadResult({
        topicTitle: 'Topic',
        topicDescription: '',
        previewQuestions: [],
      }),
    ).toEqual({ ok: false, error: 'Сначала сгенерируйте вопросы' });
  });

  it('builds generation API variables with normalized prompt inputs and request options', () => {
    const { data } = buildGenerateVariables({
      topicTitle: '  Topic  ',
      topicDescription: '  Description  ',
      generationTask: '  Generate  ',
      effectiveModel: 'model-a',
      parsedQuestionCount: 2,
      allowedTypes: ['OPEN_TEXT'],
    });

    expect(data).toMatchObject({
      model: 'model-a',
      temperature: 0.2,
      responseFormat: 'json',
      responseSchema: {
        name: 'generated_test_questions',
        strict: true,
        schema: {
          type: 'object',
          properties: { questions: { minItems: 2, maxItems: 2 } },
        },
      },
      requireParameters: true,
      useResponseHealing: true,
    });
    expect(data.prompt).toContain('Тема теста: Topic');
    expect(data.prompt).toContain('Описание теста: Description');
    expect(data.prompt).toContain('Задача/контекст: Generate');
  });
});
