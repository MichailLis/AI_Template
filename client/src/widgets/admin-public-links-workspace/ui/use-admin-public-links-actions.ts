import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getTestsAdminPublicLinksControllerListArchivedPublicLinksQueryKey,
  getTestsAdminPublicLinksControllerListPublicLinksQueryKey,
  useTestsAdminPublicLinksControllerCreatePublicLink,
  useTestsAdminPublicLinksControllerDeletePublicLink,
  useTestsAdminPublicLinksControllerMoveToActivePublishedVersion,
  useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode,
  useTestsAdminPublicLinksControllerRestorePublicLink,
  useTestsAdminPublicLinksControllerUpdatePublicLink,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import {
  getShortLinkUrl,
  validateCreatePublicLinkInput,
} from './admin-public-links-workspace.helpers';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';
import type {
  CreatePublicLinkForm,
  CreatePublicLinkValues,
  EducationOrganizationOption,
} from './public-link-create-card.types';
import type { useAdminPublicLinksSelectionState } from './use-admin-public-links-selection-state';
import type { PublicBrandingConfig } from '@/features/tests';

type PublicLinksSelection = ReturnType<typeof useAdminPublicLinksSelectionState>;

interface UseAdminPublicLinksActionsParams {
  form: CreatePublicLinkForm;
  selection: PublicLinksSelection;
  publishedVersionId: number | undefined;
  educationOrganizations: EducationOrganizationOption[];
  onPublicLinkCreated?: () => void;
}

const showError = (error: unknown) => {
  toast.error(parseApiError(error));
};

const handleCopyShortLink = async (shortCode: string) => {
  try {
    await navigator.clipboard.writeText(getShortLinkUrl(shortCode));
    toast.success('Короткая ссылка скопирована');
  } catch {
    toast.error('Не удалось скопировать ссылку');
  }
};

const handleOpenShortLink = (shortCode: string) => {
  window.open(getShortLinkUrl(shortCode), '_blank', 'noopener,noreferrer');
};

/** Both lists change together: archiving and restoring move a link from one to the other. */
function useInvalidatePublicLinks() {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({
      queryKey: getTestsAdminPublicLinksControllerListPublicLinksQueryKey(),
    });
    void queryClient.invalidateQueries({
      queryKey: getTestsAdminPublicLinksControllerListArchivedPublicLinksQueryKey(),
    });
  };
}

function useCreatePublicLinkAction({
  form,
  selection,
  publishedVersionId,
  educationOrganizations,
  onPublicLinkCreated,
}: UseAdminPublicLinksActionsParams) {
  const createPublicLinkMutation = useTestsAdminPublicLinksControllerCreatePublicLink();
  const invalidatePublicLinks = useInvalidatePublicLinks();

  const createPublicLink = (values: CreatePublicLinkValues) => {
    const isDemographic = values.entryProfileMode === 'DEMOGRAPHIC';
    const validation = validateCreatePublicLinkInput({
      publishedVersionId,
      educationOrganizationId: values.educationOrganizationId,
      educationOrganizations,
      personalDataProcessingMode: values.personalDataProcessingMode,
      maxAttemptsRaw: isDemographic ? '1' : values.maxAttempts,
      timeLimitRaw: values.timeLimit,
    });

    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    createPublicLinkMutation.mutate(
      {
        data: {
          publishedVersionId: validation.publishedVersionId,
          educationOrganizationId: validation.educationOrganizationId,
          personalDataProcessingMode: values.personalDataProcessingMode,
          shortCode: values.shortCode.trim() || undefined,
          publicTemplate: values.publicTemplate,
          entryProfileMode: values.entryProfileMode,
          maxAttemptsPerStudent: isDemographic ? 1 : validation.maxAttemptsPerStudent,
          timeLimitMinutes: validation.timeLimitMinutes,
          allowResume: values.allowResume,
          consentVersion: values.consentVersion.trim() || 'v1',
          consentText: values.consentText.trim(),
        },
      },
      {
        onSuccess: (link) => {
          toast.success('Публичная ссылка создана');
          selection.setPublicLinksTab('active');
          selection.setSelectedPublicLinkId(link.id);
          form.setValue('shortCode', '');
          form.setValue('personalDataProcessingMode', 'PUBLIC');
          invalidatePublicLinks();
          onPublicLinkCreated?.();
        },
        onError: showError,
      },
    );
  };

  return {
    createPublicLinkMutation,
    handleCreatePublicLink: form.handleSubmit(createPublicLink),
  };
}

