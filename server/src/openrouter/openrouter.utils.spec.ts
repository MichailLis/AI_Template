import {
  filterStructuredOutputPromptModels,
  parseOpenRouterModels,
  resolveDefaultPromptModel,
} from './openrouter.utils';

describe('openrouter utils', () => {
  it('keeps only concrete models that support strict structured outputs for analysis prompts', () => {
    const models = parseOpenRouterModels({
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
});
