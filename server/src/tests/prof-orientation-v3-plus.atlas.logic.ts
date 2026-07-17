import type {
  ProfOrientationAtlasProfessionCard,
  ProfOrientationAtlasRecommendation,
  ProfOrientationAtlasRecommendations,
  ProfOrientationDirectionSummary,
  ProfOrientationProfession,
  ProfOrientationSummary,
} from './prof-orientation-v3-plus.types';

const PROF_ORIENTATION_ATLAS_RECOMMENDATION_VERSION = 6;

type AtlasNamedSlug = {
  name: string;
  slug: string;
};

interface ProfOrientationAtlasProfessionDetail {
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  demandLevel: string | null;
  industry: AtlasNamedSlug | null;
  municipality: AtlasNamedSlug | null;
  skills: AtlasNamedSlug[];
  educationPrograms: Array<{
    title: string;
    slug: string;
    institution: AtlasNamedSlug & {
      municipality?: AtlasNamedSlug | null;
    };
  }>;
}

interface ProfOrientationAtlasEnterprise {
  name: string;
  slug: string;
  summary: string | null;
  industry: string | null;
  municipality: AtlasNamedSlug | null;
  websiteUrl: string | null;
  opportunities: Array<{
    title: string;
    description: string | null;
    type: string | null;
    audience: string | null;
    professionTitle: string | null;
    professionSlug: string | null;
  }>;
}

interface ProfOrientationAtlasEvent {
  title: string;
  slug: string;
  type: string | null;
  startsAt: string | null;
  endsAt: string | null;
  municipality: AtlasNamedSlug | null;
  location: string | null;
  summary: string | null;
  audience: string | null;
  registrationUrl: string | null;
}

interface ProfOrientationAtlasInstitution extends AtlasNamedSlug {
  municipality: AtlasNamedSlug | null;
  programsCount: number;
  levels: AtlasNamedSlug[];
}

interface ProfOrientationAtlasInstitutionSearchTerm {
  term: string;
  signalStrength: number;
}

interface ProfOrientationAtlasInstitutionSearchMatch {
  institution: ProfOrientationAtlasInstitution;
  termIndex: number;
  resultIndex: number;
  signalStrength: number;
}

interface BuildProfOrientationAtlasRecommendationsInput {
  summary: ProfOrientationSummary;
  publicUrl: string;
  apiUrl: string;
  selected: Array<{ source: 'primary' | 'secondary'; profession: ProfOrientationProfession }>;
  matchedProfessions: Array<{
    source: 'primary' | 'secondary';
    requestedTitle: string;
    detail: ProfOrientationAtlasProfessionDetail;
  }>;
  unmatchedProfessions: string[];
  duplicateProfessions: string[];
  enterprises: ProfOrientationAtlasEnterprise[];
  events: ProfOrientationAtlasEvent[];
  searchedInstitutionMatches: ProfOrientationAtlasInstitutionSearchMatch[];
}

interface CreateUnavailableAtlasRecommendationsInput {
  publicUrl: string | null;
  apiUrl: string | null;
  errorMessage: string;
  unmatchedProfessions: string[];
}

const normalizeProfessionTitle = (value: string) =>
  value.trim().toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').replace(/\s+/g, ' ');

const normalizeUrl = (value: string) => value.replace(/\/+$/, '');

const buildPublicUrl = (publicUrl: string, path: string) =>
  `${normalizeUrl(publicUrl)}/${path.replace(/^\/+/, '')}`;

const shortText = (value: string | null | undefined, maxLength = 180) => {
  const text = value?.trim();

  if (!text) {
    return null;
  }

  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
};

const getNextProfession = (
  direction: ProfOrientationDirectionSummary | null,
  excludedTitles: Set<string>,
) =>
  direction?.professions.find(
    (profession) => !excludedTitles.has(normalizeProfessionTitle(profession.title)),
  ) ?? null;

export const selectProfOrientationAtlasProfessions = (
  summary: ProfOrientationSummary,
): Array<{ source: 'primary' | 'secondary'; profession: ProfOrientationProfession }> => {
  const selected: Array<{
    source: 'primary' | 'secondary';
    profession: ProfOrientationProfession;
  }> = [];
  const seenTitles = new Set<string>();
  const addProfession = (
    source: 'primary' | 'secondary',
    profession: ProfOrientationProfession | null,
  ) => {
    if (!profession || selected.length >= 2) {
      return;
    }

    const normalizedTitle = normalizeProfessionTitle(profession.title);
    if (seenTitles.has(normalizedTitle)) {
      return;
    }

    selected.push({ source, profession });
    seenTitles.add(normalizedTitle);
  };

  const addNextProfession = (
    source: 'primary' | 'secondary',
    direction: ProfOrientationDirectionSummary | null,
  ) => addProfession(source, getNextProfession(direction, seenTitles));

  if (summary.profile?.type === 'mixed_profile') {
    addNextProfession('primary', summary.topDirections[0] ?? summary.primaryDirection);
    addNextProfession('secondary', summary.topDirections[1] ?? summary.secondaryDirection);
  } else {
    for (const profession of summary.primaryDirection?.professions ?? []) {
      addProfession(selected.length === 0 ? 'primary' : 'secondary', profession);
    }
  }

  addNextProfession(selected.length === 0 ? 'primary' : 'secondary', summary.secondaryDirection);
  addNextProfession(selected.length === 0 ? 'primary' : 'secondary', summary.primaryDirection);

  for (const direction of summary.topDirections) {
    addNextProfession(selected.length === 0 ? 'primary' : 'secondary', direction);
  }

  return selected.slice(0, 2);
};

