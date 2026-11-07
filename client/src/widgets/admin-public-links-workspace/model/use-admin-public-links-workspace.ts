import { useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { resolveEffectivePublicLinkId } from '@/entities/public-link';
import { resolveEffectiveTopicId } from '@/entities/test-topic';
import { useEducationOrganizationEditor } from '@/features/education-organization-editor';
import { useInvalidatePublicLinkLists } from '@/features/manage-public-link';
import {
  useTestsAdminEducationOrganizationsControllerListEducationOrganizations,
  useTestsAdminPublicLinksControllerListArchivedPublicLinks,
  useTestsAdminPublicLinksControllerListPublicLinks,
  useTestsControllerGetTopicDraft,
  useTestsControllerListTopics,
} from '@/shared/api/generated/tests/tests';

import { CREATE_PUBLIC_LINK_DEFAULTS } from '../lib/admin-public-links-workspace.helpers';

import { useAdminPublicLinksActions } from './use-admin-public-links-actions';
import { useAdminPublicLinksSelectionState } from './use-admin-public-links-selection-state';

import type { CreatePublicLinkValues } from '@/features/manage-public-link';
import type { AdminCreateEducationOrganizationDto } from '@/shared/api/model';

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
  const { createOrganization, updateOrganization: updateEducationOrganization } =
    useEducationOrganizationEditor();
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

  const retryPublicLinks = useInvalidatePublicLinkLists();

  // Errors propagate: EducationOrganizationEditorSheet maps them onto its fields.
  const createEducationOrganization = async (payload: AdminCreateEducationOrganizationDto) => {
    const organization = await createOrganization(payload);
    createForm.setValue('educationOrganizationId', organization.id);
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
    retryPublicLinks,
    ...selection,
    ...actions,
    createEducationOrganization,
    updateEducationOrganization,
  };
}
