import { ConfirmActionDialog } from '@/features/tests';

import { PublicLinkCreateCard } from './public-link-create-card';
import { PublicLinksListCard } from './public-links-list-card';
import { useAdminPublicLinksWorkspace } from './use-admin-public-links-workspace';

export function AdminPublicLinksWorkspace() {
  const {
    topics,
    effectiveSelectedTopicId,
    detailQuery,
    newPublicShortCode,
    newPublicMaxAttempts,
    newPublicTimeLimit,
    newPublicAllowResume,
    newPublicConsentVersion,
    newPublicConsentText,
    pendingDeletePublicLinkId,
    publicLinksTab,
    visiblePublicLinks,
    effectivePublicLinkId,
    createPublicLinkMutation,
    updatePublicLinkMutation,
    regeneratePublicLinkShortCodeMutation,
    deletePublicLinkMutation,
    restorePublicLinkMutation,
    setSelectedTopicId,
    setNewPublicShortCode,
    setNewPublicMaxAttempts,
    setNewPublicTimeLimit,
    setNewPublicAllowResume,
    setNewPublicConsentVersion,
    setNewPublicConsentText,
    setSelectedPublicLinkId,
    setPendingDeletePublicLinkId,
    handleCreatePublicLink,
    handleSwitchPublicLinksTab,
    handleCopyShortLink,
    handleOpenShortLinkQr,
    handleTogglePublicLink,
    handleRegeneratePublicLinkShortCode,
    handleDeletePublicLink,
    handleRestorePublicLink,
  } = useAdminPublicLinksWorkspace();

  return (
    <>
      <div className="grid min-h-[calc(100vh-11rem)] gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <PublicLinkCreateCard
          topics={topics}
          effectiveSelectedTopicId={effectiveSelectedTopicId}
          onSelectTopic={setSelectedTopicId}
          newPublicShortCode={newPublicShortCode}
          onShortCodeChange={setNewPublicShortCode}
          newPublicMaxAttempts={newPublicMaxAttempts}
          onMaxAttemptsChange={setNewPublicMaxAttempts}
          newPublicTimeLimit={newPublicTimeLimit}
          onTimeLimitChange={setNewPublicTimeLimit}
          newPublicConsentVersion={newPublicConsentVersion}
          onConsentVersionChange={setNewPublicConsentVersion}
          newPublicConsentText={newPublicConsentText}
          onConsentTextChange={setNewPublicConsentText}
          newPublicAllowResume={newPublicAllowResume}
          onAllowResumeChange={setNewPublicAllowResume}
          onCreatePublicLink={handleCreatePublicLink}
          isCreatingPublicLink={createPublicLinkMutation.isPending}
          hasPublishedVersion={Boolean(detailQuery.data?.published?.id)}
        />

        <PublicLinksListCard
          publicLinksTab={publicLinksTab}
          onSwitchPublicLinksTab={handleSwitchPublicLinksTab}
          visiblePublicLinks={visiblePublicLinks}
          effectivePublicLinkId={effectivePublicLinkId}
          onSelectPublicLink={setSelectedPublicLinkId}
          onCopyShortLink={handleCopyShortLink}
          onOpenQr={handleOpenShortLinkQr}
          onTogglePublicLink={handleTogglePublicLink}
          onRegenerateShortCode={handleRegeneratePublicLinkShortCode}
          onArchivePublicLink={setPendingDeletePublicLinkId}
          onRestorePublicLink={handleRestorePublicLink}
          isUpdatingPublicLink={updatePublicLinkMutation.isPending}
          isRegeneratingShortCode={regeneratePublicLinkShortCodeMutation.isPending}
          isArchivingPublicLink={deletePublicLinkMutation.isPending}
          isRestoringPublicLink={restorePublicLinkMutation.isPending}
        />
      </div>

      <ConfirmActionDialog
        open={Boolean(pendingDeletePublicLinkId)}
        title="Архивировать публичную ссылку?"
        description="Ссылка станет недоступной и исчезнет из списка. Данные попыток сохранятся."
        confirmLabel="Архивировать"
        variant="destructive"
        isConfirming={deletePublicLinkMutation.isPending}
        onConfirm={handleDeletePublicLink}
        onClose={() => setPendingDeletePublicLinkId(null)}
      />
    </>
  );
}
