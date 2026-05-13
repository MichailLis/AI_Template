import { AdminSettingsController } from './admin-settings.controller';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';

describe('AdminSettingsController', () => {
  let controller: AdminSettingsController;
  let openRouterApiKeyService: {
    getOpenRouterSettings: jest.Mock;
    updateOpenRouterApiKey: jest.Mock;
  };
  let professionAtlasSettingsService: {
    getProfessionAtlasSettings: jest.Mock;
    updateProfessionAtlasUrl: jest.Mock;
  };

  beforeEach(() => {
    openRouterApiKeyService = {
      getOpenRouterSettings: jest.fn(),
      updateOpenRouterApiKey: jest.fn(),
    };
    professionAtlasSettingsService = {
      getProfessionAtlasSettings: jest.fn(),
      updateProfessionAtlasUrl: jest.fn(),
    };

    controller = new AdminSettingsController(
      openRouterApiKeyService as unknown as OpenRouterApiKeyService,
      professionAtlasSettingsService as unknown as ProfessionAtlasSettingsService,
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

  it('returns profession atlas settings', async () => {
    professionAtlasSettingsService.getProfessionAtlasSettings.mockResolvedValue({
      professionAtlas: {
        url: 'https://atlas.example/professions',
        updatedAt: '2026-05-12T10:00:00.000Z',
      },
    });

    await expect(controller.getProfessionAtlasSettings(3)).resolves.toEqual({
      professionAtlas: {
        url: 'https://atlas.example/professions',
        updatedAt: '2026-05-12T10:00:00.000Z',
      },
    });
    expect(professionAtlasSettingsService.getProfessionAtlasSettings).toHaveBeenCalledWith(3);
  });

  it('updates profession atlas URL', async () => {
    professionAtlasSettingsService.updateProfessionAtlasUrl.mockResolvedValue({
      professionAtlas: {
        url: 'https://atlas.example/professions',
        updatedAt: '2026-05-12T10:00:00.000Z',
      },
    });

    await controller.updateProfessionAtlasUrl(3, {
      url: 'https://atlas.example/professions',
    });

    expect(professionAtlasSettingsService.updateProfessionAtlasUrl).toHaveBeenCalledWith(
      3,
      'https://atlas.example/professions',
    );
  });
});
