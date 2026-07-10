import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  useTestsAdminEducationOrganizationsControllerCreateEducationOrganization,
  useTestsAdminEducationOrganizationsControllerListEducationOrganizations,
  useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization,
} from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import {
  mapOrganizationToEditorValues,
  emptyOperatorFields,
  normalizeOperatorFieldsPayload,
  normalizeValidationPayload,
  type OrganizationEditorValues,
} from './admin-education-organizations-workspace.helpers';

import type { EducationOrganizationOperatorValues } from './education-organization-operator-fields';
import type { ValidationMode } from './education-organizations-create-card';
import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

const ORGANIZATIONS_LIMIT = 10;
type EducationOrganizationItem = AdminEducationOrganizationsListResponseDtoOrganizationsItem;

interface CreateOrganizationValues extends EducationOrganizationOperatorValues {
  name: string;
  validationMode: ValidationMode;
  validationPattern: string;
  validationExample: string;
  validationHint: string;
}

const defaultCreateOrganizationValues = (): CreateOrganizationValues => ({
  name: '',
  ...emptyOperatorFields(),
  validationMode: 'NONE',
  validationPattern: '',
  validationExample: '',
  validationHint: '',
});

const defaultEditOrganizationValues = (): OrganizationEditorValues => ({
  name: '',
  isActive: true,
  ...emptyOperatorFields(),
  validationMode: 'NONE',
  validationPattern: '',
  validationExample: '',
  validationHint: '',
});

const usePaginatedEducationOrganizations = (page: number) => {
  const listOrganizationsQuery =
    useTestsAdminEducationOrganizationsControllerListEducationOrganizations(
      {
        page,
        limit: ORGANIZATIONS_LIMIT,
      },
      {
        query: {
          placeholderData: (previousData) => previousData,
        },
      },
    );
  const organizations = useMemo(
    () => listOrganizationsQuery.data?.organizations ?? [],
    [listOrganizationsQuery.data?.organizations],
  );

  return {
    organizations,
    listOrganizationsQuery,
    organizationsPage: listOrganizationsQuery.data?.page ?? page,
    organizationsTotal: listOrganizationsQuery.data?.total ?? 0,
    organizationsTotalPages: listOrganizationsQuery.data?.totalPages ?? 1,
    isFetchingOrganizations: listOrganizationsQuery.isFetching,
  };
};

interface EducationOrganizationsMutationParams {
  createValues: CreateOrganizationValues;
  editValues: OrganizationEditorValues;
  selectedOrganizationId: number | null;
  onCreated: (organization: EducationOrganizationItem) => void;
  onUpdated: (organization: EducationOrganizationItem) => void;
}

