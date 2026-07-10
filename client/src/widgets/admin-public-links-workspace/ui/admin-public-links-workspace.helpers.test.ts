import { describe, expect, it } from 'vitest';

import { validateCreatePublicLinkInput } from './admin-public-links-workspace.helpers';

const baseInput = {
  publishedVersionId: 10,
  educationOrganizationId: 4,
  maxAttemptsRaw: '3',
  timeLimitRaw: '30',
  educationOrganizations: [{ id: 4, isActive: true, personalDataReady: true }],
};

describe('validateCreatePublicLinkInput', () => {
  it('keeps an incomplete profile organization valid for PUBLIC processing', () => {
    const result = validateCreatePublicLinkInput({
      ...baseInput,
      personalDataProcessingMode: 'PUBLIC',
      educationOrganizations: [{ id: 4, isActive: true, personalDataReady: false }],
    });

    expect(result.ok).toBe(true);
  });

  it('requires a ready active organization for on-behalf processing', () => {
    const missingOrganization = validateCreatePublicLinkInput({
      ...baseInput,
      educationOrganizationId: null,
      personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
    });
    const incompleteOrganization = validateCreatePublicLinkInput({
      ...baseInput,
      personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      educationOrganizations: [{ id: 4, isActive: true, personalDataReady: false }],
    });

    expect(missingOrganization).toEqual({
      ok: false,
      error: 'Для обработки ПДн от имени организации выберите учебное заведение',
    });
    expect(incompleteOrganization).toEqual({
      ok: false,
      error:
        'Выбранная организация не готова к обработке ПДн от своего имени. Заполните реквизиты в разделе «Учебные заведения».',
    });
  });
});
