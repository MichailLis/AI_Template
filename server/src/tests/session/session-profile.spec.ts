import { BadRequestException } from '@nestjs/common';

import {
  matchesGroupPattern,
  normalizeRequiredString,
  resolveDemographicProfile,
  validateEntryProfileMode,
  validateGroupOrClassForLink,
} from '../session/session-profile';

import pairedRulesVectors from '../../../../template/paired-rules.vectors.json';

import type { AccessiblePublicLink } from '../session/session-profile';
import type { PublicSessionStartRequestDto } from '../dto/tests-public.dto';

/**
 * These rules decide things about values, so the suite passes values in. Until they were split out
 * of TestsPublicSessionService the only way to reach them was through startSessionByCode, which
 * needs Prisma, the link service, the analysis service, two settings services and the Atlas service
 * standing up first.
 */
describe('public session entry profile rules', () => {
  const createLink = (
    organization: Partial<NonNullable<AccessiblePublicLink['educationOrganization']>> | null,
    entryProfileMode: AccessiblePublicLink['entryProfileMode'] = 'EDUCATION',
  ) =>
    ({
      entryProfileMode,
      educationOrganization:
        organization === null
          ? null
          : {
              id: 42,
              name: 'Organization',
              logoUrl: null,
              groupValidationMode: 'NONE',
              groupValidationPattern: null,
              groupValidationHint: null,
              ...organization,
            },
    }) as unknown as AccessiblePublicLink;

  describe('validateGroupOrClassForLink', () => {
    it('accepts any group when the organization does not validate', () => {
      expect(() => validateGroupOrClassForLink('anything at all', createLink({}))).not.toThrow();
    });

    it('accepts any group when the link has no organization', () => {
      expect(() => validateGroupOrClassForLink('anything at all', createLink(null))).not.toThrow();
    });

    it('ignores a pattern unless the mode is STRICT', () => {
      const link = createLink({
        groupValidationMode: 'HINT',
        groupValidationPattern: '^\\d{2}[A-Z]$',
      });

      expect(() => validateGroupOrClassForLink('not matching', link)).not.toThrow();
    });

    it('accepts a group matching a STRICT pattern', () => {
      const link = createLink({
        groupValidationMode: 'STRICT',
        groupValidationPattern: '^\\d{2}[A-Z]$',
      });

      expect(() => validateGroupOrClassForLink('10A', link)).not.toThrow();
    });

    it('rejects a group failing a STRICT pattern, using the organization hint', () => {
      const link = createLink({
        groupValidationMode: 'STRICT',
        groupValidationPattern: '^\\d{2}[A-Z]$',
        groupValidationHint: 'Two digits then one capital letter',
      });

      expect(() => validateGroupOrClassForLink('IS-21', link)).toThrow(BadRequestException);
      expect(() => validateGroupOrClassForLink('IS-21', link)).toThrow(
        'Two digits then one capital letter',
      );
    });

    // The pattern is administrator-supplied, so it can be malformed. Accepting the group is the
    // deliberate choice: a broken pattern must not lock every student out of the link.
    it('accepts the group when the configured pattern is not a valid expression', () => {
      const link = createLink({
        groupValidationMode: 'STRICT',
        groupValidationPattern: '([unclosed',
      });

      expect(() => validateGroupOrClassForLink('anything at all', link)).not.toThrow();
    });

    it('applies the pattern with unicode semantics, so Cyrillic classes work', () => {
      const link = createLink({
        groupValidationMode: 'STRICT',
        groupValidationPattern: '^\\p{L}+$',
      });

      expect(() => validateGroupOrClassForLink('Группа', link)).not.toThrow();
      expect(() => validateGroupOrClassForLink('10A', link)).toThrow(BadRequestException);
    });
  });

  describe('normalizeRequiredString', () => {
    it('trims surrounding whitespace', () => {
      expect(normalizeRequiredString('  value  ', 'required')).toBe('value');
    });

    it.each([undefined, '', '   ', '\t\n'])('rejects %p', (value) => {
      expect(() => normalizeRequiredString(value, 'required')).toThrow(BadRequestException);
      expect(() => normalizeRequiredString(value, 'required')).toThrow('required');
    });
  });

  describe('validateEntryProfileMode', () => {
    const dto = (entryProfileMode?: PublicSessionStartRequestDto['entryProfileMode']) =>
      ({ entryProfileMode }) as PublicSessionStartRequestDto;

    it('accepts a request that does not state a mode', () => {
      expect(() => validateEntryProfileMode(createLink({}, 'EDUCATION'), dto())).not.toThrow();
    });

    it('accepts a request stating the same mode as the link', () => {
      expect(() =>
        validateEntryProfileMode(createLink({}, 'EDUCATION'), dto('EDUCATION')),
      ).not.toThrow();
    });

    it('rejects a request stating a different mode than the link', () => {
      expect(() =>
        validateEntryProfileMode(createLink({}, 'EDUCATION'), dto('DEMOGRAPHIC')),
      ).toThrow(BadRequestException);
    });
  });

  describe('resolveDemographicProfile', () => {
    const dto = (overrides: Partial<PublicSessionStartRequestDto> = {}) =>
      ({
        entryProfileMode: 'DEMOGRAPHIC',
        gender: 'FEMALE',
        age: 17,
        residence: '  Kazan  ',
        educationLevel: 'SECONDARY_GENERAL',
        consentAccepted: true,
        ...overrides,
      }) as PublicSessionStartRequestDto;

    it('returns the profile with the residence trimmed', () => {
      expect(resolveDemographicProfile(dto())).toEqual({
        studentGender: 'FEMALE',
        studentAge: 17,
        studentResidence: 'Kazan',
        studentEducationLevel: 'SECONDARY_GENERAL',
      });
    });

    it('rejects a request without a gender', () => {
      expect(() => resolveDemographicProfile(dto({ gender: undefined }))).toThrow(
        BadRequestException,
      );
    });

    it('rejects a request without an education level', () => {
      expect(() => resolveDemographicProfile(dto({ educationLevel: undefined }))).toThrow(
        BadRequestException,
      );
    });

    it('rejects a blank residence', () => {
      expect(() => resolveDemographicProfile(dto({ residence: '   ' }))).toThrow(
        BadRequestException,
      );
    });

    it.each([undefined, 0, -1, 121, 17.5, Number.NaN])('rejects age %p', (age) => {
      expect(() => resolveDemographicProfile(dto({ age }))).toThrow(BadRequestException);
    });

    it.each([1, 120])('accepts age %p at the boundary', (age) => {
      expect(resolveDemographicProfile(dto({ age }))).toMatchObject({ studentAge: age });
    });
  });

  describe('shared paired-rules matchesGroupPattern vectors', () => {
    it.each(pairedRulesVectors.vectors.matchesGroupPattern)(
      'satisfies shared vector: $description',
      ({ input, expected }) => {
        expect(matchesGroupPattern(input.value, input.pattern)).toBe(expected);
      },
    );
  });
});
