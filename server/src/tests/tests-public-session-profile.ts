import type { PublicSessionStartRequestDto } from './dto/tests-public.dto';
import {
  buildDemographicStudentKeyHash,
  buildEducationDemographicStudentKeyHash,
  buildStudentKeyHash,
} from './tests-domain.utils';
import type { AccessiblePublicLink, AttemptAllocationInput } from './tests-public-session.types';

type DemographicProfile = {
  studentGender: NonNullable<PublicSessionStartRequestDto['gender']>;
  studentAge: number;
  studentResidence: string;
  studentEducationLevel: NonNullable<PublicSessionStartRequestDto['educationLevel']>;
};

export class PublicSessionProfileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PublicSessionProfileValidationError';
  }
}

const validateEntryProfileMode = (
  link: AccessiblePublicLink,
  dto: PublicSessionStartRequestDto,
) => {
  if (dto.entryProfileMode && dto.entryProfileMode !== link.entryProfileMode) {
    throw new PublicSessionProfileValidationError('Анкета не соответствует настройкам ссылки');
  }
};

const matchesGroupPattern = (groupOrClass: string, pattern: string) => {
  try {
    return new RegExp(pattern, 'u').test(groupOrClass);
  } catch {
    return true;
  }
};

const validateGroupOrClassForLink = (groupOrClass: string, link: AccessiblePublicLink) => {
  const validationMode = link.educationOrganization?.groupValidationMode ?? 'NONE';
  const validationPattern = link.educationOrganization?.groupValidationPattern;

  if (validationMode !== 'STRICT' || !validationPattern) {
    return;
  }

  if (!matchesGroupPattern(groupOrClass, validationPattern)) {
    throw new PublicSessionProfileValidationError(
      link.educationOrganization?.groupValidationHint ||
        'Формат поля "Группа / класс" не соответствует требованиям учебного заведения',
    );
  }
};

const normalizeRequiredString = (value: string | undefined, message: string) => {
  const normalizedValue = value?.trim() ?? '';

  if (!normalizedValue) {
    throw new PublicSessionProfileValidationError(message);
  }

  return normalizedValue;
};

const resolveDemographicProfile = (dto: PublicSessionStartRequestDto): DemographicProfile => {
  if (!dto.gender) {
    throw new PublicSessionProfileValidationError('Укажите пол');
  }

  const studentAge = dto.age;

  if (
    studentAge === undefined ||
    !Number.isInteger(studentAge) ||
    studentAge < 1 ||
    studentAge > 120
  ) {
    throw new PublicSessionProfileValidationError('Укажите корректный возраст');
  }

  const studentResidence = normalizeRequiredString(dto.residence, 'Укажите место жительства');

  if (!dto.educationLevel) {
    throw new PublicSessionProfileValidationError('Укажите уровень образования');
  }

  return {
    studentGender: dto.gender,
    studentAge,
    studentResidence,
    studentEducationLevel: dto.educationLevel,
  };
};

export const resolvePublicSessionStartProfile = (
  link: AccessiblePublicLink,
  dto: PublicSessionStartRequestDto,
): AttemptAllocationInput => {
  validateEntryProfileMode(link, dto);

  if (link.entryProfileMode === 'DEMOGRAPHIC') {
    const demographicProfile = resolveDemographicProfile(dto);

    return {
      link,
      studentKeyHash: buildDemographicStudentKeyHash({
        publicLinkId: link.id,
        ...demographicProfile,
      }),
      profile: {
        studentName: null,
        studentLastInitial: null,
        studentMiddleInitial: null,
        educationOrganization: null,
        groupOrClass: null,
        studentGender: demographicProfile.studentGender,
        studentAge: demographicProfile.studentAge,
        studentResidence: demographicProfile.studentResidence,
        studentEducationLevel: demographicProfile.studentEducationLevel,
      },
    };
  }

  const isEducationDemographicMode = link.entryProfileMode === 'EDUCATION_DEMOGRAPHIC';
  const resolvedEducationOrganization =
    link.educationOrganization?.name ??
    normalizeRequiredString(
      dto.educationOrganization,
      'Учебное заведение обязательно для начала теста',
    );
  const studentName = normalizeRequiredString(dto.studentName, 'Укажите имя участника');
  const normalizedGroupOrClass = normalizeRequiredString(
    dto.groupOrClass,
    'Укажите группу или класс',
  );
  const demographicProfile = isEducationDemographicMode ? resolveDemographicProfile(dto) : null;
  let studentLastInitial: string | null = null;
  let studentMiddleInitial: string | null = null;
  let studentKeyHash: string;

  if (demographicProfile) {
    studentKeyHash = buildEducationDemographicStudentKeyHash({
      studentName,
      studentAge: demographicProfile.studentAge,
      educationOrganization: resolvedEducationOrganization,
      groupOrClass: normalizedGroupOrClass,
    });
  } else {
    studentLastInitial = normalizeRequiredString(
      dto.studentLastInitial,
      'Укажите первую букву фамилии',
    );
    studentMiddleInitial = normalizeRequiredString(
      dto.studentMiddleInitial,
      'Укажите первую букву отчества',
    );
    studentKeyHash = buildStudentKeyHash({
      studentName,
      studentLastInitial,
      studentMiddleInitial,
      educationOrganization: resolvedEducationOrganization,
      groupOrClass: normalizedGroupOrClass,
    });
  }

  validateGroupOrClassForLink(normalizedGroupOrClass, link);

  return {
    link,
    studentKeyHash,
    profile: {
      studentName,
      studentLastInitial,
      studentMiddleInitial,
      educationOrganization: resolvedEducationOrganization,
      groupOrClass: normalizedGroupOrClass,
      studentGender: demographicProfile?.studentGender ?? null,
      studentAge: demographicProfile?.studentAge ?? null,
      studentResidence: demographicProfile?.studentResidence ?? null,
      studentEducationLevel: demographicProfile?.studentEducationLevel ?? null,
    },
  };
};