export const shouldRefreshProfOrientationAtlasSummary = (summary: ProfOrientationSummary) => {
  if (!summary.atlas) {
    return false;
  }

  if (summary.atlas.version !== PROF_ORIENTATION_ATLAS_RECOMMENDATION_VERSION) {
    return true;
  }

  const selectedTitles = new Set(
    selectProfOrientationAtlasProfessions(summary).map((item) =>
      normalizeProfessionTitle(item.profession.title),
    ),
  );

  if (selectedTitles.size === 0) {
    return false;
  }

  const atlasTitles = new Set(
    [
      ...summary.atlas.professions.map((profession) =>
        normalizeProfessionTitle(profession.requestedTitle || profession.title),
      ),
      ...summary.atlas.unmatchedProfessions.map(normalizeProfessionTitle),
      ...summary.atlas.duplicateProfessions.map(normalizeProfessionTitle),
    ].filter(Boolean),
  );

  if (atlasTitles.size !== selectedTitles.size) {
    return true;
  }

  return [...selectedTitles].some((title) => !atlasTitles.has(title));
};

const toProfessionCard = (
  publicUrl: string,
  source: 'primary' | 'secondary',
  requestedTitle: string,
  profession: ProfOrientationAtlasProfessionDetail,
): ProfOrientationAtlasProfessionCard => ({
  source,
  requestedTitle,
  title: profession.title,
  slug: profession.slug,
  url: buildPublicUrl(publicUrl, `professions/${profession.slug}`),
  summary: shortText(profession.summary ?? profession.description),
  demandLevel: profession.demandLevel,
  industry: profession.industry?.name ?? null,
  municipality: profession.municipality?.name ?? null,
  skills: profession.skills.map((skill) => skill.name).slice(0, 4),
});

const INSTITUTION_STOP_TERMS = new Set([
  'основы',
  'работа',
  'системы',
  'подготовка',
  'производства',
]);

const tokenizeInstitutionTerm = (value: string) =>
  normalizeProfessionTitle(value)
    .split(/[^a-zа-я0-9]+/iu)
    .map((term) => term.trim())
    .filter((term) => term.length >= 5 && !INSTITUTION_STOP_TERMS.has(term));

const buildProfOrientationAtlasInstitutionSearchTerms = (
  summary: ProfOrientationSummary,
  selected: Array<{ profession: ProfOrientationProfession }>,
  professions: ProfOrientationAtlasProfessionDetail[],
): ProfOrientationAtlasInstitutionSearchTerm[] => {
  const terms = new Map<string, ProfOrientationAtlasInstitutionSearchTerm>();
  const addTokens = (value: string | null | undefined, signalStrength: number) => {
    if (!value) {
      return;
    }

    for (const term of tokenizeInstitutionTerm(value)) {
      const existing = terms.get(term);
      terms.set(term, {
        term,
        signalStrength: Math.max(existing?.signalStrength ?? 0, signalStrength),
      });
    }
  };

  for (const item of selected) {
    addTokens(item.profession.title, 0);
  }

  for (const profession of professions) {
    addTokens(profession.industry?.name, 2);

    for (const skill of profession.skills) {
      addTokens(skill.name, 2);
    }
  }

  for (const direction of [summary.primaryDirection, summary.secondaryDirection]) {
    addTokens(direction?.name, 1);

    for (const term of direction?.resultCard?.learn ?? []) {
      addTokens(term, 1);
    }
  }

  for (const profession of professions) {
    for (const program of profession.educationPrograms) {
      addTokens(program.title, 1);
    }
  }

  return [...terms.values()].slice(0, 8);
};

const hasHigherEducationLevel = (institution: ProfOrientationAtlasInstitution) =>
  institution.levels.some((level) => normalizeProfessionTitle(level.name).includes('высшее'));

