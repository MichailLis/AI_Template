import {
  AdminCreatePublicLinkSchema,
  AdminCreateEducationOrganizationSchema,
  AdminEducationOrganizationSchema,
  AdminPublicAttemptDetailResponseSchema,
  AdminPublicLinkSchema,
  AdminUpdateEducationOrganizationSchema,
  AdminUpdatePublicLinkSchema,
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
  const publicBranding = {
    version: 1,
    background: { mode: 'solid', color: '#f2f7fb' },
    header: {
      logos: [{ url: 'https://cdn.example.com/logo.svg', alt: 'Client logo', size: 'md' }],
    },
    buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
  };

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

  it('accepts public branding on create and update payloads', () => {
    const createResult = AdminCreatePublicLinkSchema.parse({
      publishedVersionId: 10,
      publicTemplate: 'STANDARD',
      publicBranding,
      entryProfileMode: 'DEMOGRAPHIC',
      maxAttemptsPerStudent: 3,
      consentVersion: 'v1',
      consentText: 'Согласие',
    });
    const updateResult = AdminUpdatePublicLinkSchema.parse({
      publicBranding: null,
    });

    expect(createResult.publicBranding).toEqual(publicBranding);
    expect(updateResult.publicBranding).toBeNull();
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
      personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      operatorFullNameSnapshot:
        'Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
      operatorShortNameSnapshot: 'МАОУ «Лицей № 42»',
      operatorPrivacyPolicyUrlSnapshot: 'https://example.edu/privacy',
      operatorConsentDocumentUrlSnapshot: null,
      entryProfileMode: 'EDUCATION',
      publicTemplate: 'POLUS',
      publicBranding,
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
    expect(result.publicBranding).toEqual(publicBranding);
    expect(result).toMatchObject({
      personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      operatorFullNameSnapshot:
        'Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
      operatorShortNameSnapshot: 'МАОУ «Лицей № 42»',
      operatorPrivacyPolicyUrlSnapshot: 'https://example.edu/privacy',
      operatorConsentDocumentUrlSnapshot: null,
    });
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

describe('tests link DTO personal data contracts', () => {
  const createPublicLinkInput = {
    publishedVersionId: 10,
    consentVersion: 'v1',
    consentText: 'Согласие',
  };
  const educationOrganizationResponse = {
    id: 42,
    name: 'Лицей 42',
    fullName: 'Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
    shortName: 'МАОУ «Лицей № 42»',
    inn: '1234567890',
    ogrn: '1234567890123',
    legalAddress: 'Казань, ул. Примерная, 1',
    email: 'office@example.edu',
    phone: '+7 900 000-00-00',
    privacyPolicyUrl: 'https://example.edu/privacy',
    consentDocumentUrl: null,
    logoUrl: 'http://example.edu/logo.svg',
    personalDataReady: true,
    isActive: true,
    groupValidationMode: 'NONE',
    groupValidationPattern: null,
    groupValidationExample: null,
    groupValidationHint: null,
    linksCount: 1,
    activeLinksCount: 1,
    attemptsCount: 2,
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-10T10:00:00.000Z',
  } as const;

  it('defaults public links to PUBLIC personal data processing', () => {
    const result = AdminCreatePublicLinkSchema.parse(createPublicLinkInput);

    expect(result.personalDataProcessingMode).toBe('PUBLIC');
  });

  it('requires an education organization for processing on its behalf', () => {
    expect(
      AdminCreatePublicLinkSchema.safeParse({
        ...createPublicLinkInput,
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      }).success,
    ).toBe(false);
    expect(
      AdminUpdatePublicLinkSchema.safeParse({
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      }).success,
    ).toBe(false);

    expect(
      AdminCreatePublicLinkSchema.safeParse({
        ...createPublicLinkInput,
        personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        educationOrganizationId: 42,
      }).success,
    ).toBe(true);
  });

  it('continues to allow an optional education organization for PUBLIC links', () => {
    expect(
      AdminCreatePublicLinkSchema.safeParse({
        ...createPublicLinkInput,
        personalDataProcessingMode: 'PUBLIC',
        educationOrganizationId: 42,
      }).success,
    ).toBe(true);
  });

  it('accepts nullable organization identity, contact, and document fields', () => {
    const result = AdminCreateEducationOrganizationSchema.parse({
      name: 'Лицей 42',
      fullName: 'Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
      shortName: 'МАОУ «Лицей № 42»',
      inn: '1234567890',
      ogrn: '1234567890123',
      legalAddress: 'Казань, ул. Примерная, 1',
      email: 'office@example.edu',
      phone: '+7 900 000-00-00',
      privacyPolicyUrl: 'https://example.edu/privacy',
      consentDocumentUrl: null,
      logoUrl: 'https://example.edu/logo.svg',
    });

    expect(result).toMatchObject({
      shortName: 'МАОУ «Лицей № 42»',
      consentDocumentUrl: null,
    });
  });

  it.each(['privacyPolicyUrl', 'consentDocumentUrl', 'logoUrl'] as const)(
    'rejects an invalid non-null %s',
    (field) => {
      const result = AdminUpdateEducationOrganizationSchema.safeParse({ [field]: 'not-a-url' });

      expect(result.success).toBe(false);
    },
  );

  it.each(['privacyPolicyUrl', 'consentDocumentUrl', 'logoUrl'] as const)(
    'accepts HTTP(S) %s values in input and response schemas',
    (field) => {
      expect(
        AdminUpdateEducationOrganizationSchema.safeParse({
          [field]: 'http://example.edu/document',
        }).success,
      ).toBe(true);
      expect(
        AdminEducationOrganizationSchema.safeParse({
          ...educationOrganizationResponse,
          [field]: 'https://example.edu/document',
        }).success,
      ).toBe(true);
    },
  );

  it.each(['javascript:alert(1)', 'data:text/plain,private', 'ftp://example.edu/document'])(
    'rejects non-HTTP organization URLs in input and response schemas: %s',
    (url) => {
      for (const field of ['privacyPolicyUrl', 'consentDocumentUrl', 'logoUrl'] as const) {
        expect(AdminUpdateEducationOrganizationSchema.safeParse({ [field]: url }).success).toBe(
          false,
        );
        expect(
          AdminEducationOrganizationSchema.safeParse({
            ...educationOrganizationResponse,
            [field]: url,
          }).success,
        ).toBe(false);
      }
    },
  );

  it('returns the computed personal data readiness flag for an education organization', () => {
    const result = AdminEducationOrganizationSchema.parse(educationOrganizationResponse);

    expect(result.personalDataReady).toBe(true);
  });
});
