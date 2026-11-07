import { toast } from 'sonner';

import { useCreatePublicLink, usePublicLinkActions } from '@/features/manage-public-link';

import { getShortLinkUrl } from '../lib/admin-public-links-workspace.helpers';

import type {
  CreatePublicLinkForm,
  EducationOrganizationOption,
} from './public-link-create-card.types';
import type { useAdminPublicLinksSelectionState } from './use-admin-public-links-selection-state';
import type { PublicLinksTab } from '../lib/admin-public-links-workspace.helpers';
import type { CreatePublicLinkValues } from '@/features/manage-public-link';

type PublicLinksSelection = ReturnType<typeof useAdminPublicLinksSelectionState>;

interface UseAdminPublicLinksActionsParams {
  form: CreatePublicLinkForm;
  selection: PublicLinksSelection;
  publishedVersionId: number | undefined;
  educationOrganizations: EducationOrganizationOption[];
  onPublicLinkCreated?: () => void;
}

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

/** Сценарии ссылки живут в features/manage-public-link; здесь они связаны с выбором и формой экрана. */
export function useAdminPublicLinksActions({
  form,
  selection,
  publishedVersionId,
  educationOrganizations,
  onPublicLinkCreated,
}: UseAdminPublicLinksActionsParams) {
  const { createPublicLink, createPublicLinkMutation } = useCreatePublicLink({
    publishedVersionId,
    educationOrganizations,
  });
  const actions = usePublicLinkActions();

  const handleCreatePublicLink = form.handleSubmit((values: CreatePublicLinkValues) =>
    createPublicLink(values, (link) => {
      selection.setPublicLinksTab('active');
      selection.setSelectedPublicLinkId(link.id);
      form.setValue('shortCode', '');
      form.setValue('personalDataProcessingMode', 'PUBLIC');
      onPublicLinkCreated?.();
    }),
  );

  const handleMovePublicLinkToActiveVersion = () => {
    const link = selection.pendingMovePublicLink;
    if (!link) {
      return;
    }

    actions.moveToActivePublishedVersion(link.id, () => selection.setPendingMovePublicLink(null));
  };

  const handleRegeneratePublicLinkShortCode = (linkId: number) => {
    actions.regeneratePublicLinkShortCode(linkId, (link) =>
      selection.setSelectedPublicLinkId(link.id),
    );
  };

  const handleDeletePublicLink = () => {
    const deletingId = selection.pendingDeletePublicLinkId;
    if (!deletingId) {
      return;
    }

    actions.archivePublicLink(deletingId, () => {
      selection.setPendingDeletePublicLinkId(null);
      if (selection.selectedPublicLinkId === deletingId) {
        selection.setSelectedPublicLinkId(null);
      }
    });
  };

  const handleRestorePublicLink = (linkId: number) => {
    actions.restorePublicLink(linkId, (link) => {
      selection.setPublicLinksTab('active');
      selection.setSelectedPublicLinkId(link.id);
    });
  };

  const handleSwitchPublicLinksTab = (tab: PublicLinksTab) => {
    selection.setPublicLinksTab(tab);
    selection.setSelectedPublicLinkId(null);
  };

  return {
    createPublicLinkMutation,
    isUpdatingPublicLink: actions.isUpdatingPublicLink,
    isRegeneratingShortCode: actions.isRegeneratingShortCode,
    isArchivingPublicLink: actions.isArchivingPublicLink,
    isRestoringPublicLink: actions.isRestoringPublicLink,
    isMovingToActiveVersion: actions.isMovingToActiveVersion,
    handleCreatePublicLink,
    handleMovePublicLinkToActiveVersion,
    handleTogglePublicLink: actions.togglePublicLink,
    handleUpdatePublicLinkBranding: actions.updatePublicLinkBranding,
    handleRegeneratePublicLinkShortCode,
    handleDeletePublicLink,
    handleRestorePublicLink,
    handleSwitchPublicLinksTab,
    handleCopyShortLink,
    handleOpenShortLink,
  };
}
