import { toast } from 'sonner';

import { useTestsAdminPublicLinksControllerCreatePublicLink } from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

import { buildAccessWindowPayload, validateAccessWindow } from '../lib/access-window';
import { validateCreatePublicLinkInput } from '../lib/validate-create-public-link';

import { useInvalidatePublicLinkLists } from './use-public-link-access-window';

import type { CreatePublicLinkValues } from './create-public-link.types';

interface UseCreatePublicLinkParams {
  publishedVersionId: number | undefined;
  educationOrganizations: Array<{ id: number; isActive: boolean; personalDataReady: boolean }>;
}

/** Проверяет форму, создаёт ссылку и обновляет списки; `onCreated` получает созданную ссылку. */
export function useCreatePublicLink({
  publishedVersionId,
  educationOrganizations,
}: UseCreatePublicLinkParams) {
  const createPublicLinkMutation = useTestsAdminPublicLinksControllerCreatePublicLink();
  const invalidatePublicLinks = useInvalidatePublicLinkLists();

  const createPublicLink = (
    values: CreatePublicLinkValues,
    onCreated: (link: { id: number }) => void,
  ) => {
    const isDemographic = values.entryProfileMode === 'DEMOGRAPHIC';
    const validation = validateCreatePublicLinkInput({
      publishedVersionId,
      educationOrganizationId: values.educationOrganizationId,
      educationOrganizations,
      personalDataProcessingMode: values.personalDataProcessingMode,
      maxAttemptsRaw: isDemographic ? '1' : values.maxAttempts,
      timeLimitRaw: values.timeLimit,
    });

    if (!validation.ok) {
      toast.error(validation.error);
      return;
    }

    const accessWindowError = validateAccessWindow(values);
    if (accessWindowError) {
      toast.error(accessWindowError);
      return;
    }

    createPublicLinkMutation.mutate(
      {
        data: {
          publishedVersionId: validation.publishedVersionId,
          educationOrganizationId: validation.educationOrganizationId,
          personalDataProcessingMode: values.personalDataProcessingMode,
          shortCode: values.shortCode.trim() || undefined,
          publicTemplate: values.publicTemplate,
          entryProfileMode: values.entryProfileMode,
          maxAttemptsPerStudent: isDemographic ? 1 : validation.maxAttemptsPerStudent,
          timeLimitMinutes: validation.timeLimitMinutes,
          allowResume: values.allowResume,
          consentVersion: values.consentVersion.trim() || 'v1',
          consentText: values.consentText.trim(),
          ...buildAccessWindowPayload(values),
        },
      },
      {
        onSuccess: (link) => {
          toast.success('Публичная ссылка создана');
          onCreated(link);
          invalidatePublicLinks();
        },
        onError: (error) => {
          toast.error(parseApiError(error));
        },
      },
    );
  };

  return { createPublicLink, createPublicLinkMutation };
}
