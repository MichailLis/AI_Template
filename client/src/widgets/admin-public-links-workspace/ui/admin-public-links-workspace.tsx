import { useState } from 'react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Card } from '@/shared/ui/card';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';

import { PublicLinkBrandingBuilder } from './public-link-branding-builder';
import { PublicLinkCreateDialog } from './public-link-create-card';
import { PublicLinksListCard } from './public-links-list-card';
import { PublicLinksListHeader } from './public-links-list-header';
import { useAdminPublicLinksWorkspace } from './use-admin-public-links-workspace';

import type { PublicLinkListItem } from './public-links-list-card.helpers';

type AdminPublicLinksWorkspaceState = ReturnType<typeof useAdminPublicLinksWorkspace>;

const buildCreateCardProps = (state: AdminPublicLinksWorkspaceState) => ({
  topics: state.topics,
  educationOrganizations: state.educationOrganizations,
  effectiveSelectedTopicId: state.effectiveSelectedTopicId,
  onSelectTopic: state.setSelectedTopicId,
  newEducationOrganizationId: state.newEducationOrganizationId,
  onEducationOrganizationSelect: state.setNewEducationOrganizationId,
  newEducationOrganizationName: state.newEducationOrganizationName,
  onEducationOrganizationNameChange: state.setNewEducationOrganizationName,
  groupValidationMode: state.groupValidationMode,
  onGroupValidationModeChange: state.setGroupValidationMode,
  groupValidationPattern: state.groupValidationPattern,
  onGroupValidationPatternChange: state.setGroupValidationPattern,
  groupValidationExample: state.groupValidationExample,
  onGroupValidationExampleChange: state.setGroupValidationExample,
  groupValidationHint: state.groupValidationHint,
  onGroupValidationHintChange: state.setGroupValidationHint,
  onCreateEducationOrganization: state.handleCreateEducationOrganization,
  onUpdateEducationOrganization: state.handleUpdateEducationOrganization,
  isCreatingEducationOrganization: state.createEducationOrganizationMutation.isPending,
  isUpdatingEducationOrganization: state.updateEducationOrganizationMutation.isPending,
  newPublicShortCode: state.newPublicShortCode,
  onShortCodeChange: state.setNewPublicShortCode,
  newPublicTemplate: state.newPublicTemplate,
  onPublicTemplateChange: state.setNewPublicTemplate,
  newPublicEntryProfileMode: state.newPublicEntryProfileMode,
  onEntryProfileModeChange: state.setNewPublicEntryProfileMode,
  newPublicMaxAttempts: state.newPublicMaxAttempts,
  onMaxAttemptsChange: state.setNewPublicMaxAttempts,
  newPublicTimeLimit: state.newPublicTimeLimit,
  onTimeLimitChange: state.setNewPublicTimeLimit,
  newPublicConsentVersion: state.newPublicConsentVersion,
  onConsentVersionChange: state.setNewPublicConsentVersion,
  newPublicConsentText: state.newPublicConsentText,
  onConsentTextChange: state.setNewPublicConsentText,
  newPublicAllowResume: state.newPublicAllowResume,
  onAllowResumeChange: state.setNewPublicAllowResume,
  onCreatePublicLink: state.handleCreatePublicLink,
  isCreatingPublicLink: state.createPublicLinkMutation.isPending,
  hasPublishedVersion: Boolean(state.detailQuery.data?.published?.id),
});

const buildListCardProps = (
  state: AdminPublicLinksWorkspaceState,
  onOpenBrandingBuilder: (link: PublicLinkListItem) => void,
) => ({
  publicLinksTab: state.publicLinksTab,
  visiblePublicLinks: state.visiblePublicLinks,
  publicLinksLoading: state.publicLinksLoading,
  publicLinksError: state.publicLinksError,
  searchValue: state.publicLinksSearch,
  onRetryPublicLinks: state.refetchPublicLinks,
  onCopyShortLink: state.handleCopyShortLink,
  onOpenShortLink: state.handleOpenShortLink,
  onOpenQr: state.handleOpenShortLinkQr,
  onOpenBrandingBuilder,
  onTogglePublicLink: state.handleTogglePublicLink,
  onRegenerateShortCode: state.handleRegeneratePublicLinkShortCode,
  onArchivePublicLink: state.setPendingDeletePublicLinkId,
  onRestorePublicLink: state.handleRestorePublicLink,
  isUpdatingPublicLink: state.updatePublicLinkMutation.isPending,
  isRegeneratingShortCode: state.regeneratePublicLinkShortCodeMutation.isPending,
  isArchivingPublicLink: state.deletePublicLinkMutation.isPending,
  isRestoringPublicLink: state.restorePublicLinkMutation.isPending,
});

export function AdminPublicLinksWorkspace() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [brandingBuilderLink, setBrandingBuilderLink] = useState<PublicLinkListItem | null>(null);
  const workspaceState = useAdminPublicLinksWorkspace({
    onPublicLinkCreated: () => setIsCreateDialogOpen(false),
  });
  const createCardProps = buildCreateCardProps(workspaceState);
  const listCardProps = buildListCardProps(workspaceState, setBrandingBuilderLink);

  return (
    <>
      <Card className={adminClassNames.panel.card}>
        <PublicLinksListHeader
          publicLinksTab={workspaceState.publicLinksTab}
          searchValue={workspaceState.publicLinksSearch}
          onSwitchPublicLinksTab={workspaceState.handleSwitchPublicLinksTab}
          onSearchChange={workspaceState.setPublicLinksSearch}
          onOpenCreateDialog={() => setIsCreateDialogOpen(true)}
        />
        <PublicLinksListCard {...listCardProps} />
      </Card>

      <PublicLinkCreateDialog
        {...createCardProps}
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <PublicLinkBrandingBuilder
        open={Boolean(brandingBuilderLink)}
        link={brandingBuilderLink}
        isSaving={workspaceState.updatePublicLinkMutation.isPending}
        onOpenChange={(open) => {
          if (!open) {
            setBrandingBuilderLink(null);
          }
        }}
        onSave={workspaceState.handleUpdatePublicLinkBranding}
      />

      <ConfirmActionDialog
        open={Boolean(workspaceState.pendingDeletePublicLinkId)}
        title="Архивировать публичную ссылку?"
        description="Ссылка станет недоступной и исчезнет из списка. Данные попыток сохранятся."
        confirmLabel="Архивировать"
        variant="destructive"
        isConfirming={workspaceState.deletePublicLinkMutation.isPending}
        onConfirm={workspaceState.handleDeletePublicLink}
        onClose={() => workspaceState.setPendingDeletePublicLinkId(null)}
      />
    </>
  );
}
