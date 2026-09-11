import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  getTestsAdminAttemptsControllerListPublicLinkAttemptsQueryOptions,
  useTestsAdminPublicLinksControllerListArchivedPublicLinks,
  useTestsAdminPublicLinksControllerListPublicLinks,
} from '@/shared/api/generated/tests/tests';

import {
  ATTEMPTS_LIMIT,
  buildTopicOptions,
  readLimit,
  readNumber,
  readTab,
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

  /**
   * Ошибка загрузки списков отдается наружу: без нее экран аналитики показывал «нет доступных
   * тестов», то есть выдавал отказ сервера за пустые данные.
   */
  return {
    activePublicLinks,
    archivedPublicLinks,
    isPublicLinksError: listPublicLinksQuery.isError || listArchivedPublicLinksQuery.isError,
    isPublicLinksLoading: listPublicLinksQuery.isLoading || listArchivedPublicLinksQuery.isLoading,
    refetchPublicLinks: () => {
      void listPublicLinksQuery.refetch();
      void listArchivedPublicLinksQuery.refetch();
    },
  };
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
  const [searchParams, setSearchParams] = useSearchParams();

  const publicLinksTab = readTab(searchParams.get('scope'));
  const selectedTopicId = readNumber(searchParams.get('topic'));
  const selectedPublicLinkId = readNumber(searchParams.get('link'));
  const attemptsPage = readNumber(searchParams.get('page')) ?? 1;
  const attemptsLimit = readLimit(searchParams.get('limit'));

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

  /**
   * Выбор живет в адресной строке, а не в состоянии компонента: ссылку на прохождения конкретной
   * публичной ссылки нужно уметь отправить коллеге и положить в закладку. `replace` — чтобы
   * переключение фильтров не забивало историю браузера.
   */
  const updateSelection = (patch: Record<string, string | null>) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);

        for (const [key, value] of Object.entries(patch)) {
          if (value === null) {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        }

        return next;
      },
      { replace: true },
    );
  };

  const handleTabChange = (tab: PublicLinksTab) => {
    updateSelection({
      scope: tab === 'active' ? null : tab,
      topic: null,
      link: null,
      page: null,
    });
  };
  const handleTopicChange = (topicId: number) => {
    updateSelection({ topic: String(topicId), link: null, page: null });
  };
  const handlePublicLinkChange = (publicLinkId: number) => {
    updateSelection({ link: String(publicLinkId), page: null });
  };
  const setAttemptsPage = (updater: (previous: number) => number) => {
    const nextPage = updater(attemptsPage);

    updateSelection({ page: nextPage <= 1 ? null : String(nextPage) });
  };
  const setAttemptsLimit = (limit: number) => {
    updateSelection({
      limit: limit === ATTEMPTS_LIMIT ? null : String(limit),
      page: null,
    });
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
    attemptsLimit,
    setAttemptsPage,
    setAttemptsLimit,
    setSelectedPublicLinkId: handlePublicLinkChange,
    handleTabChange,
    handleTopicChange,
  };
};
