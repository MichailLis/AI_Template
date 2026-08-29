import type { PublicSessionStartRequestDto } from '../dto/tests-public.dto';
import type { SessionStateResponse } from '../session/public-session.service';

export type GroupValidationMode = 'NONE' | 'HINT' | 'STRICT';
export type EntryProfileMode = 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';

export type AccessibleLinkFixture = {
  id: number;
  topicVersionId: number;
  educationOrganizationId: number | null;
  personalDataProcessingMode: 'PUBLIC' | 'ON_BEHALF_OF_EDUCATION_ORGANIZATION';
  operatorFullNameSnapshot: string | null;
  operatorShortNameSnapshot: string | null;
  operatorPrivacyPolicyUrlSnapshot: string | null;
  operatorConsentDocumentUrlSnapshot: string | null;
  entryProfileMode: EntryProfileMode;
  allowResume: boolean;
  maxAttemptsPerStudent: number;
  timeLimitMinutes: number | null;
  consentVersion: string;
  consentTextSnapshot: string;
  educationOrganization: {
    id: number;
    name: string;
    logoUrl: string | null;
    groupValidationMode: GroupValidationMode;
    groupValidationPattern: string | null;
    groupValidationHint: string | null;
  } | null;
};

export const createAccessibleLinkFixture = (
  overrides: Partial<AccessibleLinkFixture> = {},
): AccessibleLinkFixture => ({
  id: 100,
  topicVersionId: 200,
  educationOrganizationId: 42,
  personalDataProcessingMode: 'PUBLIC',
  operatorFullNameSnapshot: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
  operatorShortNameSnapshot: null,
  operatorPrivacyPolicyUrlSnapshot: '/privacy',
  operatorConsentDocumentUrlSnapshot: null,
  entryProfileMode: 'EDUCATION',
  allowResume: false,
  maxAttemptsPerStudent: 3,
  timeLimitMinutes: 30,
  consentVersion: 'v1',
  consentTextSnapshot: 'consent',
  educationOrganization: {
    id: 42,
    name: 'Лицей 42',
    logoUrl: null,
    groupValidationMode: 'NONE',
    groupValidationPattern: null,
    groupValidationHint: null,
  },
  ...overrides,
});

export const createPublicSessionStartDto = (
  overrides: Partial<PublicSessionStartRequestDto> = {},
): PublicSessionStartRequestDto => ({
  entryProfileMode: 'EDUCATION',
  studentName: 'Иван',
  studentLastInitial: 'И',
  studentMiddleInitial: 'О',
  educationOrganization: 'Ввод из формы',
  groupOrClass: ' ИС-21 ',
  consentAccepted: true,
  ...overrides,
});

export const createPublicSessionDemographicStartDto = (
  overrides: Partial<PublicSessionStartRequestDto> = {},
): PublicSessionStartRequestDto => ({
  entryProfileMode: 'DEMOGRAPHIC',
  gender: 'FEMALE',
  age: 17,
  residence: 'Казань',
  educationLevel: 'SECONDARY_GENERAL',
  consentAccepted: true,
  ...overrides,
});

export const createPublicSessionEducationDemographicStartDto = (
  overrides: Partial<PublicSessionStartRequestDto> = {},
): PublicSessionStartRequestDto => ({
  entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
  studentName: 'Иван',
  educationOrganization: 'Ввод из формы',
  groupOrClass: ' ИС-21 ',
  gender: 'FEMALE',
  age: 17,
  residence: 'Казань',
  educationLevel: 'SECONDARY_GENERAL',
  consentAccepted: true,
  ...overrides,
});

/**
 * Annotated with the service's own return type so the fixture cannot drift away from what
 * getSessionByToken actually resolves to. Without the annotation a spec could stub the method
 * with a shape the real one never produces, and the stub would still compile.
 */
export const createPublicSessionStateResponse = (sessionToken: string): SessionStateResponse => ({
  session: {
    sessionToken,
    shortCode: 'ABC123',
    publicTemplate: 'STANDARD',
    publicBranding: null,
    attemptNumber: 1,
    status: 'IN_PROGRESS',
    startedAt: new Date('2026-02-15T10:00:00.000Z').toISOString(),
    expiresAt: null,
    finishedAt: null,
    timeLimitMinutes: 30,
    questions: [],
    answers: [],
  },
});

export type EducationOrganizationRecordFixture = {
  id: number;
  name: string;
  fullName: string | null;
  shortName: string | null;
  inn: string | null;
  ogrn: string | null;
  legalAddress: string | null;
  email: string | null;
  phone: string | null;
  privacyPolicyUrl: string | null;
  consentDocumentUrl: string | null;
  logoUrl: string | null;
  isActive: boolean;
  groupValidationMode: GroupValidationMode;
  groupValidationPattern: string | null;
  groupValidationExample: string | null;
  groupValidationHint: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export const createEducationOrganizationRecordFixture = (
  overrides: Partial<EducationOrganizationRecordFixture> = {},
): EducationOrganizationRecordFixture => ({
  id: 1,
  name: 'Лицей 42',
  fullName: null,
  shortName: null,
  inn: null,
  ogrn: null,
  legalAddress: null,
  email: null,
  phone: null,
  privacyPolicyUrl: null,
  consentDocumentUrl: null,
  logoUrl: null,
  isActive: true,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  createdAt: new Date('2026-02-15T10:00:00.000Z'),
  updatedAt: new Date('2026-02-15T10:00:00.000Z'),
  ...overrides,
});
