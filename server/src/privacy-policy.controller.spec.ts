import { PrivacyPolicySettingsService } from './app-settings/privacy-policy-settings.service';
import { PrivacyPolicyController } from './privacy-policy.controller';

describe('PrivacyPolicyController', () => {
  it('returns current public privacy policy', async () => {
    const privacyPolicySettingsService = {
      getPublicPrivacyPolicy: jest.fn().mockResolvedValue({
        privacyPolicy: {
          version: '2026-07-09',
          publishedAt: '2026-07-09T00:00:00.000Z',
          content: 'Политика',
          updatedAt: null,
        },
      }),
    };
    const controller = new PrivacyPolicyController(
      privacyPolicySettingsService as unknown as PrivacyPolicySettingsService,
    );

    await expect(controller.getPrivacyPolicy()).resolves.toEqual({
      privacyPolicy: {
        version: '2026-07-09',
        publishedAt: '2026-07-09T00:00:00.000Z',
        content: 'Политика',
        updatedAt: null,
      },
    });
    expect(privacyPolicySettingsService.getPublicPrivacyPolicy).toHaveBeenCalledWith();
  });
});
