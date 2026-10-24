import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
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
  CREATE_PUBLIC_LINK_DEFAULTS,
  resolveEffectivePublicLinkId,
  resolveEffectiveTopicId,
} from './admin-public-links-workspace.helpers';
import { useAdminPublicLinksActions } from './use-admin-public-links-actions';
import { useAdminPublicLinksSelectionState } from './use-admin-public-links-selection-state';

import type { CreatePublicLinkValues } from './public-link-create-card.types';
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
  const createForm = useForm<CreatePublicLinkValues>({
    defaultValues: CREATE_PUBLIC_LINK_DEFAULTS,
  });
  const selection = useAdminPublicLinksSelectionState();

  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);
  const educationOrganizations = useMemo(
    () => listEducationOrganizationsQuery.data?.organizations ?? [],
    [listEducationOrganizationsQuery.data?.organizations],
  );
  const effectiveSelectedTopicId = useMemo(
    () => resolveEffectiveTopicId(selection.selectedTopicId, topics),
    [selection.selectedTopicId, topics],
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
    () => (selection.publicLinksTab === 'active' ? activePublicLinks : archivedPublicLinks),
    [activePublicLinks, archivedPublicLinks, selection.publicLinksTab],
  );
  const currentPublicLinksQuery =
    selection.publicLinksTab === 'active' ? listPublicLinksQuery : listArchivedPublicLinksQuery;
  const effectivePublicLinkId = useMemo(
    () => resolveEffectivePublicLinkId(selection.selectedPublicLinkId, visiblePublicLinks),
    [selection.selectedPublicLinkId, visiblePublicLinks],
  );

  const refetchPublicLinks = () => {
    void Promise.all([listPublicLinksQuery.refetch(), listArchivedPublicLinksQuery.refetch()]);
  };

  // Errors propagate: EducationOrganizationEditorSheet maps them onto its fields.
  const createEducationOrganization = async (payload: AdminCreateEducationOrganizationDto) => {
    const organization = await createEducationOrganizationMutation.mutateAsync({ data: payload });
    toast.success('Учебное заведение добавлено');
    await listEducationOrganizationsQuery.refetch();
    createForm.setValue('educationOrganizationId', organization.id);
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
    form: createForm,
    selection,
    publishedVersionId: detailQuery.data?.published?.id,
    educationOrganizations,
    onPublicLinkCreated,
  });

  return {
    createForm,
    topics,
    educationOrganizations,
    effectiveSelectedTopicId,
    detailQuery,
    visiblePublicLinks,
    publicLinksLoading: currentPublicLinksQuery.isLoading,
    publicLinksError: currentPublicLinksQuery.isError,
    effectivePublicLinkId,
    refetchPublicLinks,
    ...selection,
    ...actions,
    createEducationOrganization,
    updateEducationOrganization,
  };
}