const toInstitutionSearchSummary = (institution: ProfOrientationAtlasInstitution) => {
  const levelNames = institution.levels.map((level) => level.name);
  const firstLevel = levelNames[0];

  return [
    institution.programsCount > 0 ? `${institution.programsCount} программ` : null,
    firstLevel,
  ]
    .filter(Boolean)
    .join(' · ');
};

const scoreInstitutionSearchMatch = ({
  institution,
  termIndex,
  resultIndex,
  signalStrength,
}: ProfOrientationAtlasInstitutionSearchMatch) =>
  2 +
  signalStrength * 2 +
  Math.max(0, 4 - resultIndex) +
  Math.max(0, 3 - termIndex) +
  Math.min(3, Math.floor(institution.programsCount / 40)) +
  (hasHigherEducationLevel(institution) ? 2 : 0);

const selectInstitutions = (
  publicUrl: string,
  professions: ProfOrientationAtlasProfessionDetail[],
  searchedInstitutionMatches: ProfOrientationAtlasInstitutionSearchMatch[],
): ProfOrientationAtlasRecommendation[] => {
  const candidates = new Map<
    string,
    ProfOrientationAtlasRecommendation & {
      score: number;
      programsCount: number;
      hasDirectMatch: boolean;
      searchSignalStrength: number;
    }
  >();
  const upsertCandidate = (
    candidate: ProfOrientationAtlasRecommendation & {
      score: number;
      programsCount?: number;
      hasDirectMatch?: boolean;
      searchSignalStrength?: number;
    },
  ) => {
    const existing = candidates.get(candidate.slug);
    const programsCount = candidate.programsCount ?? existing?.programsCount ?? 0;

    if (!existing) {
      candidates.set(candidate.slug, {
        ...candidate,
        programsCount,
        hasDirectMatch: candidate.hasDirectMatch ?? false,
        searchSignalStrength: candidate.searchSignalStrength ?? 0,
      });
      return;
    }

    candidates.set(candidate.slug, {
      ...existing,
      score: existing.score + candidate.score,
      programsCount: Math.max(existing.programsCount, programsCount),
      hasDirectMatch: existing.hasDirectMatch || Boolean(candidate.hasDirectMatch),
      searchSignalStrength: Math.max(
        existing.searchSignalStrength,
        candidate.searchSignalStrength ?? 0,
      ),
      summary: existing.summary ?? candidate.summary,
      subtitle: existing.subtitle ?? candidate.subtitle,
    });
  };

  const directInstitutionSlugs = new Set<string>();

  professions.forEach((profession, professionIndex) => {
    for (const program of profession.educationPrograms) {
      if (directInstitutionSlugs.has(program.institution.slug)) {
        continue;
      }

      directInstitutionSlugs.add(program.institution.slug);
      upsertCandidate({
        title: program.institution.name,
        slug: program.institution.slug,
        url: buildPublicUrl(publicUrl, `institutions/${program.institution.slug}`),
        summary: program.title,
        subtitle: program.institution.municipality?.name ?? null,
        score: professionIndex === 0 ? 10 : 7,
        hasDirectMatch: true,
      });
    }
  });

  searchedInstitutionMatches.forEach((match) => {
    const { institution } = match;

    upsertCandidate({
      title: institution.name,
      slug: institution.slug,
      url: buildPublicUrl(publicUrl, `institutions/${institution.slug}`),
      summary: toInstitutionSearchSummary(institution) || null,
      subtitle: institution.municipality?.name ?? null,
      score: scoreInstitutionSearchMatch(match),
      programsCount: institution.programsCount,
      searchSignalStrength: match.signalStrength,
    });
  });

  const candidatesList = [...candidates.values()];
  const profileMatchedCandidates = candidatesList.filter(
    (candidate) => candidate.hasDirectMatch || candidate.searchSignalStrength > 0,
  );
  const rankedCandidates =
    profileMatchedCandidates.length >= 2 ? profileMatchedCandidates : candidatesList;

  return rankedCandidates
    .sort(
      (left, right) =>
        right.score - left.score ||
        right.programsCount - left.programsCount ||
        left.title.localeCompare(right.title),
    )
    .slice(0, 2)
    .map((candidate) => ({
      title: candidate.title,
      slug: candidate.slug,
      url: candidate.url,
      summary: candidate.summary,
      subtitle: candidate.subtitle,
    }));
};

const scoreEnterprise = (enterprise: ProfOrientationAtlasEnterprise, professionSlugs: string[]) => {
  let score = 0;

  for (const opportunity of enterprise.opportunities) {
    const index = opportunity.professionSlug
      ? professionSlugs.indexOf(opportunity.professionSlug)
      : -1;

    if (index === 0) {
      score += 4;
    } else if (index === 1) {
      score += 2;
    }
  }

  return score;
};

