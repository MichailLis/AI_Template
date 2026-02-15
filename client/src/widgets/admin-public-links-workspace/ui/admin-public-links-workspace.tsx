import { ConfirmActionDialog } from '@/features/tests';

import { PublicLinkCreateCard } from './public-link-create-card';
import { PublicLinksListCard } from './public-links-list-card';
import { useAdminPublicLinksWorkspace } from './use-admin-public-links-workspace';

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

const buildListCardProps = (state: AdminPublicLinksWorkspaceState) => ({
  publicLinksTab: state.publicLinksTab,
  onSwitchPublicLinksTab: state.handleSwitchPublicLinksTab,
  visiblePublicLinks: state.visiblePublicLinks,
  effectivePublicLinkId: state.effectivePublicLinkId,
  onSelectPublicLink: state.setSelectedPublicLinkId,
  onCopyShortLink: state.handleCopyShortLink,
  onOpenShortLink: state.handleOpenShortLink,
  onOpenQr: state.handleOpenShortLinkQr,
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
  const workspaceState = useAdminPublicLinksWorkspace();
  const createCardProps = buildCreateCardProps(workspaceState);
  const listCardProps = buildListCardProps(workspaceState);

  return (
    <>
      <div className="grid min-h-[calc(100vh-11rem)] gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <PublicLinkCreateCard {...createCardProps} />
        <PublicLinksListCard {...listCardProps} />
      </div>

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
