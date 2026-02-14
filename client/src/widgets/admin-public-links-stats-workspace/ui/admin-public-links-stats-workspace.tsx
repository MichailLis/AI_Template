import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  getTestsControllerListPublicLinkAttemptsQueryOptions,
  useTestsControllerGetAttemptDetail,
  useTestsControllerListArchivedPublicLinks,
  useTestsControllerListPublicLinkAttempts,
  useTestsControllerListPublicLinks,
} from '@/shared/api/generated/tests/tests';

import { PublicLinksAttemptDetailDialog } from './public-links-attempt-detail-dialog';
import { PublicLinksAttemptsTableCard } from './public-links-attempts-table-card';
import { PublicLinksStatsFiltersCard } from './public-links-stats-filters-card';

type PublicLinksTab = 'active' | 'archived';
type AttemptDetailView = 'analysis' | 'answers';

const formatDateTime = (value: string | null) => {
  if (!value) {
    return '—';
  }

  return new Date(value).toLocaleString();
};

const toPrettyJson = (value: unknown) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export function AdminPublicLinksStatsWorkspace() {
  const listPublicLinksQuery = useTestsControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsControllerListArchivedPublicLinks();

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

  const topicOptions = useMemo(() => {
    const options = new Map<number, string>();

    for (const link of visiblePublicLinks) {
      if (!options.has(link.topicId)) {
        options.set(link.topicId, link.title);
      }
    }

    return Array.from(options.entries()).map(([id, title]) => ({
      id,
      title,
    }));
  }, [visiblePublicLinks]);

  const effectiveTopicId = useMemo(() => {
    if (topicOptions.length === 0) {
      return null;
    }

    if (selectedTopicId && topicOptions.some((topic) => topic.id === selectedTopicId)) {
      return selectedTopicId;
    }

    return topicOptions[0].id;
  }, [selectedTopicId, topicOptions]);

  const linksForTopic = useMemo(() => {
    if (!effectiveTopicId) {
      return [];
    }

    return visiblePublicLinks.filter((link) => link.topicId === effectiveTopicId);
  }, [effectiveTopicId, visiblePublicLinks]);

  const linkAttemptsCountQueries = useQueries({
    queries: linksForTopic.map((link) => ({
      ...getTestsControllerListPublicLinkAttemptsQueryOptions(link.id),
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

  const effectivePublicLinkId = useMemo(() => {
    if (linksForTopic.length === 0) {
      return null;
    }

    if (selectedPublicLinkId && linksForTopic.some((link) => link.id === selectedPublicLinkId)) {
      return selectedPublicLinkId;
    }

    return linksForTopic[0].id;
  }, [linksForTopic, selectedPublicLinkId]);

  const selectedPublicLink =
    linksForTopic.find((link) => link.id === effectivePublicLinkId) ?? null;

  const publicAttemptsQuery = useTestsControllerListPublicLinkAttempts(effectivePublicLinkId ?? 0, {
    query: {
      enabled: Boolean(effectivePublicLinkId),
    },
  });

  const publicAttempts = useMemo(
    () => publicAttemptsQuery.data?.attempts ?? [],
    [publicAttemptsQuery.data?.attempts],
  );

  const attemptDetailQuery = useTestsControllerGetAttemptDetail(detailAttemptId ?? 0, {
    query: {
      enabled: Boolean(detailAttemptId),
    },
  });

  const isDetailDialogOpen = detailView !== null;

  const openAttemptDetails = (attemptId: number, view: AttemptDetailView) => {
    setDetailAttemptId(attemptId);
    setDetailView(view);
  };

  const closeAttemptDetails = () => {
    setDetailView(null);
    setDetailAttemptId(null);
  };

  const detailAttempt = attemptDetailQuery.data;

  return (
    <div className="space-y-4">
      <PublicLinksStatsFiltersCard
        publicLinksTab={publicLinksTab}
        onTabChange={(tab) => {
          setPublicLinksTab(tab);
          setSelectedTopicId(null);
          setSelectedPublicLinkId(null);
        }}
        topicOptions={topicOptions}
        effectiveTopicId={effectiveTopicId}
        onTopicChange={(topicId) => {
          setSelectedTopicId(topicId);
          setSelectedPublicLinkId(null);
        }}
        linksForTopic={linksForTopic}
        effectivePublicLinkId={effectivePublicLinkId}
        onPublicLinkChange={setSelectedPublicLinkId}
        linkAttemptsCountById={linkAttemptsCountById}
      />

      <PublicLinksAttemptsTableCard
        selectedPublicLink={selectedPublicLink}
        publicAttempts={publicAttempts}
        isLoading={publicAttemptsQuery.isLoading}
        formatDateTime={formatDateTime}
        onOpenAttemptDetails={openAttemptDetails}
      />

      <PublicLinksAttemptDetailDialog
        isOpen={isDetailDialogOpen}
        detailView={detailView}
        detailAttempt={detailAttempt ?? null}
        isLoading={attemptDetailQuery.isLoading}
        onClose={closeAttemptDetails}
        formatDateTime={formatDateTime}
        toPrettyJson={toPrettyJson}
      />
    </div>
  );
}
