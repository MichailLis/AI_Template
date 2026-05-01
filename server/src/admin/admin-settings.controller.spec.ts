import { AdminSettingsController } from './admin-settings.controller';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';

describe('AdminSettingsController', () => {
  let controller: AdminSettingsController;
  let openRouterApiKeyService: {
    getOpenRouterSettings: jest.Mock;
    updateOpenRouterApiKey: jest.Mock;
  };

  beforeEach(() => {
    openRouterApiKeyService = {
      getOpenRouterSettings: jest.fn(),
      updateOpenRouterApiKey: jest.fn(),
    };

    controller = new AdminSettingsController(
      openRouterApiKeyService as unknown as OpenRouterApiKeyService,
    );
  });

  it('returns masked OpenRouter settings', async () => {
    openRouterApiKeyService.getOpenRouterSettings.mockResolvedValue({
      openRouter: {
        isConfigured: true,
        maskedValue: 'sk-or-v1...cret',
        source: 'DATABASE',
        updatedAt: '2026-05-01T11:00:00.000Z',
      },
    });

    await expect(controller.getOpenRouterSettings(3)).resolves.toMatchObject({
      openRouter: {
        isConfigured: true,
        source: 'DATABASE',
      },
    });
    expect(openRouterApiKeyService.getOpenRouterSettings).toHaveBeenCalledWith(3);
  });

  it('updates OpenRouter api key', async () => {
    openRouterApiKeyService.updateOpenRouterApiKey.mockResolvedValue({
      openRouter: {
        isConfigured: true,
        maskedValue: 'sk-or-v1...cret',
        source: 'DATABASE',
        updatedAt: '2026-05-01T11:00:00.000Z',
      },
    });

    await controller.updateOpenRouterApiKey(3, {
      apiKey: 'sk-or-v1-new-secret',
    });

    expect(openRouterApiKeyService.updateOpenRouterApiKey).toHaveBeenCalledWith(
      3,
      'sk-or-v1-new-secret',
    );
  });
});
