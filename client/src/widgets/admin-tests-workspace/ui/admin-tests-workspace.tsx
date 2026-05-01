import { useEffect, useState } from 'react';

import { AdminTestsWorkspaceContent } from './admin-tests-workspace-content';
import { AdminTestsWorkspaceModals } from './admin-tests-workspace-modals';
import { useAdminTestsWorkspace } from './use-admin-tests-workspace';
import { useAdminTestsWorkspaceNavigation } from './use-admin-tests-workspace-navigation';

export function AdminTestsWorkspace() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const workspace = useAdminTestsWorkspace();

  const {
    isListRoute,
    isSettingsRoute,
    handleNavigationLeave,
    handleNavigationStay,
    handleWorkspaceNavigate,
  } = useAdminTestsWorkspaceNavigation({
    effectiveSelectedTopicId: workspace.effectiveSelectedTopicId,
    isDraftDirty: workspace.isDraftDirty,
    pendingNavigationPath: workspace.pendingNavigationPath,
    discardCurrentDraftEditsAndResetAutosave: workspace.discardCurrentDraftEditsAndResetAutosave,
    handleAttemptNavigation: workspace.handleAttemptNavigation,
    setIsNavigationConfirmOpen: workspace.setIsNavigationConfirmOpen,
    setPendingNavigationPath: workspace.setPendingNavigationPath,
  });

  useEffect(() => {
    if (isListRoute || !isCreateModalOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsCreateModalOpen(false);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isCreateModalOpen, isListRoute]);

  return (
    <>
      <div className="grid gap-4">
        <AdminTestsWorkspaceContent
          workspace={workspace}
          isListRoute={isListRoute}
          isSettingsRoute={isSettingsRoute}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onWorkspaceNavigate={handleWorkspaceNavigate}
        />
      </div>

      <AdminTestsWorkspaceModals
        workspace={workspace}
        isListRoute={isListRoute}
        isCreateModalOpen={isCreateModalOpen}
        setIsCreateModalOpen={setIsCreateModalOpen}
        onNavigationLeave={handleNavigationLeave}
        onNavigationStay={handleNavigationStay}
      />
    </>
  );
}
