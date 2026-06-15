import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  type AtlasEnterprise,
  type AtlasEvent,
  type AtlasProfessionDetail,
  ProfessionAtlasClientService,
} from '../app-settings/profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrismaService } from '../prisma.service';
import { getProfOrientationV3PlusProfessions } from './prof-orientation-v3-plus.fixture';

import type {
  ProfOrientationAtlasProfessionCard,
  ProfOrientationAtlasRecommendation,
  ProfOrientationAtlasRecommendations,
  ProfOrientationDirectionSummary,
  ProfOrientationProfession,
  ProfOrientationSummary,
} from './prof-orientation-v3-plus.types';

export interface ProfessionAtlasCoverageItem {
  title: string;
  status: 'found' | 'missing' | 'duplicate';
  matches: Array<{
    title: string;
    slug: string;
    url: string;
  }>;
}

export interface ProfessionAtlasCoverageReport {
  status: 'ready' | 'partial' | 'unavailable';
  checkedAt: string;
  total: number;
  found: number;
  missing: string[];
  duplicates: string[];
  items: ProfessionAtlasCoverageItem[];
  errorMessage?: string;
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

    selected.push({ source, profession });
    seenTitles.add(normalizeProfessionTitle(profession.title));
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

const findExactProfessionMatches = async (
  atlasClient: ProfessionAtlasClientService,
  apiUrl: string,
  title: string,
) => {
  const expectedTitle = normalizeProfessionTitle(title);
  const professions = await atlasClient.findProfessions(apiUrl, { q: title, pageSize: 12 });

  return professions.filter(
    (profession) => normalizeProfessionTitle(profession.title) === expectedTitle,
  );
};

const toProfessionCard = (
  publicUrl: string,
  source: 'primary' | 'secondary',
  requestedTitle: string,
  profession: AtlasProfessionDetail,
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

const uniqueBySlug = <T extends { slug: string }>(items: T[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (seen.has(item.slug)) {
      return false;
    }

    seen.add(item.slug);
    return true;
  });
};

const selectInstitutions = (
  publicUrl: string,
  professions: AtlasProfessionDetail[],
): ProfOrientationAtlasRecommendation[] => {
  const items = professions.flatMap((profession) =>
    profession.educationPrograms.map((program) => ({
      title: program.institution.name,
      slug: program.institution.slug,
      url: buildPublicUrl(publicUrl, `institutions/${program.institution.slug}`),
      summary: program.title,
      subtitle: program.institution.municipality?.name ?? null,
    })),
  );

  return uniqueBySlug(items).slice(0, 2);
};

const scoreEnterprise = (enterprise: AtlasEnterprise, professionSlugs: string[]) => {
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
  enterprises: AtlasEnterprise[],
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

const eventSearchText = (event: AtlasEvent) =>
  normalizeProfessionTitle(
    [event.title, event.summary, event.audience, event.type].filter(Boolean).join(' '),
  );

const scoreEvent = (
  event: AtlasEvent,
  professions: AtlasProfessionDetail[],
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
  events: AtlasEvent[],
  professions: AtlasProfessionDetail[],
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

@Injectable()
export class ProfOrientationAtlasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly professionAtlasSettingsService: ProfessionAtlasSettingsService,
    private readonly atlasClient: ProfessionAtlasClientService,
  ) {}

  async buildCoverageReport(): Promise<ProfessionAtlasCoverageReport> {
    const settings = await this.professionAtlasSettingsService.getProfessionAtlasConnection();
    const checkedAt = new Date().toISOString();

    if (!settings.publicUrl || !settings.apiUrl) {
      const titles = getProfOrientationV3PlusProfessions().map((profession) => profession.title);

      return {
        status: 'unavailable',
        checkedAt,
        total: titles.length,
        found: 0,
        missing: titles,
        duplicates: [],
        items: titles.map((title) => ({ title, status: 'missing', matches: [] })),
        errorMessage: 'Atlas URL is not configured',
      };
    }

    const publicUrl = settings.publicUrl;
    const apiUrl = settings.apiUrl;

    try {
      const items: ProfessionAtlasCoverageItem[] = [];

      await this.atlasClient.findProfessions(apiUrl, { pageSize: 1 });

      for (const profession of getProfOrientationV3PlusProfessions()) {
        const matches = await findExactProfessionMatches(
          this.atlasClient,
          apiUrl,
          profession.title,
        );

        items.push({
          title: profession.title,
          status: matches.length === 0 ? 'missing' : matches.length === 1 ? 'found' : 'duplicate',
          matches: matches.map((match) => ({
            title: match.title,
            slug: match.slug,
            url: buildPublicUrl(publicUrl, `professions/${match.slug}`),
          })),
        });
      }

      const missing = items.filter((item) => item.status === 'missing').map((item) => item.title);
      const duplicates = items
        .filter((item) => item.status === 'duplicate')
        .map((item) => item.title);

      return {
        status: missing.length || duplicates.length ? 'partial' : 'ready',
        checkedAt,
        total: items.length,
        found: items.filter((item) => item.status === 'found').length,
        missing,
        duplicates,
        items,
      };
    } catch (error) {
      const titles = getProfOrientationV3PlusProfessions().map((profession) => profession.title);

      return {
        status: 'unavailable',
        checkedAt,
        total: titles.length,
        found: 0,
        missing: titles,
        duplicates: [],
        items: titles.map((title) => ({ title, status: 'missing', matches: [] })),
        errorMessage: error instanceof Error ? error.message : 'Atlas API request failed',
      };
    }
  }

  async enrichSummary(summary: ProfOrientationSummary): Promise<ProfOrientationSummary> {
    const settings = await this.professionAtlasSettingsService.getProfessionAtlasConnection();

    if (!settings.publicUrl || !settings.apiUrl) {
      return {
        ...summary,
        atlas: {
          status: 'unavailable',
          publicUrl: settings.publicUrl,
          apiUrl: settings.apiUrl,
          errorMessage: 'Atlas URL is not configured',
          unmatchedProfessions: [],
          duplicateProfessions: [],
          professions: [],
          enterprises: [],
          events: [],
          institutions: [],
        },
      };
    }

    const publicUrl = settings.publicUrl;
    const apiUrl = settings.apiUrl;
    const selected = selectProfOrientationAtlasProfessions(summary);

    try {
      const matchedProfessions: Array<{
        source: 'primary' | 'secondary';
        requestedTitle: string;
        detail: AtlasProfessionDetail;
      }> = [];
      const unmatchedProfessions: string[] = [];
      const duplicateProfessions: string[] = [];

      for (const item of selected) {
        const matches = await findExactProfessionMatches(
          this.atlasClient,
          apiUrl,
          item.profession.title,
        );

        if (matches.length === 1) {
          matchedProfessions.push({
            source: item.source,
            requestedTitle: item.profession.title,
            detail: await this.atlasClient.getProfession(apiUrl, matches[0].slug),
          });
        } else if (matches.length > 1) {
          duplicateProfessions.push(item.profession.title);
        } else {
          unmatchedProfessions.push(item.profession.title);
        }
      }

      const details = matchedProfessions.map((item) => item.detail);
      const professionSlugs = details.map((profession) => profession.slug);
      const [enterprises, events] =
        professionSlugs.length > 0
          ? await Promise.all([
              this.atlasClient.findEnterprises(apiUrl),
              this.atlasClient.findEvents(apiUrl),
            ])
          : [[], []];
      const eventContextTerms = [
        ...selected.map((item) => item.profession.title),
        summary.primaryDirection?.name,
        summary.secondaryDirection?.name,
      ].filter((term): term is string => Boolean(term));
      const atlas: ProfOrientationAtlasRecommendations = {
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
        institutions: selectInstitutions(publicUrl, details),
      };

      return {
        ...summary,
        atlas,
      };
    } catch (error) {
      return {
        ...summary,
        atlas: {
          status: 'unavailable',
          publicUrl,
          apiUrl,
          errorMessage: error instanceof Error ? error.message : 'Atlas API request failed',
          unmatchedProfessions: selected.map((item) => item.profession.title),
          duplicateProfessions: [],
          professions: [],
          enterprises: [],
          events: [],
          institutions: [],
        },
      };
    }
  }

  async saveEnrichedAnalysis(analysisId: number, summary: ProfOrientationSummary) {
    const enrichedSummary = await this.enrichSummary(summary);

    await this.prisma.testStudentAnalysis.update({
      where: { id: analysisId },
      data: {
        summary: enrichedSummary as unknown as Prisma.InputJsonValue,
        rawText: JSON.stringify(enrichedSummary),
      },
    });

    return enrichedSummary;
  }
}
