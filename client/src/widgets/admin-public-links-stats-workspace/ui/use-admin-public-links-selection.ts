import { useQueries } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import {
  getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryOptions,
  useTestsAdminPublicLinksControllerListArchivedPublicLinks,
  useTestsAdminPublicLinksControllerListPublicLinks,
} from '@/shared/api/generated/tests/tests';

import {
  buildTopicOptions,
  resolveEffectivePublicLinkId,
  resolveEffectiveTopicId,
} from './use-admin-public-links-stats-workspace.model';

import type {
  PublicLinksTab,
  PublicLinkSummary,
} from './use-admin-public-links-stats-workspace.model';

export const usePublicLinksData = () => {
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

export const usePublicLinkSelection = (
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
