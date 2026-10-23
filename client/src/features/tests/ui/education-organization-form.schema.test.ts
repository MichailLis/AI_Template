import { describe, expect, it } from 'vitest';

import {
  createEducationOrganizationFormValues,
  educationOrganizationFormSchema,
  getPersonalDataFieldsCompletion,
  toCreateEducationOrganizationPayload,
} from './education-organization-form.schema';

const validValues = () =>
  createEducationOrganizationFormValues({
    name: 'Лицей 42',
  });

describe('educationOrganizationFormSchema', () => {
  it('allows creating an incomplete organization with only a name', () => {
    expect(educationOrganizationFormSchema.safeParse(validValues()).success).toBe(true);
  });

  it.each([
    ['А', 'короче двух символов'],
    ['А'.repeat(301), 'длиннее 300 символов'],
  ])('rejects a name %s', (name) => {
    const result = educationOrganizationFormSchema.safeParse({ ...validValues(), name });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === 'name')).toBe(true);
    }
  });

  it.each(['school.example/privacy', 'ftp://school.example/privacy', 'not a url'])(
    'rejects a non-HTTP(S) URL: %s',
    (privacyPolicyUrl) => {
      const result = educationOrganizationFormSchema.safeParse({
        ...validValues(),
        privacyPolicyUrl,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path[0] === 'privacyPolicyUrl')).toBe(
          true,
        );
      }
    },
  );

  it('requires a RegExp outside NONE mode', () => {
    const result = educationOrganizationFormSchema.safeParse({
      ...validValues(),
      groupValidationMode: 'STRICT',
      groupValidationPattern: '',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['groupValidationPattern']);
    }
  });

  it('rejects an invalid RegExp', () => {
    const result = educationOrganizationFormSchema.safeParse({
      ...validValues(),
      groupValidationMode: 'HINT',
      groupValidationPattern: '[',
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['groupValidationPattern']);
    }
  });
});

describe('getPersonalDataFieldsCompletion', () => {
  it('returns 0 of 3 for an empty operator profile', () => {
    expect(getPersonalDataFieldsCompletion(validValues())).toEqual({ completed: 0, total: 3 });
  });

  it('returns 3 of 3 when all required operator fields are filled', () => {
    expect(
      getPersonalDataFieldsCompletion({
        ...validValues(),
        fullName: 'Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
        shortName: 'МАОУ «Лицей № 42»',
        privacyPolicyUrl: 'https://school.example/privacy',
      }),
    ).toEqual({ completed: 3, total: 3 });
  });
});

describe('toCreateEducationOrganizationPayload', () => {
  it('trims strings, converts empty optional values to null and clears disabled validation', () => {
    expect(
      toCreateEducationOrganizationPayload({
        ...validValues(),
        name: '  Лицей 42  ',
        fullName: '  Полное имя  ',
        shortName: '   ',
        groupValidationPattern: '^old$',
        groupValidationExample: 'old',
        groupValidationHint: 'old',
      }),
    ).toMatchObject({
      name: 'Лицей 42',
      fullName: 'Полное имя',
      shortName: null,
      groupValidationMode: 'NONE',
      groupValidationPattern: null,
      groupValidationExample: null,
      groupValidationHint: null,
    });
  });
});
