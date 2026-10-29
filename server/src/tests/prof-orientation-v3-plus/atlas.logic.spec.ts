import {
  PROF_ORIENTATION_ATLAS_RECOMMENDATION_VERSION,
  PROF_ORIENTATION_ATLAS_RETRY_PAUSE_MS,
  normalizeProfessionTitle,
  selectProfOrientationAtlasProfessions,
  shouldRefreshProfOrientationAtlasSummary,
} from './atlas.logic';
import pairedRulesVectors from '../../../../template/paired-rules.vectors.json';
import { PROF_ORIENTATION_V3_PLUS_RESULT_KIND } from './types';
import type { ProfOrientationSummary } from './types';
/**
 * These rules are pure, so the suite builds its inputs directly. Until the logic was split out of
 * atlas.ts they lived beside the service tests and ran through a beforeEach that wired Prisma, the
 * settings service and the Atlas client — three mocks that neither test touches.
 */
describe('prof-orientation atlas logic', () => {
  it('selects the first two primary professions for non-mixed profile result cards', () => {
    const selected = selectProfOrientationAtlasProfessions({
      resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
      profile: {
        type: 'broad_interest',
      },
      primaryDirection: {
        professions: [
          { code: '103094', title: 'Оператор беспилотных авиационных систем' },
          {
            code: '104874',
            title: 'Специалист по летной эксплуатации беспилотных авиационных систем',
          },
        ],
      },
      secondaryDirection: {
        professions: [{ code: '201526', title: 'Инженер-конструктор-системотехник' }],
      },
      topDirections: [],
    } as unknown as ProfOrientationSummary);
    expect(
      selected.map((item) => ({
        source: item.source,
        title: item.profession.title,
      })),
    ).toEqual([
      {
        source: 'primary',
        title: 'Оператор беспилотных авиационных систем',
      },
      {
        source: 'secondary',
        title: 'Специалист по летной эксплуатации беспилотных авиационных систем',
      },
    ]);
  });
  it('detects saved atlas blocks that cover different professions than result cards', () => {
    const summary = {
      resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
      profile: {
        type: 'broad_interest',
      },
      primaryDirection: {
        professions: [
          { code: '201524', title: 'Инженер-конструктор' },
          { code: '204016', title: 'Техник-конструктор' },
        ],
      },
      secondaryDirection: {
        professions: [{ code: '201353', title: 'Инженер по качеству' }],
      },
      topDirections: [],
      atlas: {
        status: 'ready',
        publicUrl: 'https://atlas.example',
        apiUrl: 'https://atlas.example/api-backend',
        unmatchedProfessions: [],
        duplicateProfessions: [],
        professions: [
          {
            source: 'primary',
            requestedTitle: 'Инженер-конструктор',
            title: 'Инженер-конструктор',
            slug: 'engineer-designer',
            url: 'https://atlas.example/professions/engineer-designer',
            summary: null,
            demandLevel: null,
            industry: null,
            municipality: null,
            skills: [],
          },
          {
            source: 'secondary',
            requestedTitle: 'Инженер по качеству',
            title: 'Инженер по качеству',
            slug: 'quality-engineer',
            url: 'https://atlas.example/professions/quality-engineer',
            summary: null,
            demandLevel: null,
            industry: null,
            municipality: null,
            skills: [],
          },
        ],
        enterprises: [],
        events: [],
        institutions: [],
      },
    } as unknown as ProfOrientationSummary;
    expect(shouldRefreshProfOrientationAtlasSummary(summary)).toBe(true);
  });
  describe('after an Atlas failure', () => {
    const now = new Date('2026-10-30T12:00:00.000Z');
    const failedSummary = (checkedAt?: string) =>
      ({
        resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
        profile: { type: 'broad_interest' },
        primaryDirection: { professions: [{ code: '201524', title: 'Инженер-конструктор' }] },
        secondaryDirection: null,
        topDirections: [],
        atlas: {
          version: PROF_ORIENTATION_ATLAS_RECOMMENDATION_VERSION,
          status: 'unavailable',
          publicUrl: 'https://atlas.example',
          apiUrl: 'https://atlas.example/api-backend',
          errorMessage: 'Сервис Атласа не отвечает',
          checkedAt,
          unmatchedProfessions: ['Инженер-конструктор'],
          duplicateProfessions: [],
          professions: [],
          enterprises: [],
          events: [],
          institutions: [],
        },
      }) as unknown as ProfOrientationSummary;

    it('waits for the retry pause', () => {
      const checkedAt = new Date(now.getTime() - PROF_ORIENTATION_ATLAS_RETRY_PAUSE_MS + 1000);
      expect(
        shouldRefreshProfOrientationAtlasSummary(failedSummary(checkedAt.toISOString()), now),
      ).toBe(false);
    });

    it('retries once the pause has passed', () => {
      const checkedAt = new Date(now.getTime() - PROF_ORIENTATION_ATLAS_RETRY_PAUSE_MS);
      expect(
        shouldRefreshProfOrientationAtlasSummary(failedSummary(checkedAt.toISOString()), now),
      ).toBe(true);
    });

    it('retries a failure saved before checkedAt existed', () => {
      expect(shouldRefreshProfOrientationAtlasSummary(failedSummary(), now)).toBe(true);
    });
  });
  it('asks for Atlas when the summary has none (not configured is never saved)', () => {
    const summary = {
      resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
      primaryDirection: null,
      secondaryDirection: null,
      topDirections: [],
    } as unknown as ProfOrientationSummary;
    expect(shouldRefreshProfOrientationAtlasSummary(summary)).toBe(true);
  });

  describe('shared paired-rules normalizeProfessionTitle vectors', () => {
    it.each(pairedRulesVectors.vectors.normalizeProfessionTitle)(
      'satisfies shared vector: $description',
      ({ input, expected }) => {
        expect(normalizeProfessionTitle(input)).toBe(expected);
      },
    );
  });
});
