import { EducationOrganizationEditorSheet } from './education-organization-editor-sheet';
import { EducationOrganizationsListCard } from './education-organizations-list-card';
import { EducationOrganizationsNavigationCard } from './education-organizations-navigation-card';
import { useAdminEducationOrganizationsWorkspace } from './use-admin-education-organizations-workspace';

export function AdminEducationOrganizationsWorkspace() {
  const {
    organizations,
    editorState,
    organizationsPage,
    organizationsTotal,
    organizationsTotalPages,
    isFetchingOrganizations,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    createOrganization,
    updateOrganization,
    handlePreviousPage,
    handleNextPage,
  } = useAdminEducationOrganizationsWorkspace();

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <EducationOrganizationsNavigationCard onCreateOrganization={openCreateEditor} />

      <EducationOrganizationsListCard
        organizations={organizations}
        page={organizationsPage}
        total={organizationsTotal}
        totalPages={organizationsTotalPages}
        isFetching={isFetchingOrganizations}
        onEditOrganization={openEditEditor}
        onPreviousPage={handlePreviousPage}
        onNextPage={handleNextPage}
      />

      {editorState !== 'closed' && editorState.mode === 'create' ? (
        <EducationOrganizationEditorSheet
          open
          mode="create"
          onClose={closeEditor}
          onSubmit={createOrganization}
        />
      ) : null}

      {editorState !== 'closed' && editorState.mode === 'edit' ? (
        <EducationOrganizationEditorSheet
          open
          mode="edit"
          organization={editorState.organization}
          onClose={closeEditor}
          onSubmit={(payload) => updateOrganization(editorState.organization.id, payload)}
        />
      ) : null}
    </div>
  );
}
