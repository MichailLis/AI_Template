import { toast } from 'sonner';

import { parseApiError } from '@/features/tests';
import {
  useTestsAdminPublicLinksControllerCreatePublicLink,
  useTestsAdminPublicLinksControllerDeletePublicLink,
  useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode,
  useTestsAdminPublicLinksControllerRestorePublicLink,
  useTestsAdminPublicLinksControllerUpdatePublicLink,
} from '@/shared/api/generated/tests/tests';

import {
  getShortLinkQrUrl,
  getShortLinkUrl,
  validateCreatePublicLinkInput,
} from './admin-public-links-workspace.helpers';
import { useEducationOrganizationActions } from './use-admin-public-links-organization-actions';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';
import type { UseAdminPublicLinksActionsParams } from './use-admin-public-links-actions.types';

function usePublicLinkCreateActions(params: UseAdminPublicLinksActionsParams) {
  const {
    publishedVersionId,
    newPublicShortCode,
    newEducationOrganizationId,
    newPublicTemplate,
    newPublicEntryProfileMode,
    newPublicMaxAttempts,
    newPublicTimeLimit,
    newPublicAllowResume,
    newPublicConsentVersion,
    newPublicConsentText,
    setPublicLinksTab,
    setSelectedPublicLinkId,
    setNewPublicShortCode,
    refetchPublicLinks,
    onPublicLinkCreated,
  } = params;

  const createPublicLinkMutation = useTestsAdminPublicLinksControllerCreatePublicLink();

  const handleCreatePublicLink = () => {
    const validation = validateCreatePublicLinkInput({
      publishedVersionId,
      educationOrganizationId: newEducationOrganizationId,
      maxAttemptsRaw: newPublicEntryProfileMode === 'DEMOGRAPHIC' ? '1' : newPublicMaxAttempts,
      timeLimitRaw: newPublicTimeLimit,
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
          shortCode: newPublicShortCode.trim() || undefined,
          publicTemplate: newPublicTemplate,
          entryProfileMode: newPublicEntryProfileMode,
          maxAttemptsPerStudent:
            newPublicEntryProfileMode === 'DEMOGRAPHIC' ? 1 : validation.maxAttemptsPerStudent,
          timeLimitMinutes: validation.timeLimitMinutes,
          allowResume: newPublicAllowResume,
          consentVersion: newPublicConsentVersion.trim() || 'v1',
          consentText: newPublicConsentText.trim(),
        },
      },
      {
        onSuccess: (link) => {
          toast.success('Публичная ссылка создана');
          setPublicLinksTab('active');
          setSelectedPublicLinkId(link.id);
          setNewPublicShortCode('');
          refetchPublicLinks();
          onPublicLinkCreated?.();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  return {
    createPublicLinkMutation,
    handleCreatePublicLink,
  };
}

function usePublicLinkManagementActions(params: UseAdminPublicLinksActionsParams) {
  const {
    pendingDeletePublicLinkId,
    selectedPublicLinkId,
    setPublicLinksTab,
    setSelectedPublicLinkId,
    setPendingDeletePublicLinkId,
    refetchPublicLinks,
  } = params;

  const updatePublicLinkMutation = useTestsAdminPublicLinksControllerUpdatePublicLink();
  const regeneratePublicLinkShortCodeMutation =
    useTestsAdminPublicLinksControllerRegeneratePublicLinkShortCode();
  const deletePublicLinkMutation = useTestsAdminPublicLinksControllerDeletePublicLink();
  const restorePublicLinkMutation = useTestsAdminPublicLinksControllerRestorePublicLink();

  const handleTogglePublicLink = (linkId: number, nextActive: boolean) => {
    updatePublicLinkMutation.mutate(
      {
        linkId,
        data: {
          isActive: nextActive,
        },
      },
      {
        onSuccess: () => {
          toast.success(nextActive ? 'Ссылка активирована' : 'Ссылка деактивирована');
          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleRegeneratePublicLinkShortCode = (linkId: number) => {
    regeneratePublicLinkShortCodeMutation.mutate(
      { linkId },
      {
        onSuccess: (link) => {
          toast.success('Короткий код обновлен');
          setSelectedPublicLinkId(link.id);
          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleDeletePublicLink = () => {
    if (!pendingDeletePublicLinkId) {
      return;
    }

    const deletingId = pendingDeletePublicLinkId;

    deletePublicLinkMutation.mutate(
      { linkId: deletingId },
      {
        onSuccess: () => {
          toast.success('Ссылка архивирована и скрыта из списка');
          setPendingDeletePublicLinkId(null);

          if (selectedPublicLinkId === deletingId) {
            setSelectedPublicLinkId(null);
          }

          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleRestorePublicLink = (linkId: number) => {
    restorePublicLinkMutation.mutate(
      { linkId },
      {
        onSuccess: (link) => {
          toast.success('Ссылка восстановлена');
          setPublicLinksTab('active');
          setSelectedPublicLinkId(link.id);
          refetchPublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleSwitchPublicLinksTab = (tab: PublicLinksTab) => {
    setPublicLinksTab(tab);
    setSelectedPublicLinkId(null);
  };

  return {
    updatePublicLinkMutation,
    regeneratePublicLinkShortCodeMutation,
    deletePublicLinkMutation,
    restorePublicLinkMutation,
    handleTogglePublicLink,
    handleRegeneratePublicLinkShortCode,
    handleDeletePublicLink,
    handleRestorePublicLink,
    handleSwitchPublicLinksTab,
  };
}

function useShortLinkActions() {
  const handleCopyShortLink = async (shortCode: string) => {
    try {
      await navigator.clipboard.writeText(getShortLinkUrl(shortCode));
      toast.success('Короткая ссылка скопирована');
    } catch {
      toast.error('Не удалось скопировать ссылку');
    }
  };

  const handleOpenShortLinkQr = (shortCode: string) => {
    window.open(getShortLinkQrUrl(shortCode), '_blank', 'noopener,noreferrer');
  };

  const handleOpenShortLink = (shortCode: string) => {
    window.open(getShortLinkUrl(shortCode), '_blank', 'noopener,noreferrer');
  };

  return {
    handleCopyShortLink,
    handleOpenShortLink,
    handleOpenShortLinkQr,
  };
}

export function useAdminPublicLinksActions(params: UseAdminPublicLinksActionsParams) {
  const organizationActions = useEducationOrganizationActions(params);
  const publicLinkCreateActions = usePublicLinkCreateActions(params);
  const publicLinkManagementActions = usePublicLinkManagementActions(params);
  const shortLinkActions = useShortLinkActions();

  return {
    ...organizationActions,
    ...publicLinkCreateActions,
    ...publicLinkManagementActions,
    ...shortLinkActions,
  };
}
