import {
  AdminCreatePublicLinkSchema,
  AdminCreateEducationOrganizationSchema,
  AdminPublicAttemptDetailResponseSchema,
  AdminPublicLinkSchema,
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

describe('tests link DTO profile mode fields', () => {
  it('defaults public link creation input to the standard template', () => {
    const result = AdminCreatePublicLinkSchema.parse({
      publishedVersionId: 10,
      entryProfileMode: 'DEMOGRAPHIC',
      maxAttemptsPerStudent: 3,
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    expect(result.publicTemplate).toBe('STANDARD');
  });

  it('accepts POLUS public link creation input', () => {
    const result = AdminCreatePublicLinkSchema.parse({
      publishedVersionId: 10,
      publicTemplate: 'POLUS',
      entryProfileMode: 'DEMOGRAPHIC',
      maxAttemptsPerStudent: 3,
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    expect(result.publicTemplate).toBe('POLUS');
  });

  it('accepts DEMOGRAPHIC public link creation input', () => {
    const result = AdminCreatePublicLinkSchema.parse({
      publishedVersionId: 10,
      entryProfileMode: 'DEMOGRAPHIC',
      maxAttemptsPerStudent: 3,
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    expect(result.entryProfileMode).toBe('DEMOGRAPHIC');
  });

  it('accepts EDUCATION_DEMOGRAPHIC public link creation input', () => {
    const result = AdminCreatePublicLinkSchema.parse({
      publishedVersionId: 10,
      entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
      maxAttemptsPerStudent: 3,
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    expect(result.entryProfileMode).toBe('EDUCATION_DEMOGRAPHIC');
  });

  it('returns entry profile mode in admin public link response', () => {
    const result = AdminPublicLinkSchema.parse({
      id: 1,
      publishedVersionId: 10,
      topicId: 2,
      educationOrganizationId: null,
      educationOrganizationName: null,
      entryProfileMode: 'EDUCATION',
      publicTemplate: 'POLUS',
      shortCode: 'CODE2026',
      shortUrl: '/t/CODE2026',
      isActive: true,
      archivedAt: null,
      startsAt: null,
      endsAt: null,
      maxAttemptsPerStudent: 1,
      timeLimitMinutes: null,
      allowResume: true,
      consentVersion: 'v1',
      consentText: 'Согласие',
      title: 'Тест',
      updatedAt: '2026-05-14T10:00:00.000Z',
      createdAt: '2026-05-14T10:00:00.000Z',
    });

    expect(result.entryProfileMode).toBe('EDUCATION');
    expect(result.publicTemplate).toBe('POLUS');
  });

  it('returns profession atlas URL in admin attempt detail response', () => {
    const result = AdminPublicAttemptDetailResponseSchema.parse({
      attemptId: 1,
      publicLinkId: 2,
      shortCode: 'CODE2026',
      professionAtlasUrl: 'https://atlas.example/professions',
      attemptNumber: 1,
      status: 'COMPLETED',
      entryProfileMode: 'DEMOGRAPHIC',
      studentName: null,
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: null,
      groupOrClass: null,
      studentGender: 'FEMALE',
      studentAge: 17,
      studentResidence: 'Казань',
      studentEducationLevel: 'SECONDARY_GENERAL',
      consentAcceptedAt: '2026-05-14T10:00:00.000Z',
      consentVersion: 'v1',
      startedAt: '2026-05-14T10:00:00.000Z',
      finishedAt: null,
      expiresAt: null,
      answers: [],
      analysis: null,
    });

    expect(result.professionAtlasUrl).toBe('https://atlas.example/professions');
  });
});
