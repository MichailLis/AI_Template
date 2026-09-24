import { calculatePromptUsage } from './prompt-usage.utils';

describe('calculatePromptUsage', () => {
  it('merges active versions, pinned history, and recoverable analyses once per topic', () => {
    const usage = calculatePromptUsage(
      [
        {
          id: 1,
          slug: 'published-with-same-draft',
          activePublishedVersion: {
            title: 'Published title',
            analysisPromptVersion: { promptId: 10 },
          },
          activeDraftVersion: {
            title: 'Draft title',
            analysisPromptVersion: { promptId: 10 },
          },
        },
        {
          id: 2,
          slug: 'draft-and-pinned-history',
          activePublishedVersion: null,
          activeDraftVersion: {
            title: 'Draft title',
            analysisPromptVersion: { promptId: 20 },
          },
        },
      ],
      [
        {
          title: 'Pinned historical title',
          analysisPromptVersion: { promptId: 20 },
          topic: { id: 2, slug: 'draft-and-pinned-history' },
        },
      ],
      [
        {
          promptVersion: { promptId: 20 },
          attempt: {
            topicVersion: {
              title: 'Recoverable title',
              topic: { id: 2, slug: 'draft-and-pinned-history' },
            },
          },
        },
        {
          promptVersion: { promptId: 30 },
          attempt: {
            topicVersion: {
              title: 'Recoverable historical title',
              topic: { id: 3, slug: 'recoverable-history' },
            },
          },
        },
      ],
    );

    expect(usage).toEqual(
      new Map([
        [
          10,
          [
            {
              topicId: 1,
              title: 'Published title',
              slug: 'published-with-same-draft',
              onPublishedVersion: true,
            },
          ],
        ],
        [
          20,
          [
            {
              topicId: 2,
              title: 'Draft title',
              slug: 'draft-and-pinned-history',
              onPublishedVersion: true,
            },
          ],
        ],
        [
          30,
          [
            {
              topicId: 3,
              title: 'Recoverable historical title',
              slug: 'recoverable-history',
              onPublishedVersion: true,
            },
          ],
        ],
      ]),
    );
  });
});
