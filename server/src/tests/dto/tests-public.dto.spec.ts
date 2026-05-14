import {
  PublicLinkAccessResponseSchema,
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

  it('exposes entry profile mode in public link access response', () => {
    const result = PublicLinkAccessResponseSchema.parse({
      shortCode: 'DEMO2026',
      title: 'Профориентация',
      description: null,
      entryProfileMode: 'DEMOGRAPHIC',
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
  });
});
