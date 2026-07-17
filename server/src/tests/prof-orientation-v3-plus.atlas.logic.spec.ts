import {
  buildProfOrientationAtlasInstitutionSearchTerms,
  buildProfOrientationAtlasRecommendations,
  createUnavailableAtlasRecommendations,
  selectProfOrientationAtlasProfessions,
  shouldRefreshProfOrientationAtlasSummary,
} from './prof-orientation-v3-plus.atlas.logic';
import { PROF_ORIENTATION_V3_PLUS_RESULT_KIND } from './prof-orientation-v3-plus.types';

import type {
  ProfOrientationDirectionSummary,
  ProfOrientationSummary,
} from './prof-orientation-v3-plus.types';

const createDirection = (name: string, titles: string[]): ProfOrientationDirectionSummary => ({
  id: 'A1',
  block: name,
  name,
  short: name,
  score: 10,
  professions: titles.map((title, index) => ({ code: `${name}-${index}`, title })),
  resultCard: {
    headline: name,
    meaning: name,
    fitsIf: [],
    tryActions: [],
    learn: ['digital design', 'systems'],
    miniProject: name,
  },
});

const createSummary = (overrides: Partial<ProfOrientationSummary> = {}): ProfOrientationSummary =>
  ({
    resultKind: PROF_ORIENTATION_V3_PLUS_RESULT_KIND,
    scoringVersion: 'test',
    scores: {},
    selectedCounts: {},
    sliderValues: {},
    topDirections: [],
    primaryDirection: createDirection('primary', ['Engineer', 'Analyst']),
    secondaryDirection: createDirection('secondary', ['engineer', 'Designer']),
    profile: {
      type: 'single_profile',
      title: 'Profile',
      meaning: 'Profile',
      directions: [],
      miniProject: null,
    },
    confidence: {
      level: 'medium',
      label: 'medium',
      gap: 1,
      consistencyIndex: 1,
      readinessTop: 1,
    },
    flags: [],
    llm: { status: 'not_requested' },
    ...overrides,
  }) as ProfOrientationSummary;

const createProfessionDetail = (title: string, slug: string, programSlug: string) => ({
  title,
  slug,
  summary: `${title} summary`,
  description: `${title} description`,
  demandLevel: 'high',
  industry: { name: 'Digital design', slug: 'digital-design' },
  municipality: { name: 'Kazan', slug: 'kazan' },
  skills: [
    { name: 'CAD', slug: 'cad' },
    { name: 'Robotics', slug: 'robotics' },
    { name: 'Systems', slug: 'systems' },
    { name: 'Models', slug: 'models' },
    { name: 'Extra', slug: 'extra' },
  ],
  educationPrograms: [
    {
      title: `${title} program`,
      slug: programSlug,
      institution: {
        name: `${title} College`,
        slug: `${slug}-college`,
        municipality: { name: 'Kazan', slug: 'kazan' },
      },
    },
  ],
});

