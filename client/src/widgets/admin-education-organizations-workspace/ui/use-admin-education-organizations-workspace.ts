import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { parseApiError } from '@/features/tests';
import {
  useTestsControllerCreateEducationOrganization,
  useTestsControllerListEducationOrganizations,
  useTestsControllerUpdateEducationOrganization,
} from '@/shared/api/generated/tests/tests';

import {
  mapOrganizationToEditorValues,
  normalizeValidationPayload,
  type OrganizationEditorValues,
} from './admin-education-organizations-workspace.helpers';

import type { ValidationMode } from './education-organizations-create-card';

interface CreateOrganizationValues {
  name: string;
  validationMode: ValidationMode;
  validationPattern: string;
  validationExample: string;
  validationHint: string;
}

const defaultCreateOrganizationValues = (): CreateOrganizationValues => ({
  name: '',
  validationMode: 'NONE',
  validationPattern: '',
  validationExample: '',
  validationHint: '',
});

const defaultEditOrganizationValues = (): OrganizationEditorValues => ({
  name: '',
  isActive: true,
  validationMode: 'NONE',
  validationPattern: '',
  validationExample: '',
  validationHint: '',
});

export function useAdminEducationOrganizationsWorkspace() {
  const listOrganizationsQuery = useTestsControllerListEducationOrganizations();
  const createOrganizationMutation = useTestsControllerCreateEducationOrganization();
  const updateOrganizationMutation = useTestsControllerUpdateEducationOrganization();
  const organizations = useMemo(
    () => listOrganizationsQuery.data?.organizations ?? [],
    [listOrganizationsQuery.data?.organizations],
  );
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
      { data: { name, ...validationPayload } },
      {
        onSuccess: (organization) => {
          toast.success('Учебное заведение добавлено');
          setCreateValues(defaultCreateOrganizationValues());
          setSelectedOrganizationId(organization.id);
          setEditValues(mapOrganizationToEditorValues(organization));
          void listOrganizationsQuery.refetch();
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
        data: { name, isActive: editValues.isActive, ...validationPayload },
      },
      {
        onSuccess: (organization) => {
          toast.success('Настройки учебного заведения сохранены');
          setEditValues(mapOrganizationToEditorValues(organization));
          void listOrganizationsQuery.refetch();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  return {
    organizations,
    selectedOrganization,
    selectedOrganizationId,
    createValues,
    editValues,
    isCreating: createOrganizationMutation.isPending,
    isSaving: updateOrganizationMutation.isPending,
    updateCreateValue,
    updateEditValue,
    handleSelectOrganization,
    handleCreateOrganization,
    handleSaveOrganization,
  };
}
