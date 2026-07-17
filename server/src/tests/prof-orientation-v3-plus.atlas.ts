import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import {
  type AtlasProfessionDetail,
  ProfessionAtlasClientService,
} from '../app-settings/profession-atlas-client.service';
import { ProfessionAtlasSettingsService } from '../app-settings/profession-atlas-settings.service';
import { PrismaService } from '../prisma.service';
import { getProfOrientationV3PlusProfessions } from './prof-orientation-v3-plus.fixture';
import {
  buildProfOrientationAtlasInstitutionSearchTerms,
  buildProfOrientationAtlasRecommendations,
  createUnavailableAtlasRecommendations,
  selectProfOrientationAtlasProfessions,
} from './prof-orientation-v3-plus.atlas.logic';

import type { ProfOrientationSummary } from './prof-orientation-v3-plus.types';

export {
  selectProfOrientationAtlasProfessions,
  shouldRefreshProfOrientationAtlasSummary,
} from './prof-orientation-v3-plus.atlas.logic';

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
        atlas: createUnavailableAtlasRecommendations({
          publicUrl: settings.publicUrl,
          apiUrl: settings.apiUrl,
          errorMessage: 'Atlas URL is not configured',
          unmatchedProfessions: [],
        }),
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
      const institutionSearchTerms = buildProfOrientationAtlasInstitutionSearchTerms(
        summary,
        selected,
        details,
      );
      const [enterprises, events, searchedInstitutionGroups] =
        professionSlugs.length > 0
          ? await Promise.all([
              this.atlasClient.findEnterprises(apiUrl),
              this.atlasClient.findEvents(apiUrl),
              Promise.all(
                institutionSearchTerms.map(({ term }) =>
                  this.atlasClient.findInstitutions(apiUrl, { q: term, pageSize: 8 }),
                ),
              ),
            ])
          : [[], [], []];
      const searchedInstitutionMatches = searchedInstitutionGroups.flatMap(
        (institutions, termIndex) =>
          institutions.map((institution, resultIndex) => ({
            institution,
            termIndex,
            resultIndex,
            signalStrength: institutionSearchTerms[termIndex]?.signalStrength ?? 0,
          })),
      );
      const atlas = buildProfOrientationAtlasRecommendations({
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
      });

      return {
        ...summary,
        atlas,
      };
    } catch (error) {
      return {
        ...summary,
        atlas: createUnavailableAtlasRecommendations({
          publicUrl,
          apiUrl,
          errorMessage: error instanceof Error ? error.message : 'Atlas API request failed',
          unmatchedProfessions: selected.map((item) => item.profession.title),
        }),
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
