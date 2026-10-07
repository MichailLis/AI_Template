import type { AiProviderConnection } from './ai-provider.config';

/** Подключение для спеков, которым нужен провайдер, но не важно какой. */
export const TEST_AI_PROVIDER_CONNECTION: AiProviderConnection = {
  provider: 'polza',
  label: 'Polza.ai',
  baseUrl: 'https://polza.ai/api/v1',
  apiKey: 'test-key',
  defaultModel: null,
  supportsOpenRouterExtensions: false,
};
