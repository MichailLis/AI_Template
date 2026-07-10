import { toast } from 'sonner';

import {
  GROUP_VALIDATION_MODE_LABELS,
  hasMissingGroupValidationPattern,
  normalizeGroupValidationConfig,
} from '@/shared/lib/group-validation';

import type { EducationOrganizationOperatorValues } from './education-organization-operator-fields';
import type { ValidationMode } from './education-organizations-create-card';
import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

interface ValidationPayloadParams {
  mode: ValidationMode;
  pattern: string;
  example: string;
  hint: string;
}

export interface OrganizationEditorValues extends EducationOrganizationOperatorValues {
  name: string;
  isActive: boolean;
  validationMode: ValidationMode;
  validationPattern: string;
  validationExample: string;
  validationHint: string;
}

export const emptyOperatorFields = (): EducationOrganizationOperatorValues => ({
  fullName: '',
  shortName: '',
  inn: '',
  ogrn: '',
  legalAddress: '',
  email: '',
  phone: '',
  privacyPolicyUrl: '',
  consentDocumentUrl: '',
  logoUrl: '',
});

const toNullableTrimmedValue = (value: string) => value.trim() || null;

export const normalizeOperatorFieldsPayload = (values: EducationOrganizationOperatorValues) => ({
  fullName: toNullableTrimmedValue(values.fullName),
  shortName: toNullableTrimmedValue(values.shortName),
  inn: toNullableTrimmedValue(values.inn),
  ogrn: toNullableTrimmedValue(values.ogrn),
  legalAddress: toNullableTrimmedValue(values.legalAddress),
  email: toNullableTrimmedValue(values.email),
  phone: toNullableTrimmedValue(values.phone),
  privacyPolicyUrl: toNullableTrimmedValue(values.privacyPolicyUrl),
  consentDocumentUrl: toNullableTrimmedValue(values.consentDocumentUrl),
  logoUrl: toNullableTrimmedValue(values.logoUrl),
});

export const modeLabel = GROUP_VALIDATION_MODE_LABELS;

export const mapOrganizationToEditorValues = (
  organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem,
): OrganizationEditorValues => ({
  name: organization.name,
  isActive: organization.isActive,
  fullName: organization.fullName ?? '',
  shortName: organization.shortName ?? '',
  inn: organization.inn ?? '',
  ogrn: organization.ogrn ?? '',
  legalAddress: organization.legalAddress ?? '',
  email: organization.email ?? '',
  phone: organization.phone ?? '',
  privacyPolicyUrl: organization.privacyPolicyUrl ?? '',
  consentDocumentUrl: organization.consentDocumentUrl ?? '',
  logoUrl: organization.logoUrl ?? '',
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
