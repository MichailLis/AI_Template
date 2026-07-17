import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useTestsAdminEducationOrganizationsControllerCreateEducationOrganization,
  useTestsAdminEducationOrganizationsControllerListEducationOrganizations,
  useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization,
} from '@/shared/api/generated/tests/tests';

import type {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationsListResponseDtoOrganizationsItem,
  AdminUpdateEducationOrganizationDto,
} from '@/shared/api/model';

const ORGANIZATIONS_LIMIT = 10;

type EducationOrganizationItem = AdminEducationOrganizationsListResponseDtoOrganizationsItem;

export type EducationOrganizationEditorState =
  | 'closed'
  | { mode: 'create' }
  | { mode: 'edit'; organization: EducationOrganizationItem };

export function useAdminEducationOrganizationsWorkspace() {
  const [page, setPage] = useState(1);
  const [editorState, setEditorState] = useState<EducationOrganizationEditorState>('closed');
  const listOrganizationsQuery =
    useTestsAdminEducationOrganizationsControllerListEducationOrganizations(
      { page, limit: ORGANIZATIONS_LIMIT },
      {
        query: {
          placeholderData: (previousData) => previousData,
        },
      },
    );
  const createOrganizationMutation =
    useTestsAdminEducationOrganizationsControllerCreateEducationOrganization();
  const updateOrganizationMutation =
    useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization();
  const organizations = useMemo(
    () => listOrganizationsQuery.data?.organizations ?? [],
    [listOrganizationsQuery.data?.organizations],
  );

  const createOrganization = async (payload: AdminCreateEducationOrganizationDto) => {
    await createOrganizationMutation.mutateAsync({ data: payload });
    toast.success('Учебное заведение добавлено');

    if (page === 1) {
      await listOrganizationsQuery.refetch();
    } else {
      setPage(1);
    }
  };

  const updateOrganization = async (
    organizationId: number,
    payload: AdminUpdateEducationOrganizationDto,
  ) => {
    await updateOrganizationMutation.mutateAsync({ organizationId, data: payload });
    toast.success('Настройки учебного заведения сохранены');
    await listOrganizationsQuery.refetch();
  };

  const handlePreviousPage = () => {
    setPage((previousPage) => Math.max(1, previousPage - 1));
  };

  const handleNextPage = () => {
    setPage((previousPage) =>
      Math.min(listOrganizationsQuery.data?.totalPages ?? previousPage + 1, previousPage + 1),
    );
  };

  return {
    organizations,
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
