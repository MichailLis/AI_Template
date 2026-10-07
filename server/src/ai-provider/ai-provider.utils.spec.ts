import {
  extractAiProviderErrorMessage,
  filterStructuredOutputPromptModels,
  parsePromptModels,
  resolveDefaultPromptModel,
} from './ai-provider.utils';

describe('ai provider utils', () => {
  it('keeps only concrete models that support strict structured outputs for analysis prompts', () => {
    const models = parsePromptModels({
      data: [
        {
          id: 'baidu/qianfan-ocr-fast:free',
          name: 'Qianfan OCR Fast',
          supported_parameters: ['tools'],
          pricing: { prompt: '0', completion: '0' },
        },
        {
          id: 'ai21/jamba-large-1.7',
          name: 'AI21: Jamba Large 1.7',
          supported_parameters: ['response_format'],
          pricing: { prompt: '0.000002', completion: '0.000008' },
        },
        {
          id: 'openrouter/free',
          name: 'Free Models Router',
          supported_parameters: ['response_format', 'structured_outputs'],
          pricing: { prompt: '0', completion: '0' },
        },
        {
          id: 'openrouter/auto',
          name: 'Auto Router',
          supported_parameters: ['response_format', 'structured_outputs'],
          pricing: { prompt: '-1', completion: '-1' },
        },
        {
          id: 'openai/gpt-oss-20b:free',
          name: 'gpt-oss-20b',
          supported_parameters: ['response_format', 'structured_outputs'],
          pricing: { prompt: '0', completion: '0' },
        },
        {
          id: 'paid/structured-only',
          name: 'Paid structured only',
          supported_parameters: ['structured_outputs'],
          pricing: { prompt: '0.1', completion: '0.1' },
        },
        {
          id: 'paid/full-structured',
          name: 'Paid full structured',
          supported_parameters: ['response_format', 'structured_outputs'],
          pricing: { prompt: '0.1', completion: '0.1' },
        },
      ],
    });

    const result = filterStructuredOutputPromptModels(models);

    expect(result.map((model) => model.id)).toEqual([
      'openai/gpt-oss-20b:free',
      'paid/full-structured',
    ]);
  });

  it('prefers free structured output models by default', () => {
    const models = [
      {
        id: 'openai/gpt-oss-20b:free',
        label: 'gpt-oss-20b',
        provider: 'openai',
        isFree: true,
        supportsStructuredOutputs: true,
        contextLength: 128000,
        promptPrice: 0,
        completionPrice: 0,
      },
      {
        id: 'google/gemma-3-27b-it:free',
        label: 'Gemma',
        provider: 'google',
        isFree: true,
        supportsStructuredOutputs: true,
        contextLength: 96000,
        promptPrice: 0,
        completionPrice: 0,
      },
    ];

    expect(resolveDefaultPromptModel(models, 'google/gemma-3-27b-it:free')).toBe(
      'google/gemma-3-27b-it:free',
    );
    expect(resolveDefaultPromptModel(models, 'baidu/qianfan-ocr-fast:free')).toBe(
      'openai/gpt-oss-20b:free',
    );
    expect(resolveDefaultPromptModel(models, 'openrouter/free')).toBe('openai/gpt-oss-20b:free');
  });

  it('reads the Polza.ai catalog where capabilities and prices live in top_provider', () => {
    const models = parsePromptModels({
      object: 'list',
      data: [
        {
          id: 'openai/gpt-4o',
          name: 'GPT-4o',
          type: 'chat',
          context_length: 128000,
          top_provider: {
            supported_parameters: ['temperature', 'tools', 'response_format'],
            pricing: {
              prompt_per_million: '7.50',
              completion_per_million: '22.50',
              currency: 'RUB',
            },
          },
        },
        {
          id: 'some/tools-only',
          name: 'Tools only',
          type: 'chat',
          top_provider: { supported_parameters: ['tools'], pricing: { currency: 'RUB' } },
        },
        {
          id: 'openai/text-embedding-3-small',
          name: 'Embeddings',
          type: 'embedding',
          top_provider: { supported_parameters: ['response_format'], pricing: { currency: 'RUB' } },
        },
      ],
    });

    expect(filterStructuredOutputPromptModels(models)).toEqual([
      {
        id: 'openai/gpt-4o',
        label: 'GPT-4o (openai/gpt-4o)',
        provider: 'openai',
        isFree: false,
        supportsStructuredOutputs: true,
        contextLength: 128000,
        promptPrice: 7.5,
        completionPrice: 22.5,
      },
    ]);
  });

  it('keeps models of a plain OpenAI-style catalog that reports no capabilities', () => {
    const models = parsePromptModels({
      object: 'list',
      data: [{ id: 'gpt-4o-mini', object: 'model', owned_by: 'openai' }],
    });

    expect(filterStructuredOutputPromptModels(models)).toEqual([
      expect.objectContaining({
        id: 'gpt-4o-mini',
        provider: 'openai',
        supportsStructuredOutputs: true,
      }),
    ]);
  });

  it('extracts the provider message from an SDK error body', () => {
    expect(
      extractAiProviderErrorMessage(
        Object.assign(new Error('401 User not found.'), { error: { message: 'User not found.' } }),
        'fallback',
      ),
    ).toBe('User not found.');
    expect(extractAiProviderErrorMessage(new Error('boom'), 'fallback')).toBe('boom');
    expect(extractAiProviderErrorMessage(null, 'fallback')).toBe('fallback');
  });
});
