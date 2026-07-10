import { describe, expect, it } from 'vitest';

import * as helpers from './admin-education-organizations-workspace.helpers';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

const organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem = {
  id: 42,
  name: 'Лицей 42',
  fullName: 'ГБОУ «Лицей №42»',
  shortName: 'Лицей №42',
  inn: '1234567890',
  ogrn: '1234567890123',
  legalAddress: 'Казань, ул. Примерная, 42',
  email: 'office@example.com',
  phone: '+7 900 000-00-00',
  privacyPolicyUrl: 'https://example.com/privacy',
  consentDocumentUrl: 'https://example.com/consent',
  logoUrl: 'https://example.com/logo.svg',
  personalDataReady: true,
  isActive: true,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  linksCount: 3,
  activeLinksCount: 2,
  attemptsCount: 10,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
};

describe('education organization workspace helpers', () => {
  it('maps all operator fields from the server into editor values', () => {
    expect(helpers.mapOrganizationToEditorValues(organization)).toMatchObject({
      fullName: 'ГБОУ «Лицей №42»',
      shortName: 'Лицей №42',
      inn: '1234567890',
      ogrn: '1234567890123',
      legalAddress: 'Казань, ул. Примерная, 42',
      email: 'office@example.com',
      phone: '+7 900 000-00-00',
      privacyPolicyUrl: 'https://example.com/privacy',
      consentDocumentUrl: 'https://example.com/consent',
      logoUrl: 'https://example.com/logo.svg',
    });
  });

  it('serializes trimmed optional operator inputs and converts empty values to null', () => {
    const workspaceHelpers = helpers as typeof helpers & {
      normalizeOperatorFieldsPayload?: (
        values: Record<string, string>,
      ) => Record<string, string | null>;
    };

    expect(workspaceHelpers.normalizeOperatorFieldsPayload).toBeTypeOf('function');
    expect(
      workspaceHelpers.normalizeOperatorFieldsPayload?.({
        fullName: '  ГБОУ «Лицей №42»  ',
        shortName: '   ',
        inn: ' 1234567890 ',
        ogrn: '',
        legalAddress: ' Казань ',
        email: ' ',
        phone: '+7 900 000-00-00',
        privacyPolicyUrl: ' https://example.com/privacy ',
        consentDocumentUrl: '',
        logoUrl: '   ',
      }),
    ).toEqual({
      fullName: 'ГБОУ «Лицей №42»',
      shortName: null,
      inn: '1234567890',
      ogrn: null,
      legalAddress: 'Казань',
      email: null,
      phone: '+7 900 000-00-00',
      privacyPolicyUrl: 'https://example.com/privacy',
      consentDocumentUrl: null,
      logoUrl: null,
    });
  });
});
