import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  getTestsAdminEducationOrganizationsControllerListEducationOrganizationsQueryKey,
  useTestsAdminEducationOrganizationsControllerCreateEducationOrganization,
  useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization,
} from '@/shared/api/generated/tests/tests';

import type {
  AdminCreateEducationOrganizationDto,
  AdminUpdateEducationOrganizationDto,
} from '@/shared/api/model';

// Errors propagate: EducationOrganizationEditorSheet maps them onto its fields.
export function useEducationOrganizationEditor() {
  const queryClient = useQueryClient();
  const createMutation = useTestsAdminEducationOrganizationsControllerCreateEducationOrganization();
  const updateMutation = useTestsAdminEducationOrganizationsControllerUpdateEducationOrganization();
  const invalidateOrganizations = () =>
    queryClient.invalidateQueries({
      queryKey: getTestsAdminEducationOrganizationsControllerListEducationOrganizationsQueryKey(),
    });

  const createOrganization = async (payload: AdminCreateEducationOrganizationDto) => {
    const organization = await createMutation.mutateAsync({ data: payload });
    toast.success('Учебное заведение добавлено');
    await invalidateOrganizations();
    return organization;
  };

  const updateOrganization = async (
    organizationId: number,
    payload: AdminUpdateEducationOrganizationDto,
  ) => {
    await updateMutation.mutateAsync({ organizationId, data: payload });
    toast.success('Настройки учебного заведения сохранены');
    await invalidateOrganizations();
  };

  return { createOrganization, updateOrganization };
}
