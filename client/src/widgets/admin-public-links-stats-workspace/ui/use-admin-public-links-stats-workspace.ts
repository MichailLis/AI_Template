import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryOptions,
  testsAdminAnalyticsControllerExportPdf,
  testsAdminAnalyticsControllerExportXlsx,
  useTestsAdminAnalyticsControllerGetSummary,
  useTestsAdminAttemptsControllerGetAttemptDetail,
  useTestsAdminAttemptsControllerListPublicLinkAttempts,
  useTestsAdminPublicLinksControllerListArchivedPublicLinks,
  useTestsAdminPublicLinksControllerListPublicLinks,
} from '@/shared/api/generated/tests/tests';

import { downloadTestAnalyticsBlob } from './test-analytics-download';

import type {
  TestsAdminAnalyticsControllerExportPdfParams,
  TestsAdminAnalyticsControllerExportXlsxParams,
  TestsAdminAnalyticsControllerGetSummaryLinkStatus,
  TestsAdminAnalyticsControllerGetSummaryParams,
  TestsAdminAnalyticsControllerGetSummaryScope,
} from '@/shared/api/model';

type PublicLinksTab = 'active' | 'archived';
type AttemptDetailView = 'analysis' | 'answers';
type AnalyticsScope = TestsAdminAnalyticsControllerGetSummaryScope;
type AnalyticsLinkStatus = TestsAdminAnalyticsControllerGetSummaryLinkStatus;
type AnalyticsExportFormat = 'xlsx' | 'pdf';

const ATTEMPTS_LIMIT = 10;

interface PublicLinkSummary {
  id: number;
  topicId: number;
  shortCode: string;
  title: string;
}

interface TopicOption {
  id: number;
  title: string;
}

const buildTopicOptions = (links: PublicLinkSummary[]): TopicOption[] => {
  const options = new Map<number, string>();

  for (const link of links) {
    if (!options.has(link.topicId)) {
      options.set(link.topicId, link.title);
    }
  }

  return Array.from(options.entries()).map(([id, title]) => ({ id, title }));
};

const resolveEffectiveTopicId = (selectedTopicId: number | null, topicOptions: TopicOption[]) => {
  if (topicOptions.length === 0) {
    return null;
  }

  if (selectedTopicId && topicOptions.some((topic) => topic.id === selectedTopicId)) {
    return selectedTopicId;
  }

  return topicOptions[0].id;
};

