import {
  AdminCreateEducationOrganizationSchema,
  AdminUpdateEducationOrganizationSchema,
} from './tests-links.dto';

describe('tests-links dto group validation schemas', () => {
  it('rejects create payload when mode requires pattern but pattern is missing', () => {
    const result = AdminCreateEducationOrganizationSchema.safeParse({
      name: 'Лицей 42',
      groupValidationMode: 'STRICT',
      groupValidationPattern: null,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }

    expect(
      result.error.issues.some((issue) => issue.path.join('.') === 'groupValidationPattern'),
    ).toBe(true);
  });

  it('rejects create payload with invalid regex pattern', () => {
    const result = AdminCreateEducationOrganizationSchema.safeParse({
      name: 'Колледж 1',
      groupValidationMode: 'HINT',
      groupValidationPattern: '[invalid-regex',
    });

    expect(result.success).toBe(false);
  });

  it('accepts create payload with valid regex for non-NONE modes', () => {
    const result = AdminCreateEducationOrganizationSchema.safeParse({
      name: 'Колледж 2',
      groupValidationMode: 'HINT',
      groupValidationPattern: '^[А-ЯA-Z]{2,4}-?\\d{1,3}[А-ЯA-Z]?$',
      groupValidationExample: 'ИС-21',
      groupValidationHint: 'Укажите формат ИС-21',
    });

    expect(result.success).toBe(true);
  });

  it('rejects update payload with invalid regex pattern', () => {
    const result = AdminUpdateEducationOrganizationSchema.safeParse({
      groupValidationPattern: '(?<bad',
    });

    expect(result.success).toBe(false);
  });
});
