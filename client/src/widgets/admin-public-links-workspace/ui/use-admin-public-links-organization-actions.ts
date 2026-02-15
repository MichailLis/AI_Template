import { toast } from 'sonner';

import { parseApiError } from '@/features/tests';
import {
  useTestsControllerCreateEducationOrganization,
  useTestsControllerUpdateEducationOrganization,
} from '@/shared/api/generated/tests/tests';
import {
  hasMissingGroupValidationPattern,
  normalizeGroupValidationConfig,
} from '@/shared/lib/group-validation';

import type { UseAdminPublicLinksActionsParams } from './use-admin-public-links-actions.types';

export function useEducationOrganizationActions(params: UseAdminPublicLinksActionsParams) {
  const {
    newEducationOrganizationId,
    newEducationOrganizationName,
    groupValidationMode,
    groupValidationPattern,
    groupValidationExample,
    groupValidationHint,
    setNewEducationOrganizationId,
    setNewEducationOrganizationName,
    setGroupValidationMode,
    setGroupValidationPattern,
    setGroupValidationExample,
    setGroupValidationHint,
    refetchEducationOrganizations,
  } = params;

  const createEducationOrganizationMutation = useTestsControllerCreateEducationOrganization();
  const updateEducationOrganizationMutation = useTestsControllerUpdateEducationOrganization();

  const handleCreateEducationOrganization = () => {
    const name = newEducationOrganizationName.trim();
    if (!name) {
      toast.error('Введите название учебного заведения');
      return;
    }

    if (
      hasMissingGroupValidationPattern({
        mode: groupValidationMode,
        pattern: groupValidationPattern,
      })
    ) {
      toast.error('Для режима проверки укажите шаблон формата группы/класса');
      return;
    }

    const validationConfig = normalizeGroupValidationConfig({
      mode: groupValidationMode,
      pattern: groupValidationPattern,
      example: groupValidationExample,
      hint: groupValidationHint,
    });

    createEducationOrganizationMutation.mutate(
      { data: { name, ...validationConfig } },
      {
        onSuccess: (organization) => {
          toast.success('Учебное заведение добавлено');
          setNewEducationOrganizationName('');
          setNewEducationOrganizationId(organization.id);
          setGroupValidationMode(organization.groupValidationMode);
          setGroupValidationPattern(organization.groupValidationPattern ?? '');
          setGroupValidationExample(organization.groupValidationExample ?? '');
          setGroupValidationHint(organization.groupValidationHint ?? '');
          refetchEducationOrganizations();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  const handleUpdateEducationOrganization = () => {
    if (!newEducationOrganizationId) {
      toast.error('Сначала выберите учебное заведение');
      return;
    }

    if (
      hasMissingGroupValidationPattern({
        mode: groupValidationMode,
        pattern: groupValidationPattern,
      })
    ) {
      toast.error('Для режима проверки укажите шаблон формата группы/класса');
      return;
    }

    const validationConfig = normalizeGroupValidationConfig({
      mode: groupValidationMode,
      pattern: groupValidationPattern,
      example: groupValidationExample,
      hint: groupValidationHint,
    });

    updateEducationOrganizationMutation.mutate(
      {
        organizationId: newEducationOrganizationId,
        data: validationConfig,
      },
      {
        onSuccess: (organization) => {
          toast.success('Настройки формата группы/класса сохранены');
          setGroupValidationMode(organization.groupValidationMode);
          setGroupValidationPattern(organization.groupValidationPattern ?? '');
          setGroupValidationExample(organization.groupValidationExample ?? '');
          setGroupValidationHint(organization.groupValidationHint ?? '');
          refetchEducationOrganizations();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  return {
    createEducationOrganizationMutation,
    updateEducationOrganizationMutation,
    handleCreateEducationOrganization,
    handleUpdateEducationOrganization,
  };
}
