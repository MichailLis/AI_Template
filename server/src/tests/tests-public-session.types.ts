import type { mapSessionState } from './tests-attempt.mapper';
import type { PublicSessionStartRequestDto } from './dto/tests-public.dto';

export type SessionStateResponse = {
  session: ReturnType<typeof mapSessionState>;
};

export type AccessiblePublicLink = {
  id: number;
  topicVersionId: number;
  educationOrganizationId: number | null;
  personalDataProcessingMode: 'PUBLIC' | 'ON_BEHALF_OF_EDUCATION_ORGANIZATION';
  operatorFullNameSnapshot: string | null;
  operatorShortNameSnapshot: string | null;
  operatorPrivacyPolicyUrlSnapshot: string | null;
  operatorConsentDocumentUrlSnapshot: string | null;
  entryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';
  allowResume: boolean;
  maxAttemptsPerStudent: number;
  timeLimitMinutes: number | null;
  consentVersion: string;
  consentTextSnapshot: string;
  educationOrganization: {
    id: number;
    name: string;
    logoUrl: string | null;
    groupValidationMode: 'NONE' | 'HINT' | 'STRICT';
    groupValidationPattern: string | null;
    groupValidationHint: string | null;
  } | null;
};

type DemographicProfile = {
  studentGender: NonNullable<PublicSessionStartRequestDto['gender']>;
  studentAge: number;
  studentResidence: string;
  studentEducationLevel: NonNullable<PublicSessionStartRequestDto['educationLevel']>;
};

export type AttemptProfileSnapshot = {
  studentName: string | null;
  studentLastInitial: string | null;
  studentMiddleInitial: string | null;
  educationOrganization: string | null;
  groupOrClass: string | null;
  studentGender: DemographicProfile['studentGender'] | null;
  studentAge: number | null;
  studentResidence: string | null;
  studentEducationLevel: DemographicProfile['studentEducationLevel'] | null;
};

export type AttemptAllocationInput = {
  link: AccessiblePublicLink;
  studentKeyHash: string;
  profile: AttemptProfileSnapshot;
};
