import { EducationOrganizationsCreateCard } from './education-organizations-create-card';
import { EducationOrganizationsEditCard } from './education-organizations-edit-card';
import { EducationOrganizationsListCard } from './education-organizations-list-card';
import { EducationOrganizationsNavigationCard } from './education-organizations-navigation-card';
import { useAdminEducationOrganizationsWorkspace } from './use-admin-education-organizations-workspace';

export function AdminEducationOrganizationsWorkspace() {
  const {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    createValues,
    editValues,
    isCreating,
    isSaving,
    updateCreateValue,
    updateEditValue,
    handleSelectOrganization,
    handleCreateOrganization,
    handleSaveOrganization,
  } = useAdminEducationOrganizationsWorkspace();

  return (
    <div className="space-y-4">
      <EducationOrganizationsNavigationCard />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <EducationOrganizationsListCard
          organizations={organizations}
          selectedOrganizationId={selectedOrganizationId}
          onSelectOrganization={handleSelectOrganization}
        />

        <div className="space-y-4">
          <EducationOrganizationsCreateCard
            newOrganizationName={createValues.name}
            onNewOrganizationNameChange={(value) => updateCreateValue('name', value)}
            newValidationMode={createValues.validationMode}
            onNewValidationModeChange={(value) => updateCreateValue('validationMode', value)}
            newValidationPattern={createValues.validationPattern}
            onNewValidationPatternChange={(value) => updateCreateValue('validationPattern', value)}
            newValidationExample={createValues.validationExample}
            onNewValidationExampleChange={(value) => updateCreateValue('validationExample', value)}
            newValidationHint={createValues.validationHint}
            onNewValidationHintChange={(value) => updateCreateValue('validationHint', value)}
            isCreating={isCreating}
            onCreate={handleCreateOrganization}
          />

          <EducationOrganizationsEditCard
            selectedOrganization={selectedOrganization}
            editName={editValues.name}
            onEditNameChange={(value) => updateEditValue('name', value)}
            editIsActive={editValues.isActive}
            onEditIsActiveChange={(value) => updateEditValue('isActive', value)}
            editValidationMode={editValues.validationMode}
            onEditValidationModeChange={(value) => updateEditValue('validationMode', value)}
            editValidationPattern={editValues.validationPattern}
            onEditValidationPatternChange={(value) => updateEditValue('validationPattern', value)}
            editValidationExample={editValues.validationExample}
            onEditValidationExampleChange={(value) => updateEditValue('validationExample', value)}
            editValidationHint={editValues.validationHint}
            onEditValidationHintChange={(value) => updateEditValue('validationHint', value)}
            isSaving={isSaving}
            onSave={handleSaveOrganization}
          />
        </div>
      </div>
    </div>
  );
}
