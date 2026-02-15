import { toast } from 'sonner';

import { parseApiError } from '@/features/tests';
import {
  useTestsControllerCreatePublicLink,
  useTestsControllerDeletePublicLink,
  useTestsControllerRegeneratePublicLinkShortCode,
  useTestsControllerRestorePublicLink,
  useTestsControllerUpdatePublicLink,
} from '@/shared/api/generated/tests/tests';

import {
  getShortLinkQrUrl,
  getShortLinkUrl,
  type PublicLinksTab,
  validateCreatePublicLinkInput,
} from './admin-public-links-workspace.helpers';

type CreatePublicLinkMutation = ReturnType<typeof useTestsControllerCreatePublicLink>;
type UpdatePublicLinkMutation = ReturnType<typeof useTestsControllerUpdatePublicLink>;
type RegenerateShortCodeMutation = ReturnType<
  typeof useTestsControllerRegeneratePublicLinkShortCode
>;
type DeletePublicLinkMutation = ReturnType<typeof useTestsControllerDeletePublicLink>;
type RestorePublicLinkMutation = ReturnType<typeof useTestsControllerRestorePublicLink>;

interface UseAdminPublicLinksActionsParams {
  publishedVersionId: number | undefined;
  newPublicShortCode: string;
  newPublicMaxAttempts: string;
  newPublicTimeLimit: string;
  newPublicAllowResume: boolean;
  newPublicConsentVersion: string;
  newPublicConsentText: string;
  pendingDeletePublicLinkId: number | null;
  selectedPublicLinkId: number | null;
  createPublicLinkMutation: CreatePublicLinkMutation;
  updatePublicLinkMutation: UpdatePublicLinkMutation;
  regeneratePublicLinkShortCodeMutation: RegenerateShortCodeMutation;
  deletePublicLinkMutation: DeletePublicLinkMutation;
  restorePublicLinkMutation: RestorePublicLinkMutation;
  setPublicLinksTab: (tab: PublicLinksTab) => void;
  setSelectedPublicLinkId: (value: number | null) => void;
  setPendingDeletePublicLinkId: (value: number | null) => void;
  setNewPublicShortCode: (value: string) => void;
  refetchPublicLinks: () => void;
}

export function useAdminPublicLinksActions({
  publishedVersionId,
  newPublicShortCode,
  newPublicMaxAttempts,
  newPublicTimeLimit,
  newPublicAllowResume,
  newPublicConsentVersion,
  newPublicConsentText,
  pendingDeletePublicLinkId,
  selectedPublicLinkId,
  createPublicLinkMutation,
  updatePublicLinkMutation,
  regeneratePublicLinkShortCodeMutation,
  deletePublicLinkMutation,
  restorePublicLinkMutation,
  setPublicLinksTab,
  setSelectedPublicLinkId,
  setPendingDeletePublicLinkId,
  setNewPublicShortCode,
  refetchPublicLinks,
}: UseAdminPublicLinksActionsParams) {
  const handleCreatePublicLink = () => {
    const validation = validateCreatePublicLinkInput({
      publishedVersionId,
      maxAttemptsRaw: newPublicMaxAttempts,
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
          shortCode: newPublicShortCode.trim() || undefined,
          maxAttemptsPerStudent: validation.maxAttemptsPerStudent,
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
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

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
      {
        linkId,
      },
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
      {
        linkId: deletingId,
      },
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
      {
        linkId,
      },
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

  return {
    handleCreatePublicLink,
    handleTogglePublicLink,
    handleRegeneratePublicLinkShortCode,
    handleDeletePublicLink,
    handleRestorePublicLink,
    handleSwitchPublicLinksTab,
    handleCopyShortLink,
    handleOpenShortLinkQr,
  };
}
