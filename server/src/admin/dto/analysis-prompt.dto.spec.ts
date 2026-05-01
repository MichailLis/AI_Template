import {
  AnalysisPromptListResponseSchema,
  CreateAnalysisPromptSchema,
  PromptSimulationRequestSchema,
  PublishAnalysisPromptVersionSchema,
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

  it('accepts publish request with version id', () => {
    const result = PublishAnalysisPromptVersionSchema.parse({ versionId: 42 });

    expect(result.versionId).toBe(42);
  });
});
