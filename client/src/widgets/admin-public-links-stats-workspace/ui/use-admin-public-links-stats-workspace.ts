import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryOptions,
  useTestsAdminAttemptsControllerGetAttemptDetail,
  useTestsAdminAttemptsControllerListPublicLinkAttempts,
  useTestsAdminPublicLinksControllerListArchivedPublicLinks,
  useTestsAdminPublicLinksControllerListPublicLinks,
} from '@/shared/api/generated/tests/tests';

type PublicLinksTab = 'active' | 'archived';
type AttemptDetailView = 'analysis' | 'answers';

interface PublicLinkSummary {
  id: number;
  topicId: number;
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

export function useAdminPublicLinksStatsWorkspace() {
  const listPublicLinksQuery = useTestsAdminPublicLinksControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsAdminPublicLinksControllerListArchivedPublicLinks();

  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [detailAttemptId, setDetailAttemptId] = useState<number | null>(null);
  const [detailView, setDetailView] = useState<AttemptDetailView | null>(null);

  const activePublicLinks = useMemo(
    () => listPublicLinksQuery.data?.links ?? [],
    [listPublicLinksQuery.data?.links],
  );
  const archivedPublicLinks = useMemo(
    () => listArchivedPublicLinksQuery.data?.links ?? [],
    [listArchivedPublicLinksQuery.data?.links],
  );

  const visiblePublicLinks = useMemo(
    () => (publicLinksTab === 'active' ? activePublicLinks : archivedPublicLinks),
    [activePublicLinks, archivedPublicLinks, publicLinksTab],
  );

  const topicOptions = useMemo(() => buildTopicOptions(visiblePublicLinks), [visiblePublicLinks]);
  const effectiveTopicId = useMemo(
    () => resolveEffectiveTopicId(selectedTopicId, topicOptions),
    [selectedTopicId, topicOptions],
  );

  const linksForTopic = useMemo(() => {
    if (!effectiveTopicId) {
      return [];
    }

    return visiblePublicLinks.filter((link) => link.topicId === effectiveTopicId);
  }, [effectiveTopicId, visiblePublicLinks]);

  const linkAttemptsCountQueries = useQueries({
    queries: linksForTopic.map((link) => ({
      ...getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryOptions(link.id),
      staleTime: 30_000,
      select: (data: { attempts: unknown[] }) => data.attempts.length,
    })),
  });

  const linkAttemptsCountById = useMemo(() => {
    const result = new Map<number, number>();

    linksForTopic.forEach((link, index) => {
      result.set(link.id, linkAttemptsCountQueries[index]?.data ?? 0);
    });

    return result;
  }, [linkAttemptsCountQueries, linksForTopic]);

  const effectivePublicLinkId = useMemo(
    () => resolveEffectivePublicLinkId(selectedPublicLinkId, linksForTopic),
    [linksForTopic, selectedPublicLinkId],
  );

  const selectedPublicLink =
    linksForTopic.find((link) => link.id === effectivePublicLinkId) ?? null;

  const publicAttemptsQuery = useTestsAdminAttemptsControllerListPublicLinkAttempts(
    effectivePublicLinkId ?? 0,
    {
      query: {
        enabled: Boolean(effectivePublicLinkId),
      },
    },
  );

  const publicAttempts = useMemo(
    () => publicAttemptsQuery.data?.attempts ?? [],
    [publicAttemptsQuery.data?.attempts],
  );

  const attemptDetailQuery = useTestsAdminAttemptsControllerGetAttemptDetail(detailAttemptId ?? 0, {
    query: {
      enabled: Boolean(detailAttemptId),
    },
  });

  const detailAttempt = attemptDetailQuery.data;
  const isDetailDialogOpen = detailView !== null;

  const handleTabChange = (tab: PublicLinksTab) => {
    setPublicLinksTab(tab);
    setSelectedTopicId(null);
    setSelectedPublicLinkId(null);
  };

  const handleTopicChange = (topicId: number) => {
    setSelectedTopicId(topicId);
    setSelectedPublicLinkId(null);
  };

  const handleOpenAttemptDetails = (attemptId: number, view: AttemptDetailView) => {
    setDetailAttemptId(attemptId);
    setDetailView(view);
  };

  const handleCloseAttemptDetails = () => {
    setDetailView(null);
    setDetailAttemptId(null);
  };

  return {
    publicLinksTab,
    topicOptions,
    effectiveTopicId,
    linksForTopic,
    effectivePublicLinkId,
    linkAttemptsCountById,
    selectedPublicLink,
    publicAttempts,
    publicAttemptsQuery,
    detailView,
    detailAttempt,
    attemptDetailQuery,
    isDetailDialogOpen,
    setSelectedPublicLinkId,
    handleTabChange,
    handleTopicChange,
    handleOpenAttemptDetails,
    handleCloseAttemptDetails,
  };
}
