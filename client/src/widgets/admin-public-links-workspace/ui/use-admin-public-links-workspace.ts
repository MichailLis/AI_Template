import { useMemo } from 'react';

import {
  useTestsControllerGetTopicDraft,
  useTestsControllerListArchivedPublicLinks,
  useTestsControllerListEducationOrganizations,
  useTestsControllerListPublicLinks,
  useTestsControllerListTopics,
} from '@/shared/api/generated/tests/tests';

import {
  resolveEffectivePublicLinkId,
  resolveEffectiveTopicId,
} from './admin-public-links-workspace.helpers';
import { useAdminPublicLinksActions } from './use-admin-public-links-actions';
import { useAdminPublicLinksFormState } from './use-admin-public-links-form-state';

export function useAdminPublicLinksWorkspace() {
  const topicsQuery = useTestsControllerListTopics();
  const listPublicLinksQuery = useTestsControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsControllerListArchivedPublicLinks();
  const listEducationOrganizationsQuery = useTestsControllerListEducationOrganizations();
  const formState = useAdminPublicLinksFormState();

  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);
  const educationOrganizations = useMemo(
    () => listEducationOrganizationsQuery.data?.organizations ?? [],
    [listEducationOrganizationsQuery.data?.organizations],
  );
  const effectiveSelectedTopicId = useMemo(
    () => resolveEffectiveTopicId(formState.selectedTopicId, topics),
    [formState.selectedTopicId, topics],
  );

  const detailQuery = useTestsControllerGetTopicDraft(effectiveSelectedTopicId, {
    query: {
      enabled: effectiveSelectedTopicId > 0,
    },
  });

  const activePublicLinks = useMemo(
    () => listPublicLinksQuery.data?.links ?? [],
    [listPublicLinksQuery.data?.links],
  );
  const archivedPublicLinks = useMemo(
    () => listArchivedPublicLinksQuery.data?.links ?? [],
    [listArchivedPublicLinksQuery.data?.links],
  );
  const visiblePublicLinks = useMemo(
    () => (formState.publicLinksTab === 'active' ? activePublicLinks : archivedPublicLinks),
    [activePublicLinks, archivedPublicLinks, formState.publicLinksTab],
  );
  const effectivePublicLinkId = useMemo(
    () => resolveEffectivePublicLinkId(formState.selectedPublicLinkId, visiblePublicLinks),
    [formState.selectedPublicLinkId, visiblePublicLinks],
  );

  const setNewEducationOrganizationId = (value: number | null) => {
    formState.applyEducationOrganizationSelection(value, educationOrganizations);
  };

  const refetchPublicLinks = () => {
    void Promise.all([listPublicLinksQuery.refetch(), listArchivedPublicLinksQuery.refetch()]);
  };
  const refetchEducationOrganizations = () => {
    void listEducationOrganizationsQuery.refetch();
  };

  const actions = useAdminPublicLinksActions({
    publishedVersionId: detailQuery.data?.published?.id,
    newPublicShortCode: formState.newPublicShortCode,
    newEducationOrganizationId: formState.newEducationOrganizationId,
    newEducationOrganizationName: formState.newEducationOrganizationName,
    groupValidationMode: formState.groupValidationMode,
    groupValidationPattern: formState.groupValidationPattern,
    groupValidationExample: formState.groupValidationExample,
    groupValidationHint: formState.groupValidationHint,
    newPublicMaxAttempts: formState.newPublicMaxAttempts,
    newPublicTimeLimit: formState.newPublicTimeLimit,
    newPublicAllowResume: formState.newPublicAllowResume,
    newPublicConsentVersion: formState.newPublicConsentVersion,
    newPublicConsentText: formState.newPublicConsentText,
    pendingDeletePublicLinkId: formState.pendingDeletePublicLinkId,
    selectedPublicLinkId: formState.selectedPublicLinkId,
    setPublicLinksTab: formState.setPublicLinksTab,
    setSelectedPublicLinkId: formState.setSelectedPublicLinkId,
    setPendingDeletePublicLinkId: formState.setPendingDeletePublicLinkId,
    setNewPublicShortCode: formState.setNewPublicShortCode,
    setNewEducationOrganizationId,
    setNewEducationOrganizationName: formState.setNewEducationOrganizationName,
    setGroupValidationMode: formState.setGroupValidationMode,
    setGroupValidationPattern: formState.setGroupValidationPattern,
    setGroupValidationExample: formState.setGroupValidationExample,
    setGroupValidationHint: formState.setGroupValidationHint,
    refetchPublicLinks,
    refetchEducationOrganizations,
  });

  return {
    topics,
    educationOrganizations,
    effectiveSelectedTopicId,
    detailQuery,
    visiblePublicLinks,
    effectivePublicLinkId,
    ...formState,
    ...actions,
    setNewEducationOrganizationId,
  };
}
