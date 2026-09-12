import { AdminSettingsController } from './admin-settings.controller';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrivacyPolicySettingsService } from '../app-settings/privacy-policy-settings.service';
import { OpenRouterApiKeyService } from '../openrouter/openrouter-api-key.service';
import { OpenRouterClientService } from '../openrouter/openrouter.client';
import { ProfOrientationAtlasService } from '../tests/prof-orientation-v3-plus/atlas';

describe('AdminSettingsController', () => {
  let controller: AdminSettingsController;
  let openRouterApiKeyService: {
    getOpenRouterSettings: jest.Mock;
    getOpenRouterApiKey: jest.Mock;
  };
  let openRouterClient: {
    checkHealth: jest.Mock;
  };
  let professionAtlasSettingsService: {
    getProfessionAtlasSettings: jest.Mock;
    updateProfessionAtlasUrl: jest.Mock;
  };
  let privacyPolicySettingsService: {
    getAdminPrivacyPolicy: jest.Mock;
    updatePrivacyPolicy: jest.Mock;
  };
  let profOrientationAtlasService: {
    buildCoverageReport: jest.Mock;
  };

  beforeEach(() => {
    openRouterApiKeyService = {
      getOpenRouterSettings: jest.fn(),
      getOpenRouterApiKey: jest.fn(),
    };
    openRouterClient = {
      checkHealth: jest.fn(),
    };
    professionAtlasSettingsService = {
      getProfessionAtlasSettings: jest.fn(),
      updateProfessionAtlasUrl: jest.fn(),
    };
    privacyPolicySettingsService = {
      getAdminPrivacyPolicy: jest.fn(),
      updatePrivacyPolicy: jest.fn(),
    };
    profOrientationAtlasService = {
      buildCoverageReport: jest.fn(),
    };

    controller = new AdminSettingsController(
      openRouterApiKeyService as unknown as OpenRouterApiKeyService,
      openRouterClient as unknown as OpenRouterClientService,
      professionAtlasSettingsService as unknown as ProfessionAtlasSettingsService,
      privacyPolicySettingsService as unknown as PrivacyPolicySettingsService,
      profOrientationAtlasService as unknown as ProfOrientationAtlasService,
    );
  });

  /**
   * Находка аудита UX-02: «OpenRouter готов» показывался по наличию ключа. Настройки должны нести
   * результат реальной проверки связи, как атлас несёт `coverage`.
   */
  it('returns masked OpenRouter settings together with a live connection check', async () => {
    openRouterApiKeyService.getOpenRouterSettings.mockResolvedValue({
      openRouter: {
        isConfigured: true,
        maskedValue: 'sk-or-v1...cret',
        source: 'ENV',
        updatedAt: null,
      },
    });
    openRouterApiKeyService.getOpenRouterApiKey.mockResolvedValue('sk-or-v1-env-secret');
    openRouterClient.checkHealth.mockResolvedValue({
      status: 'failed',
      checkedAt: '2026-09-12T20:05:00.000Z',
      errorMessage: 'User not found.',
    });

    await expect(controller.getOpenRouterSettings(3)).resolves.toEqual({
      openRouter: {
        isConfigured: true,
        maskedValue: 'sk-or-v1...cret',
        source: 'ENV',
        updatedAt: null,
        health: {
          status: 'failed',
          checkedAt: '2026-09-12T20:05:00.000Z',
          errorMessage: 'User not found.',
        },
      },
    });
    expect(openRouterApiKeyService.getOpenRouterSettings).toHaveBeenCalledWith(3);
    expect(openRouterClient.checkHealth).toHaveBeenCalledWith('sk-or-v1-env-secret');
  });

  it('does not call OpenRouter when no key is configured', async () => {
    openRouterApiKeyService.getOpenRouterSettings.mockResolvedValue({
      openRouter: {
        isConfigured: false,
        maskedValue: null,
        source: 'NONE',
        updatedAt: null,
      },
    });

    const result = await controller.getOpenRouterSettings(3);

    expect(result.openRouter.health.status).toBe('not_configured');
    expect(openRouterClient.checkHealth).not.toHaveBeenCalled();
    expect(openRouterApiKeyService.getOpenRouterApiKey).not.toHaveBeenCalled();
  });

  it('returns profession atlas settings', async () => {
    professionAtlasSettingsService.getProfessionAtlasSettings.mockResolvedValue({
      professionAtlas: {
        url: 'https://atlas.example',
        publicUrl: 'https://atlas.example',
        apiUrl: 'https://atlas.example/api-backend',
        updatedAt: '2026-05-12T10:00:00.000Z',
      },
    });
    profOrientationAtlasService.buildCoverageReport.mockResolvedValue({
      status: 'ready',
      checkedAt: '2026-05-12T12:00:00.000Z',
      total: 12,
      found: 12,
      missing: [],
      duplicates: [],
      items: [],
    });

    await expect(controller.getProfessionAtlasSettings(3)).resolves.toEqual({
      professionAtlas: {
        url: 'https://atlas.example',
        publicUrl: 'https://atlas.example',
        apiUrl: 'https://atlas.example/api-backend',
        updatedAt: '2026-05-12T10:00:00.000Z',
        coverage: {
          status: 'ready',
          checkedAt: '2026-05-12T12:00:00.000Z',
          total: 12,
          found: 12,
          missing: [],
          duplicates: [],
          items: [],
        },
      },
    });
    expect(professionAtlasSettingsService.getProfessionAtlasSettings).toHaveBeenCalledWith(3);
    expect(profOrientationAtlasService.buildCoverageReport).toHaveBeenCalledWith();
  });

  it('updates profession atlas URL', async () => {
    professionAtlasSettingsService.updateProfessionAtlasUrl.mockResolvedValue({
      professionAtlas: {
        url: 'https://atlas.example',
        publicUrl: 'https://atlas.example',
        apiUrl: 'https://atlas.example/api-backend',
        updatedAt: '2026-05-12T10:00:00.000Z',
      },
    });

    await controller.updateProfessionAtlasUrl(3, {
      publicUrl: 'https://atlas.example',
      apiUrl: 'https://atlas.example/api-backend',
    });

    expect(professionAtlasSettingsService.updateProfessionAtlasUrl).toHaveBeenCalledWith(3, {
      publicUrl: 'https://atlas.example',
      apiUrl: 'https://atlas.example/api-backend',
    });
  });

  it('returns privacy policy settings', async () => {
    privacyPolicySettingsService.getAdminPrivacyPolicy.mockResolvedValue({
      privacyPolicy: {
        version: '2026-07-09',
        publishedAt: '2026-07-09T00:00:00.000Z',
        content: 'Политика',
        operatorFullName: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
        updatedAt: null,
      },
    });

    await expect(controller.getPrivacyPolicySettings(3)).resolves.toEqual({
      privacyPolicy: {
        version: '2026-07-09',
        publishedAt: '2026-07-09T00:00:00.000Z',
        content: 'Политика',
        operatorFullName: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
        updatedAt: null,
      },
    });
    expect(privacyPolicySettingsService.getAdminPrivacyPolicy).toHaveBeenCalledWith(3);
  });

  it('updates privacy policy settings', async () => {
    const dto = {
      version: '2026-07-10',
      publishedAt: '2026-07-10T00:00:00.000Z',
      content: 'Новая политика',
      operatorFullName: 'ООО «Новый оператор»',
    };
    privacyPolicySettingsService.updatePrivacyPolicy.mockResolvedValue({
      privacyPolicy: {
        ...dto,
        updatedAt: '2026-07-10T12:00:00.000Z',
      },
    });

    await controller.updatePrivacyPolicy(3, dto);

    expect(privacyPolicySettingsService.updatePrivacyPolicy).toHaveBeenCalledWith(3, dto);
  });

  it('returns profession atlas coverage report', async () => {
    professionAtlasSettingsService.getProfessionAtlasSettings.mockResolvedValue({
      professionAtlas: {
        url: 'https://atlas.example',
      },
    });
    profOrientationAtlasService.buildCoverageReport.mockResolvedValue({
      status: 'partial',
      checkedAt: '2026-05-12T12:00:00.000Z',
      total: 12,
      found: 10,
      missing: ['Инженер данных'],
      duplicates: ['Промышленный дизайнер'],
      items: [],
    });

    await expect(controller.getProfessionAtlasCoverage(3)).resolves.toMatchObject({
      status: 'partial',
      missing: ['Инженер данных'],
      duplicates: ['Промышленный дизайнер'],
    });
    expect(professionAtlasSettingsService.getProfessionAtlasSettings).toHaveBeenCalledWith(3);
  });
});
