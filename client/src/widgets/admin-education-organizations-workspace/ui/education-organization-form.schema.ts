import { z } from 'zod';

import type {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationsListResponseDtoOrganizationsItem,
  AdminUpdateEducationOrganizationDto,
} from '@/shared/api/model';

export type OrganizationEditorMode = 'create' | 'edit';

const addTrimmedLengthIssues = (
  value: string,
  context: z.RefinementCtx,
  options: { field: string; min?: number; max: number; path?: string },
) => {
  const length = value.trim().length;

  if (options.min !== undefined && length < options.min) {
    context.addIssue({
      code: 'custom',
      path: options.path ? [options.path] : undefined,
      message: `${options.field} должно содержать не менее ${options.min} символов`,
    });
  }

  if (length > options.max) {
    context.addIssue({
      code: 'custom',
      path: options.path ? [options.path] : undefined,
      message: `${options.field} не должно быть длиннее ${options.max} символов`,
    });
  }
};

const optionalTrimmedString = (field: string, max: number) =>
  z.string().superRefine((value, context) => {
    if (value.trim()) {
      addTrimmedLengthIssues(value, context, { field, max });
    }
  });

const optionalHttpUrl = (field: string) =>
  z.string().superRefine((value, context) => {
    const normalizedValue = value.trim();
    if (!normalizedValue) {
      return;
    }

    if (normalizedValue.length > 2048) {
      context.addIssue({
        code: 'custom',
        message: `${field} не должен быть длиннее 2048 символов`,
      });
      return;
    }

    try {
      const url = new URL(normalizedValue);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Unsupported protocol');
      }
    } catch {
      context.addIssue({
        code: 'custom',
        message: 'Укажите полный адрес, начинающийся с http:// или https://',
      });
    }
  });

export const educationOrganizationFormSchema = z
  .object({
    name: z.string().superRefine((value, context) => {
      addTrimmedLengthIssues(value, context, { field: 'Название', min: 2, max: 300 });
    }),
    isActive: z.boolean(),
    fullName: optionalTrimmedString('Полное наименование', 500),
    shortName: optionalTrimmedString('Сокращённое наименование', 300),
    inn: optionalTrimmedString('ИНН', 20),
    ogrn: optionalTrimmedString('ОГРН', 20),
    legalAddress: optionalTrimmedString('Юридический адрес', 500),
    email: optionalTrimmedString('Email', 320),
    phone: optionalTrimmedString('Телефон', 50),
    privacyPolicyUrl: optionalHttpUrl('Политика обработки ПДн'),
    consentDocumentUrl: optionalHttpUrl('Документ согласия'),
    logoUrl: optionalHttpUrl('Логотип'),
    groupValidationMode: z.enum(['NONE', 'HINT', 'STRICT']),
    groupValidationPattern: z.string(),
    groupValidationExample: z.string(),
    groupValidationHint: z.string(),
  })
  .superRefine((values, context) => {
    if (values.groupValidationMode === 'NONE') {
      return;
    }

    const pattern = values.groupValidationPattern.trim();
    if (!pattern) {
      context.addIssue({
        code: 'custom',
        path: ['groupValidationPattern'],
        message: 'Укажите регулярное выражение для проверки группы/класса',
      });
      return;
    }

    if (pattern.length > 300) {
      context.addIssue({
        code: 'custom',
        path: ['groupValidationPattern'],
        message: 'Шаблон не должен быть длиннее 300 символов',
      });
    }

    try {
      new RegExp(pattern, 'u');
    } catch {
      context.addIssue({
        code: 'custom',
        path: ['groupValidationPattern'],
        message: 'Некорректное регулярное выражение формата группы/класса',
      });
    }

    addTrimmedLengthIssues(values.groupValidationExample, context, {
      field: 'Пример',
      max: 120,
      path: 'groupValidationExample',
    });
    addTrimmedLengthIssues(values.groupValidationHint, context, {
      field: 'Подсказка',
      max: 300,
      path: 'groupValidationHint',
    });
  });

export type EducationOrganizationFormValues = z.infer<typeof educationOrganizationFormSchema>;

const EMPTY_FORM_VALUES: EducationOrganizationFormValues = {
  name: '',
  isActive: true,
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
  groupValidationMode: 'NONE',
  groupValidationPattern: '',
  groupValidationExample: '',
  groupValidationHint: '',
};

export const createEducationOrganizationFormValues = (
  overrides: Partial<EducationOrganizationFormValues> = {},
): EducationOrganizationFormValues => ({
  ...EMPTY_FORM_VALUES,
  ...overrides,
});

export const mapEducationOrganizationToFormValues = (
  organization: AdminEducationOrganizationsListResponseDtoOrganizationsItem,
): EducationOrganizationFormValues =>
  createEducationOrganizationFormValues({
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
    groupValidationMode: organization.groupValidationMode,
    groupValidationPattern: organization.groupValidationPattern ?? '',
    groupValidationExample: organization.groupValidationExample ?? '',
    groupValidationHint: organization.groupValidationHint ?? '',
  });

const toNullableTrimmedValue = (value: string) => value.trim() || null;

const toSharedPayload = (values: EducationOrganizationFormValues) => {
  const validationDisabled = values.groupValidationMode === 'NONE';

  return {
    name: values.name.trim(),
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
    groupValidationMode: values.groupValidationMode,
    groupValidationPattern: validationDisabled
      ? null
      : toNullableTrimmedValue(values.groupValidationPattern),
    groupValidationExample: validationDisabled
      ? null
      : toNullableTrimmedValue(values.groupValidationExample),
    groupValidationHint: validationDisabled
      ? null
      : toNullableTrimmedValue(values.groupValidationHint),
  };
};

export const toCreateEducationOrganizationPayload = (
  values: EducationOrganizationFormValues,
): AdminCreateEducationOrganizationDto => toSharedPayload(values);

export const toUpdateEducationOrganizationPayload = (
  values: EducationOrganizationFormValues,
): AdminUpdateEducationOrganizationDto => ({
  ...toSharedPayload(values),
  isActive: values.isActive,
});

export const getPersonalDataReadiness = (values: EducationOrganizationFormValues) => ({
  completed: [values.fullName, values.shortName, values.privacyPolicyUrl].filter((value) =>
    Boolean(value.trim()),
  ).length,
  total: 3,
});
