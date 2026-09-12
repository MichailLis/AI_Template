import { hasVersionContentChanges, type TopicVersionContent } from './topic-version-content';

const createContent = (overrides: Partial<TopicVersionContent> = {}): TopicVersionContent => ({
  title: 'Профориентационный тест v3+',
  description: 'Методика V3+',
  analysisPromptVersionId: 42,
  scoringKind: 'PROF_ORIENTATION_V3_PLUS',
  scoringConfig: { version: '3.0', directions: ['A1', 'A2'] },
  questions: [
    {
      type: 'SINGLE_CHOICE',
      title: 'Что вам ближе?',
      description: null,
      required: true,
      order: 1,
      settings: { layout: 'list', shuffle: false },
      options: [
        { label: 'Техника', value: 'tech', weight: 2, order: 1 },
        { label: 'Люди', value: 'people', weight: 1, order: 2 },
      ],
      sliderBands: [],
    },
    {
      type: 'SLIDER',
      title: 'Насколько вы усидчивы?',
      description: null,
      required: true,
      order: 2,
      settings: { min: 0, max: 10 },
      options: [],
      sliderBands: [{ minValue: 0, maxValue: 5, label: 'Низко', weight: 0, order: 1 }],
    },
  ],
  ...overrides,
});

/**
 * Находка аудита UX-03: публикация всегда клонирует новый черновик, поэтому «Черновик v2» стоял у
 * каждого опубликованного теста, даже без правок. Изменения — это отличие содержимого, а не факт
 * существования черновика.
 */
describe('hasVersionContentChanges', () => {
  it('treats a freshly cloned draft as unchanged', () => {
    expect(hasVersionContentChanges(createContent(), createContent())).toBe(false);
  });

  it('ignores the key order of stored JSON settings', () => {
    const published = createContent();
    const draft = createContent({
      questions: published.questions.map((question, index) =>
        index === 0 ? { ...question, settings: { shuffle: false, layout: 'list' } } : question,
      ),
    });

    expect(hasVersionContentChanges(draft, published)).toBe(false);
  });

  it.each<[string, (content: TopicVersionContent) => TopicVersionContent]>([
    ['the title', (content) => ({ ...content, title: 'Новое название' })],
    ['the analysis prompt', (content) => ({ ...content, analysisPromptVersionId: 43 })],
    [
      'a question title',
      (content) => ({
        ...content,
        questions: content.questions.map((question, index) =>
          index === 0 ? { ...question, title: 'Что вам интереснее?' } : question,
        ),
      }),
    ],
    [
      'an option weight',
      (content) => ({
        ...content,
        questions: content.questions.map((question, index) =>
          index === 0
            ? {
                ...question,
                options: question.options.map((option, optionIndex) =>
                  optionIndex === 0 ? { ...option, weight: 5 } : option,
                ),
              }
            : question,
        ),
      }),
    ],
    [
      'a slider band',
      (content) => ({
        ...content,
        questions: content.questions.map((question, index) =>
          index === 1
            ? { ...question, sliderBands: [{ ...question.sliderBands[0], maxValue: 6 }] }
            : question,
        ),
      }),
    ],
    [
      'the question order',
      (content) => ({
        ...content,
        questions: [
          { ...content.questions[1], order: 1 },
          { ...content.questions[0], order: 2 },
        ],
      }),
    ],
    ['a removed question', (content) => ({ ...content, questions: [content.questions[0]] })],
  ])('detects a change in %s', (_change, applyChange) => {
    expect(hasVersionContentChanges(applyChange(createContent()), createContent())).toBe(true);
  });
});
