import { readCompletionUsage } from './ai-usage';

describe('readCompletionUsage', () => {
  it('reads the standard OpenAI fields and the provider cost', () => {
    expect(
      readCompletionUsage({
        model: 'actual/model',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15, cost: 0.115 },
      }),
    ).toEqual({
      actualModel: 'actual/model',
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15,
      cost: 0.115,
    });
  });

  it('adds up total tokens when the provider does not send them', () => {
    expect(
      readCompletionUsage({ usage: { prompt_tokens: 10, completion_tokens: 5 } }).totalTokens,
    ).toBe(15);
    expect(readCompletionUsage({ usage: { prompt_tokens: 10 } }).totalTokens).toBeUndefined();
  });

  it('keeps cost empty when the provider has none, and keeps a real zero', () => {
    expect(readCompletionUsage({ usage: { prompt_tokens: 1 } }).cost).toBeUndefined();
    expect(readCompletionUsage({ usage: { cost: 0 } }).cost).toBe(0);
  });

  it('drops values the table could not store instead of failing the record', () => {
    const usage = readCompletionUsage({
      model: '',
      usage: {
        prompt_tokens: -1,
        completion_tokens: 1.5,
        total_tokens: 3_000_000_000,
        cost: '0.5',
      },
    });

    expect(usage).toEqual({
      actualModel: undefined,
      promptTokens: undefined,
      completionTokens: undefined,
      totalTokens: undefined,
      cost: undefined,
    });
    expect(readCompletionUsage({ usage: { cost: Number.NaN } }).cost).toBeUndefined();
    expect(readCompletionUsage({ usage: { cost: 1e10 } }).cost).toBeUndefined();
  });

  it('copes with a response that is not an object', () => {
    expect(readCompletionUsage(undefined)).toEqual({});
    expect(readCompletionUsage('text')).toEqual({});
    expect(readCompletionUsage({ usage: null })).toMatchObject({ cost: undefined });
  });
});
