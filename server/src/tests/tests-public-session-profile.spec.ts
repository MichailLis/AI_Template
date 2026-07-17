import {
  buildDemographicStudentKeyHash,
  buildEducationDemographicStudentKeyHash,
  buildStudentKeyHash,
} from './tests-domain.utils';
import { resolvePublicSessionStartProfile } from './tests-public-session-profile';
import {
  createAccessibleLinkFixture,
  createPublicSessionDemographicStartDto,
  createPublicSessionEducationDemographicStartDto,
  createPublicSessionStartDto,
} from './tests.spec-fixtures';

describe('resolvePublicSessionStartProfile', () => {
  it('resolves EDUCATION profile with trimmed persisted fields and legacy student key hash', () => {
    const link = createAccessibleLinkFixture({
      entryProfileMode: 'EDUCATION',
      educationOrganization: null,
    });
    const dto = createPublicSessionStartDto({
      studentName: '  Alice   Example  ',
      studentLastInitial: ' E ',
      studentMiddleInitial: ' Q ',
      educationOrganization: '  Custom School  ',
      groupOrClass: '  10A  ',
      gender: 'FEMALE',
      age: 17,
      residence: 'Ignored City',
      educationLevel: 'SECONDARY_GENERAL',
    });

    const result = resolvePublicSessionStartProfile(link, dto);

    expect(result).toEqual({
      link,
      studentKeyHash: buildStudentKeyHash({
        studentName: 'Alice   Example',
        studentLastInitial: 'E',
        studentMiddleInitial: 'Q',
        educationOrganization: 'Custom School',
        groupOrClass: '10A',
      }),
      profile: {
        studentName: 'Alice   Example',
        studentLastInitial: 'E',
        studentMiddleInitial: 'Q',
        educationOrganization: 'Custom School',
        groupOrClass: '10A',
        studentGender: null,
        studentAge: null,
        studentResidence: null,
        studentEducationLevel: null,
      },
    });
  });

  it('resolves EDUCATION_DEMOGRAPHIC with link organization, demographic fields, and hybrid hash', () => {
    const link = createAccessibleLinkFixture({
      entryProfileMode: 'EDUCATION_DEMOGRAPHIC',
      educationOrganization: {
        id: 42,
        name: 'Linked Lyceum',
        logoUrl: null,
        groupValidationMode: 'NONE',
        groupValidationPattern: null,
        groupValidationHint: null,
      },
    });

    const result = resolvePublicSessionStartProfile(
      link,
      createPublicSessionEducationDemographicStartDto({
        studentName: '  Ivan  ',
        educationOrganization: 'Ignored School',
        groupOrClass: '  11B  ',
        gender: 'MALE',
        age: 18,
        residence: '  Kazan  ',
        educationLevel: 'SECONDARY_SPECIAL',
        studentLastInitial: 'I',
        studentMiddleInitial: 'P',
      }),
    );

    expect(result.studentKeyHash).toBe(
      buildEducationDemographicStudentKeyHash({
        studentName: 'Ivan',
        studentAge: 18,
        educationOrganization: 'Linked Lyceum',
        groupOrClass: '11B',
      }),
    );
    expect(result.profile).toEqual({
      studentName: 'Ivan',
      studentLastInitial: null,
      studentMiddleInitial: null,
      educationOrganization: 'Linked Lyceum',
      groupOrClass: '11B',
      studentGender: 'MALE',
      studentAge: 18,
      studentResidence: 'Kazan',
      studentEducationLevel: 'SECONDARY_SPECIAL',
    });
  });

  it('resolves DEMOGRAPHIC with only demographic snapshot fields and link-scoped hash', () => {
    const link = createAccessibleLinkFixture({
      id: 777,
      entryProfileMode: 'DEMOGRAPHIC',
      educationOrganization: null,
    });

    const result = resolvePublicSessionStartProfile(
      link,
      createPublicSessionDemographicStartDto({
        gender: 'FEMALE',
        age: 19,
        residence: '  Kazan   Center  ',
        educationLevel: 'HIGHER',
        studentName: 'Ignored',
        groupOrClass: 'Ignored',
      }),
    );

    expect(result).toEqual({
      link,
      studentKeyHash: buildDemographicStudentKeyHash({
        publicLinkId: 777,
        studentGender: 'FEMALE',
        studentAge: 19,
        studentResidence: 'Kazan   Center',
        studentEducationLevel: 'HIGHER',
      }),
      profile: {
        studentName: null,
        studentLastInitial: null,
        studentMiddleInitial: null,
        educationOrganization: null,
        groupOrClass: null,
        studentGender: 'FEMALE',
        studentAge: 19,
        studentResidence: 'Kazan   Center',
        studentEducationLevel: 'HIGHER',
      },
    });
  });

  it('rejects STRICT group validation mismatches with the configured hint', () => {
    const link = createAccessibleLinkFixture({
      educationOrganization: {
        id: 42,
        name: 'Linked Lyceum',
        logoUrl: null,
        groupValidationMode: 'STRICT',
        groupValidationPattern: '^\\d{2}[A-Z]$',
        groupValidationHint: 'Group format mismatch',
      },
    });

    expect(() =>
      resolvePublicSessionStartProfile(
        link,
        createPublicSessionStartDto({ groupOrClass: 'invalid' }),
      ),
    ).toThrow('Group format mismatch');
  });

  it('keeps invalid configured STRICT regex fail-open behavior', () => {
    const link = createAccessibleLinkFixture({
      educationOrganization: {
        id: 42,
        name: 'Linked Lyceum',
        logoUrl: null,
        groupValidationMode: 'STRICT',
        groupValidationPattern: '[',
        groupValidationHint: 'Group format mismatch',
      },
    });

    expect(() =>
      resolvePublicSessionStartProfile(
        link,
        createPublicSessionStartDto({ groupOrClass: 'any value' }),
      ),
    ).not.toThrow();
  });

  it('rejects entry profile mode mismatches before hashing', () => {
    expect(() =>
      resolvePublicSessionStartProfile(
        createAccessibleLinkFixture({ entryProfileMode: 'DEMOGRAPHIC' }),
        createPublicSessionStartDto({ entryProfileMode: 'EDUCATION' }),
      ),
    ).toThrow('Анкета не соответствует настройкам ссылки');
  });
});
