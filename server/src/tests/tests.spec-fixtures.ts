import type { PublicSessionStartRequestDto } from './dto/tests-public.dto';

export type GroupValidationMode = 'NONE' | 'HINT' | 'STRICT';

export type AccessibleLinkFixture = {
  id: number;
  topicVersionId: number;
  allowResume: boolean;
  maxAttemptsPerStudent: number;
  timeLimitMinutes: number | null;
  consentVersion: string;
  consentTextSnapshot: string;
  educationOrganization: {
    name: string;
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
  allowResume: false,
  maxAttemptsPerStudent: 3,
  timeLimitMinutes: 30,
  consentVersion: 'v1',
  consentTextSnapshot: 'consent',
  educationOrganization: {
    name: 'Лицей 42',
    groupValidationMode: 'NONE',
    groupValidationPattern: null,
    groupValidationHint: null,
  },
  ...overrides,
});

export const createPublicSessionStartDto = (
  overrides: Partial<PublicSessionStartRequestDto> = {},
): PublicSessionStartRequestDto => ({
  studentName: 'Иван',
  studentLastInitial: 'И',
  studentMiddleInitial: 'О',
  educationOrganization: 'Ввод из формы',
  groupOrClass: ' ИС-21 ',
  consentAccepted: true,
  ...overrides,
});

export const createPublicSessionStateResponse = (sessionToken: string) => ({
  session: {
    sessionToken,
    shortCode: 'ABC123',
    attemptNumber: 1,
    status: 'IN_PROGRESS' as const,
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
  isActive: true,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  createdAt: new Date('2026-02-15T10:00:00.000Z'),
  updatedAt: new Date('2026-02-15T10:00:00.000Z'),
  ...overrides,
});
