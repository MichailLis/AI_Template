import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useAdminPublicLinksWorkspace } from './use-admin-public-links-workspace';

const { createOrganization, refetchOrganizations, idleMutation, emptyQuery } = vi.hoisted(() => ({
  createOrganization: vi.fn(),
  refetchOrganizations: vi.fn(),
  idleMutation: () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false }),
  emptyQuery: (data: unknown) => () => ({ data, refetch: vi.fn(), isLoading: false }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  useTestsControllerListTopics: emptyQuery({ topics: [] }),
  useTestsControllerGetTopicDraft: emptyQuery(undefined),
  useTestsAdminPublicLinksControllerListPublicLinks: emptyQuery({ links: [] }),
  useTestsAdminPublicLinksControllerListArchivedPublicLinks: emptyQuery({ links: [] }),
  useTestsAdminEducationOrganizationsControllerListEducationOrganizations: () => ({
    data: { organizations: [] },
    refetch: refetchOrganizations,
  }),
  useTestsAdminEducationOrganizationsControllerCreateEducationOrganization: () => ({
    mutateAsync: createOrganization,
    isPending: false,
  }),
  useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization: idleMutation,
  useTestsAdminPublicLinksControllerCreatePublicLink: idleMutation,
  useTestsAdminPublicLinksControllerDeletePublicLink: idleMutation,
  useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode: idleMutation,
  useTestsAdminPublicLinksControllerRestorePublicLink: idleMutation,
  useTestsAdminPublicLinksControllerUpdatePublicLink: idleMutation,
  useTestsAdminPublicLinksControllerMoveToActivePublishedVersion: idleMutation,
}));

describe('useAdminPublicLinksWorkspace', () => {
  it('selects the organization created from the editor sheet in the link form', async () => {
    createOrganization.mockResolvedValue({ id: 42 });
    refetchOrganizations.mockResolvedValue(undefined);
    const { result } = renderHook(() => useAdminPublicLinksWorkspace());

    expect(result.current.newEducationOrganizationId).toBeNull();

    await act(() => result.current.createEducationOrganization({ name: 'Лицей 42' }));

    expect(createOrganization).toHaveBeenCalledWith({ data: { name: 'Лицей 42' } });
    expect(refetchOrganizations).toHaveBeenCalled();
    expect(result.current.newEducationOrganizationId).toBe(42);
  });
});
