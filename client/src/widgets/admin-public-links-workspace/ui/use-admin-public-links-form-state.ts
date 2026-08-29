import { useAdminPublicLinksDraftState } from './use-admin-public-links-draft-state';
import { useAdminPublicLinksSelectionState } from './use-admin-public-links-selection-state';
import {
  useAdminPublicLinksValidationState,
  type EducationOrganizationValidationSnapshot,
} from './use-admin-public-links-validation-state';

/**
 * Composes the three independent slices of public-link form state — the draft being
 * created, the group-validation fields bound to an education organization, and the
 * list-level selection — into the single object the workspace consumes.
 */
export function useAdminPublicLinksFormState() {
  const draft = useAdminPublicLinksDraftState();
  const { applyOrganizationValidation, ...validation } = useAdminPublicLinksValidationState();
  const selection = useAdminPublicLinksSelectionState();

  const applyEducationOrganizationSelection = (
    value: number | null,
    organizations: EducationOrganizationValidationSnapshot[],
  ) => {
    draft.setNewEducationOrganizationIdState(value);
    applyOrganizationValidation(organizations.find((organization) => organization.id === value));
  };

  return {
    ...draft,
    ...validation,
    ...selection,
    applyEducationOrganizationSelection,
  };
}
