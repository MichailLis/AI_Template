import { BadGatewayException, Injectable } from '@nestjs/common';

const ATLAS_API_TIMEOUT_MS = 10_000;

export interface AtlasProfessionListItem {
  title: string;
  slug: string;
}

export interface AtlasProfessionDetail extends AtlasProfessionListItem {
  summary: string | null;
  description: string | null;
  demandLevel: string | null;
  industry: AtlasNamedSlug | null;
  municipality: AtlasNamedSlug | null;
  skills: AtlasNamedSlug[];
  educationPrograms: AtlasEducationProgram[];
}

export interface AtlasNamedSlug {
  name: string;
  slug: string;
}

export interface AtlasEducationProgram {
  title: string;
  slug: string;
  institution: AtlasNamedSlug & {
    municipality?: AtlasNamedSlug | null;
  };
}

export interface AtlasInstitution extends AtlasNamedSlug {
  municipality: AtlasNamedSlug | null;
  programsCount: number;
  levels: AtlasNamedSlug[];
}

export interface AtlasEnterprise {
  name: string;
  slug: string;
  summary: string | null;
  industry: string | null;
  municipality: AtlasNamedSlug | null;
  websiteUrl: string | null;
  opportunities: AtlasEnterpriseOpportunity[];
}

export interface AtlasEnterpriseOpportunity {
  title: string;
  description: string | null;
  type: string | null;
  audience: string | null;
  professionTitle: string | null;
  professionSlug: string | null;
}

export interface AtlasEvent {
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const getString = (value: unknown) => (typeof value === 'string' ? value : null);

const toNamedSlug = (value: unknown): AtlasNamedSlug | null => {
  if (!isRecord(value)) {
    return null;
  }

  const name = getString(value.name);
  const slug = getString(value.slug);

  return name && slug ? { name, slug } : null;
};

const toProfessionListItem = (value: unknown): AtlasProfessionListItem | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = getString(value.title);
  const slug = getString(value.slug);

  return title && slug ? { title, slug } : null;
};

const toEducationProgram = (value: unknown): AtlasEducationProgram | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = getString(value.title);
  const slug = getString(value.slug);
  const institution = toNamedSlug(value.institution);

  if (!title || !slug || !institution || !isRecord(value.institution)) {
    return null;
  }

  return {
    title,
    slug,
    institution: {
      ...institution,
      municipality: toNamedSlug(value.institution.municipality),
    },
  };
};

const mapArray = <T>(value: unknown, mapper: (item: unknown) => T | null): T[] =>
  Array.isArray(value) ? value.map(mapper).filter((item): item is T => item !== null) : [];

const toProfessionDetail = (value: unknown): AtlasProfessionDetail => {
  const item = toProfessionListItem(value);

  if (!item || !isRecord(value)) {
    throw new BadGatewayException('Atlas returned an invalid profession payload');
  }

  return {
    ...item,
    summary: getString(value.summary),
    description: getString(value.description),
    demandLevel: getString(value.demandLevel),
    industry: toNamedSlug(value.industry),
    municipality: toNamedSlug(value.municipality),
    skills: mapArray(value.skills, toNamedSlug),
    educationPrograms: mapArray(value.educationPrograms, toEducationProgram),
  };
};

const toInstitution = (value: unknown): AtlasInstitution | null => {
  if (!isRecord(value)) {
    return null;
  }

  const name = getString(value.name);
  const slug = getString(value.slug);

  if (!name || !slug) {
    return null;
  }

  return {
    name,
    slug,
    municipality: toNamedSlug(value.municipality),
    programsCount: typeof value.programsCount === 'number' ? value.programsCount : 0,
    levels: mapArray(value.levels, toNamedSlug),
  };
};

