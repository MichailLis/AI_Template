import { useAdminPublicLinksDraftState } from './use-admin-public-links-draft-state';
import { useAdminPublicLinksSelectionState } from './use-admin-public-links-selection-state';

/**
 * Composes the two independent slices of public-link form state — the draft being
 * created and the list-level selection — into the single object the workspace consumes.
 */
export function useAdminPublicLinksFormState() {
  return {
    ...useAdminPublicLinksDraftState(),
    ...useAdminPublicLinksSelectionState(),
  };
}
