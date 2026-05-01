import {
  AnalysisPromptListResponseSchema,
  CreateAnalysisPromptSchema,
  PromptSimulationRequestSchema,
  PromptTestQuestionsResponseSchema,
  PublishAnalysisPromptVersionSchema,
  UpdateAnalysisPromptVersionSchema,
} from './analysis-prompt.dto';

describe('analysis prompt DTOs', () => {
  it('accepts a prompt draft with free model default expectations', () => {
    const result = CreateAnalysisPromptSchema.parse({
      title: 'Career guidance analysis',
      description: 'Analyzes completed student tests.',
      model: 'google/gemini-2.0-flash-exp:free',
      prompt: 'Analyze {{answers}}',
      temperature: 0.2,
    });

    expect(result.model.endsWith(':free')).toBe(true);
    expect(result.temperature).toBe(0.2);
  });

  it('accepts published prompt versions in list response', () => {
    const result = AnalysisPromptListResponseSchema.parse({
      prompts: [
        {
          id: 7,
          title: 'Career guidance analysis',
          description: 'Analyzes completed student tests.',
          createdAt: '2026-05-01T10:00:00.000Z',
          updatedAt: '2026-05-01T10:05:00.000Z',
          versions: [
            {
              id: 42,
              promptId: 7,
              versionNumber: 2,
              status: 'PUBLISHED',
              model: 'google/gemini-2.0-flash-exp:free',
              temperature: 0.2,
              prompt: 'Analyze {{answers}}',
              publishedAt: '2026-05-01T10:05:00.000Z',
              createdAt: '2026-05-01T10:00:00.000Z',
              updatedAt: '2026-05-01T10:05:00.000Z',
            },
          ],
        },
      ],
    });

    expect(result.prompts[0]?.versions[0]?.status).toBe('PUBLISHED');
  });

  it('requires selected question ids for prompt simulation', () => {
    expect(() =>
      PromptSimulationRequestSchema.parse({
        prompt: 'Analyze selected answers',
        model: 'google/gemini-2.0-flash-exp:free',
        temperature: 0.2,
        questionIds: [],
      }),
    ).toThrow();
  });

  it('accepts test question groups scoped to one test version', () => {
    const result = PromptTestQuestionsResponseSchema.parse({
      tests: [
        {
          id: 31,
          topicId: 12,
          topicSlug: 'career-skills',
          title: 'Career skills',
          description: null,
          versionNumber: 3,
          versionStatus: 'DRAFT',
          questionCount: 2,
          questions: [
            {
              id: 11,
              type: 'OPEN_TEXT',
              title: 'Что вам легче всего дается?',
              description: null,
            },
            {
              id: 12,
              type: 'SINGLE_CHOICE',
              title: 'Как вы реагируете на изменения?',
              description: 'Выберите один вариант.',
            },
          ],
        },
      ],
    });

    expect(result.tests[0]?.questions).toHaveLength(2);
    expect(result.tests[0]?.questions.map((question) => question.id)).toEqual([11, 12]);
  });

  it('accepts publish request with version id', () => {
    const result = PublishAnalysisPromptVersionSchema.parse({ versionId: 42 });

    expect(result.versionId).toBe(42);
  });

  it('accepts partial prompt update fields', () => {
    const result = UpdateAnalysisPromptVersionSchema.parse({
      title: 'Updated prompt',
      model: 'openai/gpt-4.1',
      prompt: 'Analyze updated {{answers}}',
    });

    expect(result).toMatchObject({
      title: 'Updated prompt',
      model: 'openai/gpt-4.1',
    });
  });
});
