import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

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
      <div className="flex flex-wrap gap-2" aria-label="Фильтр заведений">
        <Button
          type="button"
          size="sm"
          variant={needsPersonalDataOnly ? 'outline' : 'secondary'}
          aria-pressed={!needsPersonalDataOnly}
          onClick={() => changeNeedsPersonalDataOnly(false)}
        >
          Все заведения
        </Button>
        <Button
          type="button"
          size="sm"
          variant={needsPersonalDataOnly ? 'secondary' : 'outline'}
          aria-pressed={needsPersonalDataOnly}
          onClick={() => changeNeedsPersonalDataOnly(true)}
        >
          Требуют заполнения
        </Button>
      </div>

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
