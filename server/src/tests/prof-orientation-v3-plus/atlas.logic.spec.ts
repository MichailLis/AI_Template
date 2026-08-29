import {
  selectProfOrientationAtlasProfessions,
  shouldRefreshProfOrientationAtlasSummary,
} from './atlas.logic';
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
});
