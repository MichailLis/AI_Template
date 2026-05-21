import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import type { TestQuestionType } from '@prisma/client';

import type { UpsertTestsQuestionDto } from './dto/tests.dto';

const isInputJsonValue = (value: unknown): value is Prisma.InputJsonValue => {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((item) => item === null || isInputJsonValue(item));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.values(value).every((item) => item === null || isInputJsonValue(item));
  }

  return false;
};

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const toPrismaSettingsInput = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return Prisma.JsonNull;
  }

  if (!isInputJsonValue(value)) {
    throw new BadRequestException('Question settings must be valid JSON');
  }

  return value;
};

export const toPrismaRequiredJsonInput = (
  value: unknown,
): Prisma.InputJsonValue | Prisma.JsonNullValueInput => {
  if (value === null) {
    return Prisma.JsonNull;
  }

  if (!isInputJsonValue(value)) {
    throw new BadRequestException('Value must be valid JSON');
  }

  return value;
};

export const normalizeSlug = (value: string) => {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
};

export const normalizeStudentIdentityPart = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 300);

export const buildStudentKeyHash = (input: {
  studentName: string;
  studentLastInitial: string;
  studentMiddleInitial: string;
  educationOrganization: string;
  groupOrClass: string;
}) => {
  const fingerprint = [
    normalizeStudentIdentityPart(input.studentName),
    normalizeStudentIdentityPart(input.studentLastInitial),
    normalizeStudentIdentityPart(input.studentMiddleInitial),
    normalizeStudentIdentityPart(input.educationOrganization),
    normalizeStudentIdentityPart(input.groupOrClass),
  ].join('|');

  return createHash('sha256').update(fingerprint).digest('hex');
};

export const buildEducationDemographicStudentKeyHash = (input: {
  studentName: string;
  studentAge: number;
  educationOrganization: string;
  groupOrClass: string;
}) => {
  const fingerprint = [
    normalizeStudentIdentityPart(input.studentName),
    String(input.studentAge),
    normalizeStudentIdentityPart(input.educationOrganization),
    normalizeStudentIdentityPart(input.groupOrClass),
  ].join('|');

  return createHash('sha256').update(fingerprint).digest('hex');
};

export const buildDemographicStudentKeyHash = (input: {
  publicLinkId: number;
  studentGender: string;
  studentAge: number;
  studentResidence: string;
  studentEducationLevel: string;
}) => {
  const fingerprint = [
    'demographic',
    String(input.publicLinkId),
    input.studentGender,
    String(input.studentAge),
    normalizeStudentIdentityPart(input.studentResidence),
    input.studentEducationLevel,
  ].join('|');

  return createHash('sha256').update(fingerprint).digest('hex');
};

export const createRandomToken = (size = 24) => randomBytes(size).toString('hex');

export const createShortCodeCandidate = (length = 8) => {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = randomBytes(length);

  return Array.from(bytes, (value) => alphabet[value % alphabet.length]).join('');
};

export const parseSliderSettings = (settings: unknown) => {
  if (typeof settings !== 'object' || settings === null) {
    return null;
  }

  const record = settings as Record<string, unknown>;
  const min = typeof record.min === 'number' ? record.min : null;
  const max = typeof record.max === 'number' ? record.max : null;
  const step = typeof record.step === 'number' ? record.step : null;

  if (min === null || max === null || step === null) {
    return null;
  }

  if (!Number.isFinite(min) || !Number.isFinite(max) || !Number.isFinite(step)) {
    return null;
  }

  if (max <= min || step <= 0) {
    return null;
  }

  return { min, max, step };
};

export const mapQuestion = (question: {
  id: number;
  type: TestQuestionType;
  title: string;
  description: string | null;
  required: boolean;
  order: number;
  settings: unknown;
  options: Array<{
    id: number;
    label: string;
    value: string;
    weight: number;
    order: number;
  }>;
  sliderBands: Array<{
    id: number;
    minValue: number;
    maxValue: number;
    label: string;
    weight: number;
    order: number;
  }>;
}) => {
  return {
    id: question.id,
    type: question.type,
    title: question.title,
    description: question.description,
    required: question.required,
    order: question.order,
    settings: isJsonObject(question.settings) ? question.settings : null,
    options: question.options,
    sliderBands: question.sliderBands,
  };
};

export const validateDraftForPublish = (draft: {
  questions: Array<{
    type: TestQuestionType;
    title: string;
    order: number;
    settings: unknown;
    options: Array<{ id: number }>;
    sliderBands: Array<{ minValue: number; maxValue: number }>;
  }>;
}) => {
  if (draft.questions.length === 0) {
    throw new BadRequestException('Draft must contain at least one question before publish');
  }

  const seenOrder = new Set<number>();

  for (const question of draft.questions) {
    if (seenOrder.has(question.order)) {
      throw new BadRequestException('Questions order must be unique within draft');
    }
    seenOrder.add(question.order);

    if (question.type === 'SINGLE_CHOICE' || question.type === 'MULTI_CHOICE') {
      if (question.options.length < 2) {
        throw new BadRequestException(`Question "${question.title}" requires at least two options`);
      }
    }

    if (question.type === 'SLIDER') {
      const sliderSettings = parseSliderSettings(question.settings);

      if (!sliderSettings) {
        throw new BadRequestException(`Slider question "${question.title}" has invalid settings`);
      }

      for (const band of question.sliderBands) {
        if (band.maxValue <= band.minValue) {
          throw new BadRequestException(
            `Slider question "${question.title}" has invalid score range`,
          );
        }
      }
    }
  }
};

export const prepareQuestionPayload = (dto: UpsertTestsQuestionDto) => {
  const options =
    dto.type === 'SINGLE_CHOICE' || dto.type === 'MULTI_CHOICE'
      ? (dto.options ?? []).map((option, index) => ({
          label: option.label,
          value: option.value,
          weight: option.weight,
          order: index + 1,
        }))
      : [];

  const sliderBands =
    dto.type === 'SLIDER'
      ? (dto.sliderBands ?? []).map((band, index) => {
          if (band.maxValue <= band.minValue) {
            throw new BadRequestException('Slider band maxValue must be greater than minValue');
          }

          return {
            minValue: band.minValue,
            maxValue: band.maxValue,
            label: band.label,
            weight: band.weight,
            order: index + 1,
          };
        })
      : [];

  return {
    type: dto.type,
    title: dto.title,
    description: dto.description ?? null,
    required: dto.required,
    settings: dto.settings,
    options,
    sliderBands,
  };
};
