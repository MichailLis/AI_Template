import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { CREATE_PUBLIC_LINK_DEFAULTS } from './admin-public-links-workspace.helpers';
import { useAdminPublicLinksActions } from './use-admin-public-links-actions';

import type {
  CreatePublicLinkValues,
  EducationOrganizationOption,
} from './public-link-create-card.types';
import type { PublicLinkListItem } from './public-links-list-card.helpers';
import type { ReactNode } from 'react';

const createPublicLinkMutate = vi.fn();
const updatePublicLinkMutate = vi.fn();
const moveToActiveVersionMutate = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/shared/api/generated/tests/tests', () => ({
  getTestsAdminPublicLinksControllerListPublicLinksQueryKey: () => ['public-links'],
  getTestsAdminPublicLinksControllerListArchivedPublicLinksQueryKey: () => ['archived-links'],
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
  useTestsAdminPublicLinksControllerMoveToActivePublishedVersion: () => ({
    mutate: moveToActiveVersionMutate,
    isPending: false,
  }),
}));

const readyOrganization: EducationOrganizationOption = {
  id: 4,
  name: 'Лицей 4',
  isActive: true,
  personalDataReady: true,
};

const createSelection = (pendingMovePublicLink: PublicLinkListItem | null = null) => ({
  selectedTopicId: null,
  setSelectedTopicId: vi.fn(),
  selectedPublicLinkId: null,
  setSelectedPublicLinkId: vi.fn(),
  pendingDeletePublicLinkId: null,
  setPendingDeletePublicLinkId: vi.fn(),
  pendingMovePublicLink,
  setPendingMovePublicLink: vi.fn(),
  publicLinksTab: 'active' as const,
  setPublicLinksTab: vi.fn(),
  publicLinksSearch: '',
  setPublicLinksSearch: vi.fn(),
});

const renderActions = ({
  values = {},
  educationOrganizations = [readyOrganization],
  selection = createSelection(),
}: {
  values?: Partial<CreatePublicLinkValues>;
  educationOrganizations?: EducationOrganizationOption[];
  selection?: ReturnType<typeof createSelection>;
} = {}) => {
  const queryClient = new QueryClient();
  const invalidateQueries = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => {
      const form = useForm<CreatePublicLinkValues>({
        defaultValues: { ...CREATE_PUBLIC_LINK_DEFAULTS, ...values },
      });
      return {
        form,
        actions: useAdminPublicLinksActions({
          form,
          selection,
          publishedVersionId: 10,
          educationOrganizations,
        }),
      };
    },
    { wrapper },
  );
  return { result, invalidateQueries, selection };
};

const createValues: Partial<CreatePublicLinkValues> = {
  shortCode: 'POLUS2026',
  educationOrganizationId: 4,
  publicTemplate: 'POLUS',
  entryProfileMode: 'EDUCATION',
};

describe('useAdminPublicLinksActions', () => {
  it('submits the selected public template when creating a link', async () => {
    createPublicLinkMutate.mockReset();
    const { result } = renderActions({ values: createValues });

    await act(() => result.current.actions.handleCreatePublicLink());

    expect(createPublicLinkMutate).toHaveBeenCalledWith(
      {
        data: expect.objectContaining({
          publicTemplate: 'POLUS',
          personalDataProcessingMode: 'PUBLIC',
          educationOrganizationId: 4,
          shortCode: 'POLUS2026',
          maxAttemptsPerStudent: 3,
        }),
      },
      expect.any(Object),
    );
  });

  it('resets only the short code and operator after a link is created', async () => {
    createPublicLinkMutate.mockReset();
    createPublicLinkMutate.mockImplementation(
      (_variables: unknown, options: { onSuccess: (link: { id: number }) => void }) =>
        options.onSuccess({ id: 77 }),
    );
    const { result, invalidateQueries, selection } = renderActions();
    // Как оператор в диалоге: значения меняются поверх значений по умолчанию.
    act(() => {
      const { setValue } = result.current.form;
      setValue('shortCode', 'POLUS2026');
      setValue('personalDataProcessingMode', 'ON_BEHALF_OF_EDUCATION_ORGANIZATION');
      setValue('publicTemplate', 'POLUS');
      setValue('educationOrganizationId', 4);
    });

    await act(() => result.current.actions.handleCreatePublicLink());

    expect(result.current.form.getValues()).toMatchObject({
      shortCode: '',
      personalDataProcessingMode: 'PUBLIC',
      publicTemplate: 'POLUS',
      educationOrganizationId: 4,
    });
    expect(selection.setSelectedPublicLinkId).toHaveBeenCalledWith(77);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['public-links'] });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['archived-links'] });
  });

  it('blocks an incomplete organization selected as the personal-data operator', async () => {
    createPublicLinkMutate.mockReset();
    const { result } = renderActions({
      values: {
        ...createValues,
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      },
      educationOrganizations: [{ ...readyOrganization, personalDataReady: false }],
    });

    await act(() => result.current.actions.handleCreatePublicLink());

    expect(createPublicLinkMutate).not.toHaveBeenCalled();
  });

  it('submits public branding updates for the constructor', () => {
    updatePublicLinkMutate.mockClear();
    const { result } = renderActions();

    act(() => {
      result.current.actions.handleUpdatePublicLinkBranding(42, {
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

  /** Находка аудита UX-04: действие перевода ссылки на опубликованную версию теста. */
  it('moves the confirmed link to the published version and closes the confirmation', () => {
    moveToActiveVersionMutate.mockReset();
    moveToActiveVersionMutate.mockImplementation(
      (_variables: unknown, options: { onSuccess: (link: { id: number }) => void }) =>
        options.onSuccess({ id: 61 }),
    );
    const { result, invalidateQueries, selection } = renderActions({
      selection: createSelection({ id: 61 } as PublicLinkListItem),
    });

    act(() => {
      result.current.actions.handleMovePublicLinkToActiveVersion();
    });

    expect(moveToActiveVersionMutate).toHaveBeenCalledWith({ linkId: 61 }, expect.any(Object));
    expect(selection.setPendingMovePublicLink).toHaveBeenCalledWith(null);
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ['public-links'] });
  });

  it('does nothing when no link is waiting for the move', () => {
    moveToActiveVersionMutate.mockReset();
    const { result } = renderActions();

    act(() => {
      result.current.actions.handleMovePublicLinkToActiveVersion();
    });

    expect(moveToActiveVersionMutate).not.toHaveBeenCalled();
  });
});
