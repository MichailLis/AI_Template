import {
  TestsTopicDetailResponseSchema,
  TestsTopicListQuerySchema,
  UpdateTestsTopicDraftSchema,
} from './tests.dto';

describe('TestsTopicListQuerySchema', () => {
  it('parses archived=false query string as false', () => {
    const result = TestsTopicListQuerySchema.parse({ archived: 'false' });

    expect(result.archived).toBe(false);
  });

  it('parses archived=true query string as true', () => {
    const result = TestsTopicListQuerySchema.parse({ archived: 'true' });

    expect(result.archived).toBe(true);
  });
});

describe('UpdateTestsTopicDraftSchema', () => {
  it('keeps analysis prompt version id when attaching a prompt to draft', () => {
    const result = UpdateTestsTopicDraftSchema.parse({
      title: 'Career map',
      analysisPromptVersionId: 42,
    });

    expect(result.analysisPromptVersionId).toBe(42);
  });

  it('keeps null analysis prompt version id when detaching a prompt from draft', () => {
    const result = UpdateTestsTopicDraftSchema.parse({
      analysisPromptVersionId: null,
    });

    expect(result.analysisPromptVersionId).toBeNull();
  });
});

describe('TestsTopicDetailResponseSchema', () => {
  it('accepts analysis prompt version summary on draft versions', () => {
    const result = TestsTopicDetailResponseSchema.parse({
      topicId: 1,
      slug: 'career-skills',
      draft: {
        id: 10,
        versionNumber: 3,
        title: 'Career skills',
        description: null,
        analysisPromptVersion: {
          id: 42,
          promptId: 7,
          promptTitle: 'Career analysis',
          versionNumber: 2,
          model: 'google/gemini-2.0-flash-exp:free',
        },
        questions: [],
      },
      published: {
        id: 9,
        versionNumber: 2,
        title: 'Career skills',
        analysisPromptVersion: null,
      },
    });

    expect(result.draft.analysisPromptVersion?.id).toBe(42);
    expect(result.published?.analysisPromptVersion).toBeNull();
  });
});
