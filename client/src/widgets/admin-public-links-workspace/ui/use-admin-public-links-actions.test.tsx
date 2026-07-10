import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAdminPublicLinksActions } from './use-admin-public-links-actions';

import type { UseAdminPublicLinksActionsParams } from './use-admin-public-links-actions.types';

const createPublicLinkMutate = vi.fn();
const updatePublicLinkMutate = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/features/tests', () => ({
  parseApiError: () => 'Ошибка API',
}));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  useTestsAdminEducationOrganizationsControllerCreateEducationOrganization: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useTestsAdminPublicLinksControllerCreatePublicLink: () => ({
    mutate: createPublicLinkMutate,
    isPending: false,
  }),
  useTestsAdminPublicLinksControllerDeletePublicLink: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useTestsAdminPublicLinksControllerRestorePublicLink: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useTestsAdminPublicLinksControllerUpdatePublicLink: () => ({
    mutate: updatePublicLinkMutate,
    isPending: false,
  }),
}));

const createParams = (
  overrides: Partial<UseAdminPublicLinksActionsParams> = {},
): UseAdminPublicLinksActionsParams =>
  ({
    publishedVersionId: 10,
    newPublicShortCode: 'POLUS2026',
    newEducationOrganizationId: 4,
    educationOrganizations: [{ id: 4, name: 'Лицей 4', isActive: true, personalDataReady: true }],
    newPersonalDataProcessingMode: 'PUBLIC',
    newEducationOrganizationName: '',
    groupValidationMode: 'NONE',
    groupValidationPattern: '',
    groupValidationExample: '',
    groupValidationHint: '',
    newPublicTemplate: 'POLUS',
    newPublicEntryProfileMode: 'EDUCATION',
    newPublicMaxAttempts: '3',
    newPublicTimeLimit: '30',
    newPublicAllowResume: true,
    newPublicConsentVersion: 'v1',
    newPublicConsentText: 'Согласие',
    pendingDeletePublicLinkId: null,
    selectedPublicLinkId: null,
    setPublicLinksTab: vi.fn(),
    setSelectedPublicLinkId: vi.fn(),
    setPendingDeletePublicLinkId: vi.fn(),
    setNewPublicShortCode: vi.fn(),
    setNewPersonalDataProcessingMode: vi.fn(),
    setNewEducationOrganizationId: vi.fn(),
    setNewEducationOrganizationName: vi.fn(),
    setGroupValidationMode: vi.fn(),
    setGroupValidationPattern: vi.fn(),
    setGroupValidationExample: vi.fn(),
    setGroupValidationHint: vi.fn(),
    refetchPublicLinks: vi.fn(),
    refetchEducationOrganizations: vi.fn(),
    ...overrides,
  }) as UseAdminPublicLinksActionsParams;

describe('useAdminPublicLinksActions', () => {
  it('submits the selected public template when creating a link', () => {
    createPublicLinkMutate.mockClear();
    const { result } = renderHook(() => useAdminPublicLinksActions(createParams()));

    act(() => {
      result.current.handleCreatePublicLink();
    });

    expect(createPublicLinkMutate).toHaveBeenCalledWith(
      {
        data: expect.objectContaining({
          publicTemplate: 'POLUS',
          personalDataProcessingMode: 'PUBLIC',
          educationOrganizationId: 4,
        }),
      },
      expect.any(Object),
    );
  });

  it('blocks an incomplete organization selected as the personal-data operator', () => {
    createPublicLinkMutate.mockClear();
    const { result } = renderHook(() =>
      useAdminPublicLinksActions(
        createParams({
          newPersonalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
          educationOrganizations: [
            { id: 4, name: 'Лицей 4', isActive: true, personalDataReady: false },
          ],
        }),
      ),
    );

    act(() => {
      result.current.handleCreatePublicLink();
    });

    expect(createPublicLinkMutate).not.toHaveBeenCalled();
  });

  it('submits public branding updates for the constructor', () => {
    updatePublicLinkMutate.mockClear();
    const { result } = renderHook(() => useAdminPublicLinksActions(createParams()));

    act(() => {
      result.current.handleUpdatePublicLinkBranding(42, {
        version: 1,
        buttons: { primaryColor: '#0066cc' },
      });
    });

    expect(updatePublicLinkMutate).toHaveBeenCalledWith(
      {
        linkId: 42,
        data: {
          publicBranding: {
            version: 1,
            buttons: { primaryColor: '#0066cc' },
          },
        },
      },
      expect.any(Object),
    );
  });
});