const toEnterpriseOpportunity = (value: unknown): AtlasEnterpriseOpportunity | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = getString(value.title);

  if (!title) {
    return null;
  }

  return {
    title,
    description: getString(value.description),
    type: getString(value.type),
    audience: getString(value.audience),
    professionTitle: getString(value.professionTitle),
    professionSlug: getString(value.professionSlug),
  };
};

const toEnterprise = (value: unknown): AtlasEnterprise | null => {
  if (!isRecord(value)) {
    return null;
  }

  const name = getString(value.name);
  const slug = getString(value.slug);

  if (!name || !slug) {
    return null;
  }

  return {
    name,
    slug,
    summary: getString(value.summary),
    industry: getString(value.industry),
    municipality: toNamedSlug(value.municipality),
    websiteUrl: getString(value.websiteUrl),
    opportunities: mapArray(value.opportunities, toEnterpriseOpportunity),
  };
};

const toEvent = (value: unknown): AtlasEvent | null => {
  if (!isRecord(value)) {
    return null;
  }

  const title = getString(value.title);
  const slug = getString(value.slug);

  if (!title || !slug) {
    return null;
  }

  return {
    title,
    slug,
    type: getString(value.type),
    startsAt: getString(value.startsAt),
    endsAt: getString(value.endsAt),
    municipality: toNamedSlug(value.municipality),
    location: getString(value.location),
    summary: getString(value.summary),
    audience: getString(value.audience),
    registrationUrl: getString(value.registrationUrl),
  };
};

const buildAtlasApiUrl = (
  apiUrl: string,
  path: string,
  query?: Record<string, string | number | undefined>,
) => {
  const url = new URL(path.replace(/^\/+/, ''), `${apiUrl.replace(/\/+$/, '')}/`);

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) {
      url.searchParams.set(key, String(value));
    }
  }

  return url;
};

const getCollectionItems = (payload: unknown): unknown[] => {
  return isRecord(payload) && Array.isArray(payload.items) ? (payload.items as unknown[]) : [];
};

@Injectable()
export class ProfessionAtlasClientService {
  private async fetchJson(
    apiUrl: string,
    path: string,
    query?: Record<string, string | number | undefined>,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ATLAS_API_TIMEOUT_MS);

    try {
      const response = await fetch(buildAtlasApiUrl(apiUrl, path, query), {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new BadGatewayException(`Atlas API request failed with ${response.status}`);
      }

      return (await response.json()) as unknown;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new BadGatewayException('Atlas API request timeout');
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async findProfessions(apiUrl: string, query: { q?: string; pageSize?: number } = {}) {
    const payload = await this.fetchJson(apiUrl, 'professions', {
      q: query.q,
      pageSize: query.pageSize ?? 12,
    });

    return getCollectionItems(payload)
      .map(toProfessionListItem)
      .filter((item): item is AtlasProfessionListItem => item !== null);
  }

  async getProfession(apiUrl: string, slug: string) {
    return toProfessionDetail(await this.fetchJson(apiUrl, `professions/${slug}`));
  }

  async findEnterprises(apiUrl: string, pageSize = 48) {
    const payload = await this.fetchJson(apiUrl, 'enterprises', { pageSize });

    return getCollectionItems(payload)
      .map(toEnterprise)
      .filter((item): item is AtlasEnterprise => item !== null);
  }

  async findEvents(apiUrl: string, pageSize = 48) {
    const payload = await this.fetchJson(apiUrl, 'events', { pageSize });

    return getCollectionItems(payload)
      .map(toEvent)
      .filter((item): item is AtlasEvent => item !== null);
  }

  async findInstitutions(
    apiUrl: string,
    query: { q?: string; pageSize?: number } = {},
  ): Promise<AtlasInstitution[]> {
    const payload = await this.fetchJson(apiUrl, 'professions/institutions', {
      q: query.q,
      pageSize: query.pageSize ?? 8,
    });

    return getCollectionItems(payload)
      .map(toInstitution)
      .filter((item): item is AtlasInstitution => item !== null);
  }
}