const selectEnterprises = (
  publicUrl: string,
  enterprises: ProfOrientationAtlasEnterprise[],
  professionSlugs: string[],
): ProfOrientationAtlasRecommendation[] => {
  return enterprises
    .map((enterprise) => ({
      enterprise,
      score: scoreEnterprise(enterprise, professionSlugs),
    }))
    .filter((item) => item.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.enterprise.name.localeCompare(right.enterprise.name),
    )
    .slice(0, 2)
    .map(({ enterprise }) => {
      const matchedOpportunity = enterprise.opportunities.find((opportunity) =>
        opportunity.professionSlug ? professionSlugs.includes(opportunity.professionSlug) : false,
      );

      return {
        title: enterprise.name,
        slug: enterprise.slug,
        url: buildPublicUrl(publicUrl, `enterprises#enterprise-${enterprise.slug}`),
        summary: shortText(matchedOpportunity?.description ?? enterprise.summary),
        subtitle: matchedOpportunity?.title ?? enterprise.industry,
      };
    });
};

const eventSearchText = (event: ProfOrientationAtlasEvent) =>
  normalizeProfessionTitle(
    [event.title, event.summary, event.audience, event.type].filter(Boolean).join(' '),
  );

const scoreEvent = (
  event: ProfOrientationAtlasEvent,
  professions: ProfOrientationAtlasProfessionDetail[],
  contextTerms: string[],
) => {
  const haystack = eventSearchText(event);
  const terms = [
    ...contextTerms,
    ...professions.map((profession) => profession.title),
    ...professions.flatMap((profession) => [
      profession.industry?.name,
      ...profession.skills.map((skill) => skill.name),
    ]),
  ]
    .filter((item): item is string => Boolean(item))
    .map(normalizeProfessionTitle)
    .filter((item) => item.length > 2);

  return new Set(terms.filter((term) => haystack.includes(term))).size;
};

const selectEvents = (
  publicUrl: string,
  events: ProfOrientationAtlasEvent[],
  professions: ProfOrientationAtlasProfessionDetail[],
  contextTerms: string[],
): ProfOrientationAtlasRecommendation[] => {
  return events
    .map((event) => ({
      event,
      score: scoreEvent(event, professions, contextTerms),
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return (right.event.startsAt ?? '').localeCompare(left.event.startsAt ?? '');
    })
    .slice(0, 2)
    .map(({ event }) => ({
      title: event.title,
      slug: event.slug,
      url: buildPublicUrl(publicUrl, `events#event-${event.slug}`),
      summary: shortText(event.summary),
      subtitle: [event.location, event.municipality?.name].filter(Boolean).join(' · ') || null,
    }));
};

const buildProfOrientationAtlasRecommendationsBase = ({
  summary,
  publicUrl,
  apiUrl,
  selected,
  matchedProfessions,
  unmatchedProfessions,
  duplicateProfessions,
  enterprises,
  events,
  searchedInstitutionMatches,
}: BuildProfOrientationAtlasRecommendationsInput): ProfOrientationAtlasRecommendations => {
  const details = matchedProfessions.map((item) => item.detail);
  const professionSlugs = details.map((profession) => profession.slug);
  const eventContextTerms = [
    ...selected.map((item) => item.profession.title),
    summary.primaryDirection?.name,
    summary.secondaryDirection?.name,
  ].filter((term): term is string => Boolean(term));

  return {
    version: PROF_ORIENTATION_ATLAS_RECOMMENDATION_VERSION,
    status:
      details.length === 0
        ? 'unavailable'
        : unmatchedProfessions.length || duplicateProfessions.length
          ? 'partial'
          : 'ready',
    publicUrl,
    apiUrl,
    unmatchedProfessions,
    duplicateProfessions,
    professions: matchedProfessions.map((item) =>
      toProfessionCard(publicUrl, item.source, item.requestedTitle, item.detail),
    ),
    enterprises: selectEnterprises(publicUrl, enterprises, professionSlugs),
    events: selectEvents(publicUrl, events, details, eventContextTerms),
    institutions: selectInstitutions(publicUrl, details, searchedInstitutionMatches),
  };
};

export const buildProfOrientationAtlasRecommendations = Object.assign(
  buildProfOrientationAtlasRecommendationsBase,
  {
    institutionSearchTerms: buildProfOrientationAtlasInstitutionSearchTerms,
  },
);

export const createUnavailableAtlasRecommendations = ({
  publicUrl,
  apiUrl,
  errorMessage,
  unmatchedProfessions,
}: CreateUnavailableAtlasRecommendationsInput): ProfOrientationAtlasRecommendations => ({
  version: PROF_ORIENTATION_ATLAS_RECOMMENDATION_VERSION,
  status: 'unavailable',
  publicUrl,
  apiUrl,
  errorMessage,
  unmatchedProfessions,
  duplicateProfessions: [],
  professions: [],
  enterprises: [],
  events: [],
  institutions: [],
});
