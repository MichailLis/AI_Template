import {
  PersonalDataSchema,
  PublicBrandingConfigSchema,
  PublicLinkAccessResponseSchema,
  PublicTestQuestionSchema,
  PublicSessionAnalysisSchema,
  PublicSessionResultResponseSchema,
  PublicSessionStateSchema,
  PublicSessionStartRequestSchema,
} from './tests-public.dto';

describe('tests public DTO schemas', () => {
  const publicBranding = {
    version: 1,
    background: {
      mode: 'image',
      color: '#f2f7fb',
      imageUrl: 'https://cdn.example.com/background.png',
      overlay: 0.32,
    },
    header: {
      logos: [{ url: 'https://cdn.example.com/logo.svg', alt: 'Client logo', size: 'md' }],
    },
    buttons: { primaryColor: '#0066cc', textColor: '#ffffff' },
    surfaces: { cardColor: '#ffffff', borderColor: '#d4dee8' },
    accents: { accentColor: '#00a889' },
  };

  it('accepts public branding config for STANDARD public pages', () => {
    expect(PublicBrandingConfigSchema.parse(publicBranding)).toEqual(publicBranding);
  });

  it('rejects unsafe public branding values', () => {
    expect(() =>
      PublicBrandingConfigSchema.parse({
        version: 1,
        buttons: { primaryColor: 'blue' },
      }),
    ).toThrow();

    expect(() =>
      PublicBrandingConfigSchema.parse({
        version: 1,
        header: {
          logos: [
            { url: 'https://cdn.example.com/logo-1.svg', alt: 'Logo 1' },
            { url: 'https://cdn.example.com/logo-2.svg', alt: 'Logo 2' },
            { url: 'https://cdn.example.com/logo-3.svg', alt: 'Logo 3' },
          ],
        },
      }),
    ).toThrow();

    expect(() =>
      PublicBrandingConfigSchema.parse({
        version: 1,
        background: { mode: 'image', imageUrl: 'http://cdn.example.com/background.png' },
      }),
    ).toThrow();
  });

  it('accepts a demographic start payload', () => {
    const result = PublicSessionStartRequestSchema.parse({
      entryProfileMode: 'DEMOGRAPHIC',
      gender: 'FEMALE',
      age: 17,
      residence: 'Казань',
      educationLevel: 'SECONDARY_GENERAL',
      consentAccepted: true,
    });

    expect(result).toMatchObject({
      entryProfileMode: 'DEMOGRAPHIC',
      gender: 'FEMALE',
      age: 17,
      residence: 'Казань',
      educationLevel: 'SECONDARY_GENERAL',
      consentAccepted: true,
    });
  });

  it('accepts an education start payload', () => {
    const result = PublicSessionStartRequestSchema.parse({
      entryProfileMode: 'EDUCATION',
      studentName: 'Иван',
      studentLastInitial: 'П',
      studentMiddleInitial: 'С',
      educationOrganization: 'Лицей 42',
      groupOrClass: '10А',
      consentAccepted: true,
    });

    expect(result).toMatchObject({
      entryProfileMode: 'EDUCATION',
      studentName: 'Иван',
      studentLastInitial: 'П',
      studentMiddleInitial: 'С',
      educationOrganization: 'Лицей 42',
      groupOrClass: '10А',
      consentAccepted: true,
    });
  });

  it('accepts an education and demographic start payload', () => {
    const result = PublicSessionStartRequestSchema.parse({
      entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
      studentName: 'Иван',
      educationOrganization: 'Лицей 42',
      groupOrClass: '10А',
      gender: 'MALE',
      age: 18,
      residence: 'Казань',
      educationLevel: 'SECONDARY_SPECIAL',
      consentAccepted: true,
    });

    expect(result).toMatchObject({
      entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
      studentName: 'Иван',
      educationOrganization: 'Лицей 42',
      groupOrClass: '10А',
      gender: 'MALE',
      age: 18,
      residence: 'Казань',
      educationLevel: 'SECONDARY_SPECIAL',
      consentAccepted: true,
    });
  });

  it('exposes entry profile mode in public link access response', () => {
    const result = PublicLinkAccessResponseSchema.parse({
      shortCode: 'DEMO2026',
      title: 'Профориентация',
      description: null,
      entryProfileMode: 'DEMOGRAPHIC',
      publicTemplate: 'POLUS',
      publicBranding,
      educationOrganization: null,
      groupValidationMode: 'NONE',
      groupValidationPattern: null,
      groupValidationExample: null,
      groupValidationHint: null,
      questionCount: 10,
      maxAttemptsPerStudent: 1,
      timeLimitMinutes: 30,
      allowResume: true,
      startsAt: null,
      endsAt: null,
      consentVersion: 'v1',
      consentText: 'Согласие',
      personalData: {
        processingMode: 'PUBLIC',
        operatorFullName: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
        operatorShortName: null,
        privacyPolicyUrl: '/privacy',
        consentDocumentUrl: null,
        logoUrl: null,
      },
    });

    expect(result.entryProfileMode).toBe('DEMOGRAPHIC');
    expect(result.publicTemplate).toBe('POLUS');
    expect(result.publicBranding).toEqual(publicBranding);
    expect(result.personalData.processingMode).toBe('PUBLIC');
  });

  it('exposes a reusable personal data contract for an education organization operator', () => {
    const result = PersonalDataSchema.parse({
      processingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      operatorFullName: 'Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
      operatorShortName: 'МАОУ «Лицей № 42»',
      privacyPolicyUrl: 'https://example.edu/privacy',
      consentDocumentUrl: 'https://example.edu/consent',
      logoUrl: 'https://example.edu/logo.svg',
    });

    expect(result.operatorShortName).toBe('МАОУ «Лицей № 42»');
  });

  it('requires nullable personal data fields to be present while accepting null', () => {
    expect(
      PersonalDataSchema.safeParse({
        processingMode: 'PUBLIC',
        operatorFullName: 'Platform operator',
        privacyPolicyUrl: '/privacy',
      }).success,
    ).toBe(false);

    expect(
      PersonalDataSchema.safeParse({
        processingMode: 'PUBLIC',
        operatorFullName: 'Platform operator',
        operatorShortName: null,
        privacyPolicyUrl: '/privacy',
        consentDocumentUrl: null,
        logoUrl: null,
      }).success,
    ).toBe(true);
  });

  it('exposes public template in session state and result responses', () => {
    const session = PublicSessionStateSchema.parse({
      sessionToken: 'session-token',
      shortCode: 'DEMO2026',
      publicTemplate: 'POLUS',
      publicBranding,
      attemptNumber: 1,
      status: 'IN_PROGRESS',
      startedAt: '2026-05-14T10:00:00.000Z',
      expiresAt: null,
      finishedAt: null,
      timeLimitMinutes: 30,
      questions: [],
      answers: [],
    });
    const result = PublicSessionResultResponseSchema.parse({
      sessionToken: 'session-token',
      publicTemplate: 'POLUS',
      publicBranding,
      status: 'COMPLETED',
      finishedAt: '2026-05-14T10:30:00.000Z',
      analysis: {
        providerMode: 'STUB',
        status: 'READY',
        summary: null,
        errorMessage: null,
        generatedAt: '2026-05-14T10:30:01.000Z',
      },
      professionAtlasUrl: null,
    });

    expect(session.publicTemplate).toBe('POLUS');
    expect(result.publicTemplate).toBe('POLUS');
    expect(session.publicBranding).toEqual(publicBranding);
    expect(result.publicBranding).toEqual(publicBranding);
  });

  it('strips internal raw analysis text from public analysis payloads', () => {
    const result = PublicSessionAnalysisSchema.parse({
      providerMode: 'LLM',
      status: 'READY',
      summary: null,
      rawText: 'internal provider output',
      errorMessage: null,
      generatedAt: '2026-05-14T10:30:01.000Z',
    });

    expect(result).not.toHaveProperty('rawText');
  });

  it('exposes public analysis summaries only as JSON objects or null', () => {
    expect(() =>
      PublicSessionAnalysisSchema.parse({
        providerMode: 'LLM',
        status: 'READY',
        summary: {
          introduction: 'Краткий результат',
        },
        errorMessage: null,
        generatedAt: '2026-05-14T10:30:01.000Z',
      }),
    ).not.toThrow();

    expect(() =>
      PublicSessionAnalysisSchema.parse({
        providerMode: 'LLM',
        status: 'READY',
        summary: 'not-an-object',
        errorMessage: null,
        generatedAt: '2026-05-14T10:30:01.000Z',
      }),
    ).toThrow();
  });

  it('exposes question settings only as JSON objects or null', () => {
    expect(() =>
      PublicTestQuestionSchema.parse({
        id: 1,
        type: 'SLIDER',
        title: 'Шкала интереса',
        description: null,
        required: true,
        order: 1,
        settings: {
          min: 1,
          max: 10,
          step: 1,
        },
        options: [],
        sliderBands: [],
      }),
    ).not.toThrow();

    expect(() =>
      PublicTestQuestionSchema.parse({
        id: 1,
        type: 'SLIDER',
        title: 'Шкала интереса',
        description: null,
        required: true,
        order: 1,
        settings: 'not-an-object',
        options: [],
        sliderBands: [],
      }),
    ).toThrow();
  });
});