describe('prof-orientation Atlas pure logic', () => {
  it('selects at most two normalized unique professions in result-card order', () => {
    const selected = selectProfOrientationAtlasProfessions(createSummary());

    expect(selected.map((item) => [item.source, item.profession.title])).toEqual([
      ['primary', 'Engineer'],
      ['secondary', 'Analyst'],
    ]);

    const mixed = selectProfOrientationAtlasProfessions(
      createSummary({
        profile: {
          type: 'mixed_profile',
          title: 'Mixed',
          meaning: 'Mixed',
          directions: [],
          miniProject: null,
        },
        topDirections: [
          createDirection('top-a', ['  Engineer  ']),
          createDirection('top-b', ['engineer', 'Designer']),
        ],
      }),
    );

    expect(mixed.map((item) => [item.source, item.profession.title])).toEqual([
      ['primary', '  Engineer  '],
      ['secondary', 'Designer'],
    ]);
  });

  it('refreshes only missing or stale saved Atlas coverage for the current selected professions', () => {
    expect(shouldRefreshProfOrientationAtlasSummary(createSummary())).toBe(false);

    expect(
      shouldRefreshProfOrientationAtlasSummary(
        createSummary({
          atlas: {
            version: 5,
            status: 'ready',
            publicUrl: 'https://atlas.example',
            apiUrl: 'https://atlas.example/api',
            unmatchedProfessions: [],
            duplicateProfessions: [],
            professions: [],
            enterprises: [],
            events: [],
            institutions: [],
          },
        }),
      ),
    ).toBe(true);

    expect(
      shouldRefreshProfOrientationAtlasSummary(
        createSummary({
          atlas: {
            version: 6,
            status: 'unavailable',
            publicUrl: 'https://atlas.example',
            apiUrl: 'https://atlas.example/api',
            unmatchedProfessions: ['Engineer', 'Analyst'],
            duplicateProfessions: [],
            professions: [],
            enterprises: [],
            events: [],
            institutions: [],
          },
        }),
      ),
    ).toBe(false);

    expect(
      shouldRefreshProfOrientationAtlasSummary(
        createSummary({
          atlas: {
            version: 6,
            status: 'ready',
            publicUrl: 'https://atlas.example',
            apiUrl: 'https://atlas.example/api',
            unmatchedProfessions: [],
            duplicateProfessions: [],
            professions: [
              {
                source: 'primary',
                requestedTitle: 'Engineer',
                title: 'Engineer',
                slug: 'engineer',
                url: 'https://atlas.example/professions/engineer',
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
        }),
      ),
    ).toBe(true);
  });

  it('builds versioned Atlas cards and ranked recommendation payloads without I/O', () => {
    const selected = selectProfOrientationAtlasProfessions(createSummary());
    const engineer = createProfessionDetail('Engineer', 'engineer', 'engineer-program');
    const analyst = createProfessionDetail('Analyst', 'analyst', 'analyst-program');

    expect(
      buildProfOrientationAtlasInstitutionSearchTerms(createSummary(), selected, [
        engineer,
        analyst,
      ]),
    ).toEqual([
      { term: 'engineer', signalStrength: 1 },
      { term: 'analyst', signalStrength: 1 },
      { term: 'digital', signalStrength: 2 },
      { term: 'design', signalStrength: 2 },
      { term: 'robotics', signalStrength: 2 },
      { term: 'systems', signalStrength: 2 },
      { term: 'models', signalStrength: 2 },
      { term: 'extra', signalStrength: 2 },
    ]);

    const atlas = buildProfOrientationAtlasRecommendations({
      summary: createSummary(),
      publicUrl: 'https://atlas.example/',
      apiUrl: 'https://atlas.example/api',
      selected,
      matchedProfessions: [
        {
          source: 'primary',
          requestedTitle: 'Engineer',
          detail: engineer,
        },
        {
          source: 'secondary',
          requestedTitle: 'Analyst',
          detail: analyst,
        },
      ],
      unmatchedProfessions: ['Missing profession'],
      duplicateProfessions: [],
      enterprises: [
        {
          name: 'Zeta Plant',
          slug: 'zeta',
          summary: 'fallback',
          industry: 'Industry',
          municipality: null,
          websiteUrl: null,
          opportunities: [
            {
              title: 'Analyst internship',
              description: 'secondary match',
              type: null,
              audience: null,
              professionTitle: null,
              professionSlug: 'analyst',
            },
          ],
        },
        {
          name: 'Alpha Plant',
          slug: 'alpha',
          summary: 'fallback',
          industry: 'Industry',
          municipality: null,
          websiteUrl: null,
          opportunities: [
            {
              title: 'Engineer internship',
              description: 'primary match',
              type: null,
              audience: null,
              professionTitle: null,
              professionSlug: 'engineer',
            },
          ],
        },
      ],
      events: [
        {
          title: 'Systems practice',
          slug: 'systems-practice',
          type: 'workshop',
          startsAt: '2026-06-01T00:00:00.000Z',
          endsAt: null,
          municipality: { name: 'Kazan', slug: 'kazan' },
          location: 'Lab',
          summary: 'systems and cad',
          audience: 'students',
          registrationUrl: null,
        },
        {
          title: 'Engineer meetup',
          slug: 'engineer-meetup',
          type: 'meetup',
          startsAt: '2026-07-01T00:00:00.000Z',
          endsAt: null,
          municipality: null,
          location: 'Online',
          summary: 'engineer',
          audience: 'students',
          registrationUrl: null,
        },
      ],
      searchedInstitutionMatches: [
        {
          termIndex: 0,
          resultIndex: 0,
          signalStrength: 2,
          institution: {
            name: 'Search University',
            slug: 'search-university',
            municipality: { name: 'Kazan', slug: 'kazan' },
            programsCount: 120,
            levels: [{ name: 'higher education', slug: 'higher' }],
          },
        },
      ],
    });

    expect(atlas).toMatchObject({
      version: 6,
      status: 'partial',
      publicUrl: 'https://atlas.example/',
      apiUrl: 'https://atlas.example/api',
      unmatchedProfessions: ['Missing profession'],
      duplicateProfessions: [],
      professions: [
        {
          source: 'primary',
          requestedTitle: 'Engineer',
          title: 'Engineer',
          slug: 'engineer',
          url: 'https://atlas.example/professions/engineer',
          summary: 'Engineer summary',
          demandLevel: 'high',
          industry: 'Digital design',
          municipality: 'Kazan',
          skills: ['CAD', 'Robotics', 'Systems', 'Models'],
        },
        {
          source: 'secondary',
          requestedTitle: 'Analyst',
          title: 'Analyst',
          slug: 'analyst',
          url: 'https://atlas.example/professions/analyst',
        },
      ],
      enterprises: [
        {
          title: 'Alpha Plant',
          slug: 'alpha',
          url: 'https://atlas.example/enterprises#enterprise-alpha',
          summary: 'primary match',
          subtitle: 'Engineer internship',
        },
        {
          title: 'Zeta Plant',
          slug: 'zeta',
          url: 'https://atlas.example/enterprises#enterprise-zeta',
        },
      ],
      events: [
        {
          title: 'Systems practice',
          slug: 'systems-practice',
          url: 'https://atlas.example/events#event-systems-practice',
        },
        {
          title: 'Engineer meetup',
          slug: 'engineer-meetup',
          url: 'https://atlas.example/events#event-engineer-meetup',
        },
      ],
      institutions: [
        {
          title: 'Search University',
          slug: 'search-university',
          url: 'https://atlas.example/institutions/search-university',
        },
        {
          title: 'Engineer College',
          slug: 'engineer-college',
          url: 'https://atlas.example/institutions/engineer-college',
        },
      ],
    });
    expect(atlas.professions).toHaveLength(2);
    expect(atlas.enterprises).toHaveLength(2);
    expect(atlas.events).toHaveLength(2);
    expect(atlas.institutions).toHaveLength(2);
  });

  it('creates exact versioned unavailable Atlas payloads for configuration and request errors', () => {
    expect(
      createUnavailableAtlasRecommendations({
        publicUrl: null,
        apiUrl: null,
        errorMessage: 'Atlas URL is not configured',
        unmatchedProfessions: [],
      }),
    ).toEqual({
      version: 6,
      status: 'unavailable',
      publicUrl: null,
      apiUrl: null,
      errorMessage: 'Atlas URL is not configured',
      unmatchedProfessions: [],
      duplicateProfessions: [],
      professions: [],
      enterprises: [],
      events: [],
      institutions: [],
    });

    expect(
      createUnavailableAtlasRecommendations({
        publicUrl: 'https://atlas.example',
        apiUrl: 'https://atlas.example/api',
        errorMessage: 'Atlas API request failed',
        unmatchedProfessions: ['Engineer'],
      }),
    ).toMatchObject({
      version: 6,
      status: 'unavailable',
      publicUrl: 'https://atlas.example',
      apiUrl: 'https://atlas.example/api',
      errorMessage: 'Atlas API request failed',
      unmatchedProfessions: ['Engineer'],
      duplicateProfessions: [],
      professions: [],
      enterprises: [],
      events: [],
      institutions: [],
    });
  });
});
