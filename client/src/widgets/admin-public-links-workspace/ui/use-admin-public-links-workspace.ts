import { useMemo } from 'react';
import { toast } from 'sonner';

import {
  useTestsAdminEducationOrganizationsControllerCreateEducationOrganization,
  useTestsAdminEducationOrganizationsControllerListEducationOrganizations,
  useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization,
  useTestsAdminPublicLinksControllerListArchivedPublicLinks,
  useTestsAdminPublicLinksControllerListPublicLinks,
  useTestsControllerGetTopicDraft,
  useTestsControllerListTopics,
} from '@/shared/api/generated/tests/tests';

import {
  resolveEffectivePublicLinkId,
  resolveEffectiveTopicId,
} from './admin-public-links-workspace.helpers';
import { useAdminPublicLinksActions } from './use-admin-public-links-actions';
import { useAdminPublicLinksFormState } from './use-admin-public-links-form-state';

import type {
  AdminCreateEducationOrganizationDto,
  AdminUpdateEducationOrganizationDto,
} from '@/shared/api/model';

interface UseAdminPublicLinksWorkspaceParams {
  onPublicLinkCreated?: () => void;
}

export function useAdminPublicLinksWorkspace({
  onPublicLinkCreated,
}: UseAdminPublicLinksWorkspaceParams = {}) {
  const topicsQuery = useTestsControllerListTopics();
  const listPublicLinksQuery = useTestsAdminPublicLinksControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsAdminPublicLinksControllerListArchivedPublicLinks();
  const listEducationOrganizationsQuery =
    useTestsAdminEducationOrganizationsControllerListEducationOrganizations();
  const createEducationOrganizationMutation =
    useTestsAdminEducationOrganizationsControllerCreateEducationOrganization();
  const updateEducationOrganizationMutation =
    useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization();
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
  const currentPublicLinksQuery =
    formState.publicLinksTab === 'active' ? listPublicLinksQuery : listArchivedPublicLinksQuery;
  const effectivePublicLinkId = useMemo(
    () => resolveEffectivePublicLinkId(formState.selectedPublicLinkId, visiblePublicLinks),
    [formState.selectedPublicLinkId, visiblePublicLinks],
  );

  const refetchPublicLinks = () => {
    void Promise.all([listPublicLinksQuery.refetch(), listArchivedPublicLinksQuery.refetch()]);
  };

  // Errors propagate: EducationOrganizationEditorSheet maps them onto its fields.
  const createEducationOrganization = async (payload: AdminCreateEducationOrganizationDto) => {
    const organization = await createEducationOrganizationMutation.mutateAsync({ data: payload });
    toast.success('Учебное заведение добавлено');
    await listEducationOrganizationsQuery.refetch();
    formState.setNewEducationOrganizationId(organization.id);
  };
  const updateEducationOrganization = async (
    organizationId: number,
    payload: AdminUpdateEducationOrganizationDto,
  ) => {
    await updateEducationOrganizationMutation.mutateAsync({ organizationId, data: payload });
    toast.success('Настройки учебного заведения сохранены');
    await listEducationOrganizationsQuery.refetch();
  };

  const actions = useAdminPublicLinksActions({
    publishedVersionId: detailQuery.data?.published?.id,
    newPublicShortCode: formState.newPublicShortCode,
    newEducationOrganizationId: formState.newEducationOrganizationId,
    educationOrganizations,
    newPersonalDataProcessingMode: formState.newPersonalDataProcessingMode,
    newPublicTemplate: formState.newPublicTemplate,
    newPublicEntryProfileMode: formState.newPublicEntryProfileMode,
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
    pendingMovePublicLink: formState.pendingMovePublicLink,
    setPendingMovePublicLink: formState.setPendingMovePublicLink,
    setNewPublicShortCode: formState.setNewPublicShortCode,
    setNewPersonalDataProcessingMode: formState.setNewPersonalDataProcessingMode,
    refetchPublicLinks,
    onPublicLinkCreated,
  });

  return {
    topics,
    educationOrganizations,
    effectiveSelectedTopicId,
    detailQuery,
    visiblePublicLinks,
    publicLinksLoading: currentPublicLinksQuery.isLoading,
    publicLinksError: currentPublicLinksQuery.isError,
    effectivePublicLinkId,
    refetchPublicLinks,
    ...formState,
    ...actions,
    createEducationOrganization,
    updateEducationOrganization,
  };
}
