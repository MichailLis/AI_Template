import { BadRequestException } from '@nestjs/common';

import type { PublicSessionStartRequestDto } from '../dto/tests-public.dto';
import type { TestsPublicLinkService } from '../public-links/public-link.service';

/**
 * Entry-profile rules for a public session: which fields a link's mode requires, how a group or
 * class is validated against the organization's pattern, and how a demographic profile is read out
 * of the start request.
 *
 * These are decisions about values — no database, no settings lookup, no HTTP. They used to be
 * private methods on TestsPublicSessionService, where reaching them in a test meant standing up six
 * mocked collaborators that none of them touch.
 *
 * AccessiblePublicLink lives here rather than in the service because both halves need it and one
 * definition is better than two. The import that derives it is type-only, so nothing is pulled in
 * at runtime.
 */
export type AccessiblePublicLink = Awaited<
  ReturnType<TestsPublicLinkService['getAccessiblePublicLinkByCode']>
>;

export type DemographicProfile = {
  studentGender: NonNullable<PublicSessionStartRequestDto['gender']>;
  studentAge: number;
  studentResidence: string;
  studentEducationLevel: NonNullable<PublicSessionStartRequestDto['educationLevel']>;
};

export const matchesGroupPattern = (groupOrClass: string, pattern: string) => {
  try {
    return new RegExp(pattern, 'u').test(groupOrClass);
  } catch {
    return true;
  }
};

export const validateGroupOrClassForLink = (groupOrClass: string, link: AccessiblePublicLink) => {
  const validationMode = link.educationOrganization?.groupValidationMode ?? 'NONE';
  const validationPattern = link.educationOrganization?.groupValidationPattern;

  if (validationMode !== 'STRICT' || !validationPattern) {
    return;
  }

  if (!matchesGroupPattern(groupOrClass, validationPattern)) {
    throw new BadRequestException(
      link.educationOrganization?.groupValidationHint ||
        'Формат поля "Группа / класс" не соответствует требованиям учебного заведения',
    );
  }
};

export const normalizeRequiredString = (value: string | undefined, message: string) => {
  const normalizedValue = value?.trim() ?? '';

  if (!normalizedValue) {
    throw new BadRequestException(message);
  }

  return normalizedValue;
};

export const validateEntryProfileMode = (
  link: AccessiblePublicLink,
  dto: PublicSessionStartRequestDto,
) => {
  if (dto.entryProfileMode && dto.entryProfileMode !== link.entryProfileMode) {
    throw new BadRequestException('Анкета не соответствует настройкам ссылки');
  }
};

export const resolveDemographicProfile = (
  dto: PublicSessionStartRequestDto,
): DemographicProfile => {
  if (!dto.gender) {
    throw new BadRequestException('Укажите пол');
  }

  const studentAge = dto.age;

  if (
    studentAge === undefined ||
    !Number.isInteger(studentAge) ||
    studentAge < 1 ||
    studentAge > 120
  ) {
    throw new BadRequestException('Укажите корректный возраст');
  }

  const studentResidence = normalizeRequiredString(dto.residence, 'Укажите место жительства');

  if (!dto.educationLevel) {
    throw new BadRequestException('Укажите уровень образования');
  }

  return {
    studentGender: dto.gender,
    studentAge,
    studentResidence,
    studentEducationLevel: dto.educationLevel,
  };
};
