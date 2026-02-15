import { toast } from 'sonner';

import {
  GROUP_VALIDATION_MODE_LABELS,
  hasMissingGroupValidationPattern,
  normalizeGroupValidationConfig,
} from '@/shared/lib/group-validation';

import type { ValidationMode } from './education-organizations-create-card';
import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

interface ValidationPayloadParams {
  mode: ValidationMode;
  pattern: string;
  example: string;
  hint: string;
}

export interface OrganizationEditorValues {
  name: string;
  isActive: boolean;
  validationMode: ValidationMode;
  validationPattern: string;
  validationExample: string;
  validationHint: string;
}

export const modeLabel = GROUP_VALIDATION_MODE_LABELS;

export const mapOrganizationToEditorValues = (
  organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem,
): OrganizationEditorValues => ({
  name: organization.name,
  isActive: organization.isActive,
  validationMode: organization.groupValidationMode as ValidationMode,
  validationPattern: organization.groupValidationPattern ?? '',
  validationExample: organization.groupValidationExample ?? '',
  validationHint: organization.groupValidationHint ?? '',
});

export const normalizeValidationPayload = ({
  mode,
  pattern,
  example,
  hint,
}: ValidationPayloadParams) => {
  if (hasMissingGroupValidationPattern({ mode, pattern })) {
    toast.error('Для выбранного режима укажите шаблон формата группы/класса');
    return null;
  }

  return normalizeGroupValidationConfig({ mode, pattern, example, hint });
};