const resolveEffectivePublicLinkId = (
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

const buildAnalyticsParams = ({
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

const buildAnalyticsFileName = (topicId: number, format: AnalyticsExportFormat) =>
  `test-analytics-${topicId}.${format}`;

const usePublicLinksData = () => {
  const listPublicLinksQuery = useTestsAdminPublicLinksControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsAdminPublicLinksControllerListArchivedPublicLinks();

  const activePublicLinks = useMemo(
    () => listPublicLinksQuery.data?.links ?? [],
    [listPublicLinksQuery.data?.links],
  );
  const archivedPublicLinks = useMemo(
    () => listArchivedPublicLinksQuery.data?.links ?? [],
    [listArchivedPublicLinksQuery.data?.links],
  );

  return { activePublicLinks, archivedPublicLinks };
};

const usePublicLinkAttemptCounts = (linksForTopic: PublicLinkSummary[]) => {
  const linkAttemptsCountQueries = useQueries({
    queries: linksForTopic.map((link) => ({
      ...getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryOptions(link.id, {
        limit: 1,
      }),
      staleTime: 30_000,
      select: (data: { total: number }) => data.total,
    })),
  });

  return useMemo(() => {
    const result = new Map<number, number>();

    linksForTopic.forEach((link, index) => {
      result.set(link.id, linkAttemptsCountQueries[index]?.data ?? 0);
    });

    return result;
  }, [linkAttemptsCountQueries, linksForTopic]);
};

const usePublicLinkSelection = (
  activePublicLinks: PublicLinkSummary[],
  archivedPublicLinks: PublicLinkSummary[],
) => {
  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [attemptsPage, setAttemptsPage] = useState(1);

  const visiblePublicLinks = useMemo(
    () => (publicLinksTab === 'active' ? activePublicLinks : archivedPublicLinks),
    [activePublicLinks, archivedPublicLinks, publicLinksTab],
  );
  const topicOptions = useMemo(() => buildTopicOptions(visiblePublicLinks), [visiblePublicLinks]);
  const effectiveTopicId = useMemo(
    () => resolveEffectiveTopicId(selectedTopicId, topicOptions),
    [selectedTopicId, topicOptions],
  );
  const linksForTopic = useMemo(
    () =>
      effectiveTopicId
        ? visiblePublicLinks.filter((link) => link.topicId === effectiveTopicId)
        : [],
    [effectiveTopicId, visiblePublicLinks],
  );

  const linkAttemptsCountById = usePublicLinkAttemptCounts(linksForTopic);
  const effectivePublicLinkId = useMemo(
    () => resolveEffectivePublicLinkId(selectedPublicLinkId, linksForTopic),
    [linksForTopic, selectedPublicLinkId],
  );
  const selectedPublicLink =
    linksForTopic.find((link) => link.id === effectivePublicLinkId) ?? null;

  const handleTabChange = (tab: PublicLinksTab) => {
    setPublicLinksTab(tab);
    setSelectedTopicId(null);
    setSelectedPublicLinkId(null);
    setAttemptsPage(1);
  };
  const handleTopicChange = (topicId: number) => {
    setSelectedTopicId(topicId);
    setSelectedPublicLinkId(null);
    setAttemptsPage(1);
  };
  const handlePublicLinkChange = (publicLinkId: number) => {
    setSelectedPublicLinkId(publicLinkId);
    setAttemptsPage(1);
  };

  return {
    publicLinksTab,
    topicOptions,
    effectiveTopicId,
    linksForTopic,
    effectivePublicLinkId,
    linkAttemptsCountById,
    selectedPublicLink,
    attemptsPage,
    setAttemptsPage,
    setSelectedPublicLinkId: handlePublicLinkChange,
    handleTabChange,
    handleTopicChange,
  };
};

const useAnalyticsReport = (
  effectiveTopicId: number | null,
  effectivePublicLinkId: number | null,
) => {
  const [analyticsScope, setAnalyticsScope] = useState<AnalyticsScope>('TOPIC');
  const [analyticsLinkStatus, setAnalyticsLinkStatus] = useState<AnalyticsLinkStatus>('ALL');
  const [analyticsDateFrom, setAnalyticsDateFrom] = useState('');
  const [analyticsDateTo, setAnalyticsDateTo] = useState('');
  const [analyticsExportFormat, setAnalyticsExportFormat] = useState<AnalyticsExportFormat | null>(
    null,
  );
  const [analyticsExportError, setAnalyticsExportError] = useState<string | null>(null);

  const analyticsParams = useMemo(
    () =>
      buildAnalyticsParams({
        scope: analyticsScope,
        publicLinkId: effectivePublicLinkId,
        linkStatus: analyticsLinkStatus,
        dateFrom: analyticsDateFrom,
        dateTo: analyticsDateTo,
      }),
    [
      analyticsDateFrom,
      analyticsDateTo,
      analyticsLinkStatus,
      analyticsScope,
      effectivePublicLinkId,
    ],
  );
  const isAnalyticsQueryEnabled = Boolean(
    effectiveTopicId && (analyticsScope === 'TOPIC' || effectivePublicLinkId),
  );
  const analyticsSummaryQuery = useTestsAdminAnalyticsControllerGetSummary(
    effectiveTopicId ?? 0,
    analyticsParams,
    { query: { enabled: isAnalyticsQueryEnabled } },
  );

  const clearExportError = () => setAnalyticsExportError(null);
  const handleAnalyticsScopeChange = (scope: AnalyticsScope) => {
    setAnalyticsScope(scope);
    clearExportError();
  };
  const handleAnalyticsLinkStatusChange = (linkStatus: AnalyticsLinkStatus) => {
    setAnalyticsLinkStatus(linkStatus);
    clearExportError();
  };
  const handleAnalyticsDateFromChange = (dateFrom: string) => {
    setAnalyticsDateFrom(dateFrom);
    clearExportError();
  };
  const handleAnalyticsDateToChange = (dateTo: string) => {
    setAnalyticsDateTo(dateTo);
    clearExportError();
  };

  const handleExportAnalytics = async (format: AnalyticsExportFormat) => {
    if (!effectiveTopicId || !isAnalyticsQueryEnabled) {
      return;
    }

    setAnalyticsExportFormat(format);
    setAnalyticsExportError(null);

    try {
      const blob =
        format === 'xlsx'
          ? await testsAdminAnalyticsControllerExportXlsx(
              effectiveTopicId,
              analyticsParams as TestsAdminAnalyticsControllerExportXlsxParams,
            )
          : await testsAdminAnalyticsControllerExportPdf(
              effectiveTopicId,
              analyticsParams as TestsAdminAnalyticsControllerExportPdfParams,
            );

      downloadTestAnalyticsBlob(blob, buildAnalyticsFileName(effectiveTopicId, format));
    } catch {
      setAnalyticsExportError('Не удалось сформировать файл отчета. Попробуйте еще раз.');
    } finally {
      setAnalyticsExportFormat(null);
    }
  };

  return {
    analyticsScope,
    analyticsLinkStatus,
    analyticsDateFrom,
    analyticsDateTo,
    analyticsSummary: analyticsSummaryQuery.data ?? null,
    analyticsSummaryQuery,
    analyticsExportFormat,
    analyticsExportError,
    isAnalyticsQueryEnabled,
    handleAnalyticsScopeChange,
    handleAnalyticsLinkStatusChange,
    handleAnalyticsDateFromChange,
    handleAnalyticsDateToChange,
    handleExportAnalytics,
  };
};

const usePaginatedPublicAttempts = (effectivePublicLinkId: number | null, attemptsPage: number) => {
  const publicAttemptsQuery = useTestsAdminAttemptsControllerListPublicLinkAttempts(
    effectivePublicLinkId ?? 0,
    { page: attemptsPage, limit: ATTEMPTS_LIMIT },
    { query: { enabled: Boolean(effectivePublicLinkId) } },
  );
  const publicAttempts = useMemo(
    () => publicAttemptsQuery.data?.attempts ?? [],
    [publicAttemptsQuery.data?.attempts],
  );

  return {
    publicAttempts,
    publicAttemptsPage: publicAttemptsQuery.data?.page ?? attemptsPage,
    publicAttemptsQuery,
    publicAttemptsTotal: publicAttemptsQuery.data?.total ?? 0,
    publicAttemptsTotalPages: publicAttemptsQuery.data?.totalPages ?? 1,
  };
};

const useAttemptDetail = () => {
  const [detailAttemptId, setDetailAttemptId] = useState<number | null>(null);
  const [detailView, setDetailView] = useState<AttemptDetailView | null>(null);
  const attemptDetailQuery = useTestsAdminAttemptsControllerGetAttemptDetail(detailAttemptId ?? 0, {
    query: { enabled: Boolean(detailAttemptId) },
  });

  const handleOpenAttemptDetails = (attemptId: number, view: AttemptDetailView) => {
    setDetailAttemptId(attemptId);
    setDetailView(view);
  };
  const handleCloseAttemptDetails = () => {
    setDetailView(null);
    setDetailAttemptId(null);
  };

  return {
    detailView,
    detailAttempt: attemptDetailQuery.data,
    attemptDetailQuery,
    isDetailDialogOpen: detailView !== null,
    handleOpenAttemptDetails,
    handleCloseAttemptDetails,
  };
};

export function useAdminPublicLinksStatsWorkspace() {
  const { activePublicLinks, archivedPublicLinks } = usePublicLinksData();
  const selection = usePublicLinkSelection(activePublicLinks, archivedPublicLinks);
  const attempts = usePaginatedPublicAttempts(
    selection.effectivePublicLinkId,
    selection.attemptsPage,
  );
  const detail = useAttemptDetail();

  const handlePreviousAttemptsPage = () => {
    selection.setAttemptsPage((previous) => Math.max(1, previous - 1));
  };
  const handleNextAttemptsPage = () => {
    selection.setAttemptsPage((previous) =>
      Math.min(attempts.publicAttemptsTotalPages, previous + 1),
    );
  };

  return {
    ...selection,
    ...attempts,
    ...detail,
    handlePreviousAttemptsPage,
    handleNextAttemptsPage,
  };
}

export function useAdminTestAnalyticsReportWorkspace() {
  const { activePublicLinks, archivedPublicLinks } = usePublicLinksData();
  const selection = usePublicLinkSelection(activePublicLinks, archivedPublicLinks);
  const analytics = useAnalyticsReport(selection.effectiveTopicId, selection.effectivePublicLinkId);

  return {
    ...selection,
    ...analytics,
  };
}
