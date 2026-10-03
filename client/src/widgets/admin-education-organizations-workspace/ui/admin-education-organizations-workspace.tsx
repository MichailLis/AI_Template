import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminTabs } from '@/shared/ui/admin-tabs';

import { EducationOrganizationEditorSheet } from './education-organization-editor-sheet';
import { EducationOrganizationsListCard } from './education-organizations-list-card';
import { EducationOrganizationsNavigationCard } from './education-organizations-navigation-card';
import { useAdminEducationOrganizationsWorkspace } from './use-admin-education-organizations-workspace';

export function AdminEducationOrganizationsWorkspace() {
  const {
    organizations,
    needsPersonalDataOnly,
    changeNeedsPersonalDataOnly,
    editorState,
    organizationsPage,
    organizationsTotal,
    organizationsTotalPages,
    isFetchingOrganizations,
    isOrganizationsError,
    retryOrganizations,
    openCreateEditor,
    openEditEditor,
    closeEditor,
    createOrganization,
    updateOrganization,
    handlePreviousPage,
    handleNextPage,
  } = useAdminEducationOrganizationsWorkspace();

  return (
    <div className={`min-w-0 ${adminClassNames.layout.page}`}>
      <EducationOrganizationsNavigationCard onCreateOrganization={openCreateEditor} />

      {/* Незаполненные реквизиты встречаются у многих заведений; фильтр отбирает их на сервере,
          чтобы не листать страницы. */}
      <AdminTabs
        ariaLabel="Фильтр заведений"
        tabs={[
          { value: 'all', label: 'Все заведения' },
          { value: 'needs-data', label: 'Требуют заполнения' },
        ]}
        activeTab={needsPersonalDataOnly ? 'needs-data' : 'all'}
        onTabChange={(tab) => changeNeedsPersonalDataOnly(tab === 'needs-data')}
      />

      <EducationOrganizationsListCard
        organizations={organizations}
        page={organizationsPage}
        total={organizationsTotal}
        totalPages={organizationsTotalPages}
        isFetching={isFetchingOrganizations}
        isError={isOrganizationsError}
        onRetry={retryOrganizations}
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
