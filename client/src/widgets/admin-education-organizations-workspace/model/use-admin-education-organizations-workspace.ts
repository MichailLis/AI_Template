import { useMemo, useState } from 'react';

import { useEducationOrganizationEditor } from '@/features/education-organization-editor';
import { useTestsAdminEducationOrganizationsControllerListEducationOrganizations } from '@/shared/api/generated/tests/tests';

import type {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationsListResponseDtoOrganizationsItem,
} from '@/shared/api/model';

const ORGANIZATIONS_LIMIT = 10;

type EducationOrganizationItem = AdminEducationOrganizationsListResponseDtoOrganizationsItem;

export type EducationOrganizationEditorState =
  'closed' | { mode: 'create' } | { mode: 'edit'; organization: EducationOrganizationItem };

export function useAdminEducationOrganizationsWorkspace() {
  const [page, setPage] = useState(1);
  const [needsPersonalDataOnly, setNeedsPersonalDataOnly] = useState(false);
  const [editorState, setEditorState] = useState<EducationOrganizationEditorState>('closed');
  const listOrganizationsQuery =
    useTestsAdminEducationOrganizationsControllerListEducationOrganizations(
      {
        page,
        limit: ORGANIZATIONS_LIMIT,
        ...(needsPersonalDataOnly ? { needsPersonalData: true } : {}),
      },
      {
        query: {
          placeholderData: (previousData) => previousData,
        },
      },
    );
  const { createOrganization: createOrganizationRecord, updateOrganization } =
    useEducationOrganizationEditor();
  const organizations = useMemo(
    () => listOrganizationsQuery.data?.organizations ?? [],
    [listOrganizationsQuery.data?.organizations],
  );

  const createOrganization = async (payload: AdminCreateEducationOrganizationDto) => {
    await createOrganizationRecord(payload);
    setPage(1);
  };

  const handlePreviousPage = () => {
    setPage((previousPage) => Math.max(1, previousPage - 1));
  };

  const handleNextPage = () => {
    setPage((previousPage) =>
      Math.min(listOrganizationsQuery.data?.totalPages ?? previousPage + 1, previousPage + 1),
    );
  };

  // Фильтр меняет число страниц: остаться на третьей странице отфильтрованного списка нельзя.
  const changeNeedsPersonalDataOnly = (value: boolean) => {
    setNeedsPersonalDataOnly(value);
    setPage(1);
  };

  return {
    organizations,
    needsPersonalDataOnly,
    changeNeedsPersonalDataOnly,
    editorState,
    organizationsPage: listOrganizationsQuery.data?.page ?? page,
    organizationsTotal: listOrganizationsQuery.data?.total ?? 0,
    organizationsTotalPages: listOrganizationsQuery.data?.totalPages ?? 1,
    isFetchingOrganizations: listOrganizationsQuery.isFetching,
    openCreateEditor: () => setEditorState({ mode: 'create' }),
    openEditEditor: (organization: EducationOrganizationItem) =>
      setEditorState({ mode: 'edit', organization }),
    closeEditor: () => setEditorState('closed'),
    createOrganization,
    updateOrganization,
    handlePreviousPage,
    handleNextPage,
  };
}