const useEducationOrganizationsMutations = ({
  createValues,
  editValues,
  selectedOrganizationId,
  onCreated,
  onUpdated,
}: EducationOrganizationsMutationParams) => {
  const createOrganizationMutation =
    useTestsAdminEducationOrganizationsControllerCreateEducationOrganization();
  const updateOrganizationMutation =
    useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization();

  const handleCreateOrganization = () => {
    const name = createValues.name.trim();
    if (!name) {
      toast.error('Введите название учебного заведения');
      return;
    }

    const validationPayload = normalizeValidationPayload({
      mode: createValues.validationMode,
      pattern: createValues.validationPattern,
      example: createValues.validationExample,
      hint: createValues.validationHint,
    });
    if (!validationPayload) {
      return;
    }

    createOrganizationMutation.mutate(
      {
        data: {
          name,
          ...normalizeOperatorFieldsPayload(createValues),
          ...validationPayload,
        },
      },
      {
        onSuccess: (organization) => {
          toast.success('Учебное заведение добавлено');
          onCreated(organization);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleSaveOrganization = () => {
    if (!selectedOrganizationId) {
      toast.error('Сначала выберите учебное заведение');
      return;
    }

    const name = editValues.name.trim();
    if (!name) {
      toast.error('Название учебного заведения не может быть пустым');
      return;
    }

    const validationPayload = normalizeValidationPayload({
      mode: editValues.validationMode,
      pattern: editValues.validationPattern,
      example: editValues.validationExample,
      hint: editValues.validationHint,
    });
    if (!validationPayload) {
      return;
    }

    updateOrganizationMutation.mutate(
      {
        organizationId: selectedOrganizationId,
        data: {
          name,
          isActive: editValues.isActive,
          ...normalizeOperatorFieldsPayload(editValues),
          ...validationPayload,
        },
      },
      {
        onSuccess: (organization) => {
          toast.success('Настройки учебного заведения сохранены');
          onUpdated(organization);
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  return {
    handleCreateOrganization,
    handleSaveOrganization,
    isCreating: createOrganizationMutation.isPending,
    isSaving: updateOrganizationMutation.isPending,
  };
};

export function useAdminEducationOrganizationsWorkspace() {
  const [page, setPage] = useState(1);
  const {
    organizations,
    listOrganizationsQuery,
    organizationsPage,
    organizationsTotal,
    organizationsTotalPages,
    isFetchingOrganizations,
  } = usePaginatedEducationOrganizations(page);
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<number | null>(null);
  const [createValues, setCreateValues] = useState<CreateOrganizationValues>(
    defaultCreateOrganizationValues,
  );
  const [editValues, setEditValues] = useState<OrganizationEditorValues>(
    defaultEditOrganizationValues,
  );
  const selectedOrganization = useMemo(
    () => organizations.find((organization) => organization.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId],
  );

  const updateCreateValue = <K extends keyof CreateOrganizationValues>(
    key: K,
    value: CreateOrganizationValues[K],
  ) => {
    setCreateValues((previousValues) => ({ ...previousValues, [key]: value }));
  };

  const updateEditValue = <K extends keyof OrganizationEditorValues>(
    key: K,
    value: OrganizationEditorValues[K],
  ) => {
    setEditValues((previousValues) => ({ ...previousValues, [key]: value }));
  };

  const handleSelectOrganization = (organization: (typeof organizations)[number]) => {
    setSelectedOrganizationId(organization.id);
    setEditValues(mapOrganizationToEditorValues(organization));
  };

  const clearSelectedOrganization = () => {
    setSelectedOrganizationId(null);
    setEditValues(defaultEditOrganizationValues());
  };

  const handleOrganizationCreated = (organization: EducationOrganizationItem) => {
    setCreateValues(defaultCreateOrganizationValues());
    setPage(1);
    setSelectedOrganizationId(organization.id);
    setEditValues(mapOrganizationToEditorValues(organization));
    void listOrganizationsQuery.refetch();
  };

  const handleOrganizationUpdated = (organization: EducationOrganizationItem) => {
    setEditValues(mapOrganizationToEditorValues(organization));
    void listOrganizationsQuery.refetch();
  };

  const { handleCreateOrganization, handleSaveOrganization, isCreating, isSaving } =
    useEducationOrganizationsMutations({
      createValues,
      editValues,
      selectedOrganizationId,
      onCreated: handleOrganizationCreated,
      onUpdated: handleOrganizationUpdated,
    });

  const handlePreviousPage = () => {
    clearSelectedOrganization();
    setPage((previousPage) => Math.max(1, previousPage - 1));
  };

  const handleNextPage = () => {
    clearSelectedOrganization();
    setPage((previousPage) =>
      Math.min(listOrganizationsQuery.data?.totalPages ?? previousPage + 1, previousPage + 1),
    );
  };

  return {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    organizationsPage,
    organizationsTotal,
    organizationsTotalPages,
    isFetchingOrganizations,
    createValues,
    editValues,
    isCreating,
    isSaving,
    updateCreateValue,
    updateEditValue,
    handleSelectOrganization,
    handleCreateOrganization,
    handleSaveOrganization,
    handlePreviousPage,
    handleNextPage,
  };
}
