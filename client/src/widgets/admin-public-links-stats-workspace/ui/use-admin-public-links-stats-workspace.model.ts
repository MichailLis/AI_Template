import type {
  TestsAdminAnalyticsControllerGetSummaryLinkStatus,
  TestsAdminAnalyticsControllerGetSummaryParams,
  TestsAdminAnalyticsControllerGetSummaryScope,
} from '@/shared/api/model';

export type PublicLinksTab = 'active' | 'archived';
export type AnalyticsTab = 'report' | 'attempts';
export type AttemptDetailView = 'analysis' | 'answers';
export type AnalyticsScope = TestsAdminAnalyticsControllerGetSummaryScope;
export type AnalyticsLinkStatus = TestsAdminAnalyticsControllerGetSummaryLinkStatus;
export type AnalyticsExportFormat = 'xlsx' | 'pdf';

export const ATTEMPTS_LIMIT = 10;
export const ATTEMPTS_LIMIT_OPTIONS = [10, 25, 50];

export const resolveAnalyticsTab = (value: string | null): AnalyticsTab =>
  value === 'attempts' ? 'attempts' : 'report';

/**
 * Чтение выбора из строки запроса. Значения приходят от пользователя (адресная строка, закладка),
 * поэтому любое непонятное значение молча превращается в значение по умолчанию.
 */
export const readTab = (value: string | null): PublicLinksTab =>
  value === 'archived' ? 'archived' : 'active';

export const readNumber = (value: string | null) => {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const readLimit = (value: string | null) => {
  const parsed = readNumber(value);

  return parsed && ATTEMPTS_LIMIT_OPTIONS.includes(parsed) ? parsed : ATTEMPTS_LIMIT;
};

export interface PublicLinkSummary {
  id: number;
  topicId: number;
  shortCode: string;
  title: string;
}

export interface TopicOption {
  id: number;
  title: string;
}

export const buildTopicOptions = (links: PublicLinkSummary[]): TopicOption[] => {
  const options = new Map<number, string>();

  for (const link of links) {
    if (!options.has(link.topicId)) {
      options.set(link.topicId, link.title);
    }
  }

  return Array.from(options.entries()).map(([id, title]) => ({ id, title }));
};

export const resolveEffectiveTopicId = (
  selectedTopicId: number | null,
  topicOptions: TopicOption[],
) => {
  if (topicOptions.length === 0) {
    return null;
  }

  if (selectedTopicId && topicOptions.some((topic) => topic.id === selectedTopicId)) {
    return selectedTopicId;
  }

  return topicOptions[0].id;
};

export const resolveEffectivePublicLinkId = (
  selectedPublicLinkId: number | null,
  linksForTopic: PublicLinkSummary[],
) => {
  if (linksForTopic.length === 0) {
    return null;
  }

  if (selectedPublicLinkId && linksForTopic.some((link) => link.id === selectedPublicLinkId)) {
    return selectedPublicLinkId;
  }

  return linksForTopic[0].id;
};

export const buildAnalyticsParams = ({
  scope,
  publicLinkId,
  linkStatus,
  dateFrom,
  dateTo,
}: {
  scope: AnalyticsScope;
  publicLinkId: number | null;
  linkStatus: AnalyticsLinkStatus;
  dateFrom: string;
  dateTo: string;
}): TestsAdminAnalyticsControllerGetSummaryParams => ({
  scope,
  linkStatus,
  ...(scope === 'PUBLIC_LINK' && publicLinkId ? { publicLinkId } : {}),
  ...(dateFrom ? { dateFrom } : {}),
  ...(dateTo ? { dateTo } : {}),
});

export const buildAnalyticsFileName = (topicId: number, format: AnalyticsExportFormat) =>
  `test-analytics-${topicId}.${format}`;
