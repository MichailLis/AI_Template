import type {
  Prisma,
  TestEntryProfileMode,
  TestStudentAttemptStatus,
  TestStudentEducationLevel,
  TestStudentGender,
} from '@prisma/client';

import type { AttemptWithSessionData } from './tests-attempt.query';

const toIso = (value: Date | null) => {
  return value ? value.toISOString() : null;
};

const mapPublicQuestion = (
  question: AttemptWithSessionData['topicVersion']['questions'][number],
) => {
  return {
    id: question.id,
    type: question.type,
    title: question.title,
    description: question.description,
    required: question.required,
    order: question.order,
    settings: question.settings ?? null,
    options: question.options.map((option) => ({
      id: option.id,
      label: option.label,
      value: option.value,
      order: option.order,
    })),
    sliderBands: question.sliderBands.map((band) => ({
      id: band.id,
      minValue: band.minValue,
      maxValue: band.maxValue,
      label: band.label,
      order: band.order,
    })),
  };
};

interface AttemptDetailRecord {
  id: number;
  status: TestStudentAttemptStatus;
  publicLink: {
    id: number;
    shortCode: string;
    entryProfileMode?: TestEntryProfileMode;
  };
  attemptNumber: number;
  studentName: string | null;
  studentLastInitial: string | null;
  studentMiddleInitial: string | null;
  educationOrganization: string | null;
  groupOrClass: string | null;
  studentGender: TestStudentGender | null;
  studentAge: number | null;
  studentResidence: string | null;
  studentEducationLevel: TestStudentEducationLevel | null;
  consentAcceptedAt: Date;
  consentVersion: string;
  startedAt: Date;
  finishedAt: Date | null;
  expiresAt: Date | null;
  answers: Array<{
    questionId: number;
    questionTypeSnapshot: string;
    questionTitleSnapshot: string;
    answerPayload: Prisma.JsonValue;
    updatedAt: Date;
  }>;
  analysis: {
    providerMode: string;
    status: string;
    summary: Prisma.JsonValue;
    rawText: string | null;
    errorMessage: string | null;
    generatedAt: Date | null;
  } | null;
}

interface AttemptListRecord {
  id: number;
  status: TestStudentAttemptStatus;
  attemptNumber: number;
  studentName: string | null;
  studentLastInitial: string | null;
  studentMiddleInitial: string | null;
  educationOrganization: string | null;
  groupOrClass: string | null;
  studentGender: TestStudentGender | null;
  studentAge: number | null;
  studentResidence: string | null;
  studentEducationLevel: TestStudentEducationLevel | null;
  startedAt: Date;
  finishedAt: Date | null;
  expiresAt: Date | null;
  analysis: {
    status: string;
  } | null;
  publicLink?: {
    entryProfileMode: TestEntryProfileMode;
  };
}

type AttemptProfileRecord = Pick<
  AttemptDetailRecord,
  | 'studentName'
  | 'studentLastInitial'
  | 'studentMiddleInitial'
  | 'educationOrganization'
  | 'groupOrClass'
  | 'studentGender'
  | 'studentAge'
  | 'studentResidence'
  | 'studentEducationLevel'
>;

const inferAttemptProfileMode = (attempt: AttemptProfileRecord) => {
  const hasEducationProfile =
    Boolean(attempt.studentName) ||
    Boolean(attempt.studentLastInitial) ||
    Boolean(attempt.studentMiddleInitial) ||
    Boolean(attempt.educationOrganization) ||
    Boolean(attempt.groupOrClass);
  const hasDemographicProfile =
    attempt.studentGender ||
    attempt.studentAge !== null ||
    attempt.studentResidence ||
    attempt.studentEducationLevel;
  if (hasEducationProfile && hasDemographicProfile) {
    return 'EDUCATION_DEMOGRAPHIC';
  }

  if (hasDemographicProfile) {
    return 'DEMOGRAPHIC';
  }

  return 'EDUCATION';
};

const mapAttemptProfile = (
  attempt: AttemptProfileRecord & { publicLink?: { entryProfileMode?: TestEntryProfileMode } },
) => {
  const entryProfileMode = attempt.publicLink?.entryProfileMode ?? inferAttemptProfileMode(attempt);

  return {
    entryProfileMode,
    studentName: attempt.studentName,
    studentLastInitial: attempt.studentLastInitial,
    studentMiddleInitial: attempt.studentMiddleInitial,
    educationOrganization: attempt.educationOrganization,
    groupOrClass: attempt.groupOrClass,
    studentGender: attempt.studentGender,
    studentAge: attempt.studentAge,
    studentResidence: attempt.studentResidence,
    studentEducationLevel: attempt.studentEducationLevel,
  };
};

export const mapSessionState = (
  attempt: AttemptWithSessionData,
  toAttemptStatus: (attempt: AttemptWithSessionData) => string,
) => {
  return {
    sessionToken: attempt.resumeToken,
    shortCode: attempt.publicLink.shortCode,
    publicTemplate: attempt.publicLink.publicTemplate,
    attemptNumber: attempt.attemptNumber,
    status: toAttemptStatus(attempt),
    startedAt: attempt.startedAt.toISOString(),
    expiresAt: toIso(attempt.expiresAt),
    finishedAt: toIso(attempt.finishedAt),
    timeLimitMinutes: attempt.publicLink.timeLimitMinutes,
    questions: attempt.topicVersion.questions.map((question) => mapPublicQuestion(question)),
    answers: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      answerPayload: answer.answerPayload,
      updatedAt: answer.updatedAt.toISOString(),
    })),
  };
};

export const mapAttemptListItem = (
  attempt: AttemptListRecord,
  toAttemptStatus: (attempt: AttemptListRecord) => string,
) => {
  return {
    attemptId: attempt.id,
    attemptNumber: attempt.attemptNumber,
    status: toAttemptStatus(attempt),
    ...mapAttemptProfile(attempt),
    startedAt: attempt.startedAt.toISOString(),
    finishedAt: toIso(attempt.finishedAt),
    expiresAt: toIso(attempt.expiresAt),
    analysisStatus: attempt.analysis?.status ?? null,
  };
};

export const mapAttemptDetail = (
  attempt: AttemptDetailRecord,
  toAttemptStatus: (attempt: AttemptDetailRecord) => string,
  professionAtlasUrl: string | null = null,
) => {
  return {
    attemptId: attempt.id,
    publicLinkId: attempt.publicLink.id,
    shortCode: attempt.publicLink.shortCode,
    professionAtlasUrl,
    attemptNumber: attempt.attemptNumber,
    status: toAttemptStatus(attempt),
    ...mapAttemptProfile(attempt),
    consentAcceptedAt: attempt.consentAcceptedAt.toISOString(),
    consentVersion: attempt.consentVersion,
    startedAt: attempt.startedAt.toISOString(),
    finishedAt: toIso(attempt.finishedAt),
    expiresAt: toIso(attempt.expiresAt),
    answers: attempt.answers.map((answer) => ({
      questionId: answer.questionId,
      questionType: answer.questionTypeSnapshot,
      questionTitle: answer.questionTitleSnapshot,
      answerPayload: answer.answerPayload,
      updatedAt: answer.updatedAt.toISOString(),
    })),
    analysis: attempt.analysis
      ? {
          providerMode: attempt.analysis.providerMode,
          status: attempt.analysis.status,
          summary: attempt.analysis.summary,
          rawText: attempt.analysis.rawText,
          errorMessage: attempt.analysis.errorMessage,
          generatedAt: toIso(attempt.analysis.generatedAt),
        }
      : null,
  };
};

export const toOptionalIsoString = toIso;
