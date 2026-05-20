import {
  PublicLinkAccessResponseSchema,
  PublicSessionAnalysisSchema,
  PublicSessionResultResponseSchema,
  PublicSessionStateSchema,
  PublicSessionStartRequestSchema,
} from './tests-public.dto';

describe('tests public DTO schemas', () => {
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
    });

    expect(result.entryProfileMode).toBe('DEMOGRAPHIC');
    expect(result.publicTemplate).toBe('POLUS');
  });

  it('exposes public template in session state and result responses', () => {
    const session = PublicSessionStateSchema.parse({
      sessionToken: 'session-token',
      shortCode: 'DEMO2026',
      publicTemplate: 'POLUS',
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
});