/**
 * Перевод ссылки на опубликованную версию теста. Ссылка сама за новой версией не следует
 * (решение ait-rcw.2), поэтому это явное действие с подтверждением.
 */
function useMovePublicLinkAction(selection: PublicLinksSelection) {
  const moveToActivePublishedVersionMutation =
    useTestsAdminPublicLinksControllerMoveToActivePublishedVersion();
  const invalidatePublicLinks = useInvalidatePublicLinks();

  const handleMovePublicLinkToActiveVersion = () => {
    const link = selection.pendingMovePublicLink;
    if (!link) {
      return;
    }

    moveToActivePublishedVersionMutation.mutate(
      { linkId: link.id },
      {
        onSuccess: () => {
          toast.success('Ссылка переведена на опубликованную версию теста');
          selection.setPendingMovePublicLink(null);
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  return { moveToActivePublishedVersionMutation, handleMovePublicLinkToActiveVersion };
}

/** Mutations of the public-links workspace; each one refreshes both link lists on success. */
export function useAdminPublicLinksActions(params: UseAdminPublicLinksActionsParams) {
  const { selection } = params;
  const createActions = useCreatePublicLinkAction(params);
  const moveActions = useMovePublicLinkAction(selection);
  const updatePublicLinkMutation = useTestsAdminPublicLinksControllerUpdatePublicLink();
  const regeneratePublicLinkShortCodeMutation =
    useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode();
  const deletePublicLinkMutation = useTestsAdminPublicLinksControllerDeletePublicLink();
  const restorePublicLinkMutation = useTestsAdminPublicLinksControllerRestorePublicLink();
  const invalidatePublicLinks = useInvalidatePublicLinks();

  const handleTogglePublicLink = (linkId: number, nextActive: boolean) => {
    updatePublicLinkMutation.mutate(
      { linkId, data: { isActive: nextActive } },
      {
        onSuccess: () => {
          toast.success(nextActive ? 'Ссылка активирована' : 'Ссылка деактивирована');
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const handleUpdatePublicLinkBranding = (linkId: number, publicBranding: PublicBrandingConfig) => {
    updatePublicLinkMutation.mutate(
      { linkId, data: { publicBranding } },
      {
        onSuccess: () => {
          toast.success(publicBranding ? 'Брендинг сохранен' : 'Брендинг сброшен');
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const handleRegeneratePublicLinkShortCode = (linkId: number) => {
    regeneratePublicLinkShortCodeMutation.mutate(
      { linkId },
      {
        onSuccess: (link) => {
          toast.success('Короткий код обновлен');
          selection.setSelectedPublicLinkId(link.id);
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const handleDeletePublicLink = () => {
    const deletingId = selection.pendingDeletePublicLinkId;
    if (!deletingId) {
      return;
    }

    deletePublicLinkMutation.mutate(
      { linkId: deletingId },
      {
        onSuccess: () => {
          toast.success('Ссылка архивирована и скрыта из списка');
          selection.setPendingDeletePublicLinkId(null);
          if (selection.selectedPublicLinkId === deletingId) {
            selection.setSelectedPublicLinkId(null);
          }
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const handleRestorePublicLink = (linkId: number) => {
    restorePublicLinkMutation.mutate(
      { linkId },
      {
        onSuccess: (link) => {
          toast.success('Ссылка восстановлена');
          selection.setPublicLinksTab('active');
          selection.setSelectedPublicLinkId(link.id);
          invalidatePublicLinks();
        },
        onError: showError,
      },
    );
  };

  const handleSwitchPublicLinksTab = (tab: PublicLinksTab) => {
    selection.setPublicLinksTab(tab);
    selection.setSelectedPublicLinkId(null);
  };

  return {
    ...createActions,
    ...moveActions,
    updatePublicLinkMutation,
    regeneratePublicLinkShortCodeMutation,
    deletePublicLinkMutation,
    restorePublicLinkMutation,
    handleTogglePublicLink,
    handleUpdatePublicLinkBranding,
    handleRegeneratePublicLinkShortCode,
    handleDeletePublicLink,
    handleRestorePublicLink,
    handleSwitchPublicLinksTab,
    handleCopyShortLink,
    handleOpenShortLink,
  };
}
