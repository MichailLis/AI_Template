import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { useTestsControllerListTopics } from '@/shared/api/generated/tests/tests';
import { parseApiError } from '@/shared/lib/api-error';

export type ListMode = 'active' | 'archived';

export function useAdminTestsTopics() {
  const { topicId: topicIdParam } = useParams<{ topicId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTopicsQuery = useTestsControllerListTopics();
  const archivedTopicsQuery = useTestsControllerListTopics({ archived: true });
  const [listMode, setListMode] = useState<ListMode>('active');

  const topicsQuery = useMemo(
    () => (listMode === 'active' ? activeTopicsQuery : archivedTopicsQuery),
    [activeTopicsQuery, archivedTopicsQuery, listMode],
  );

  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);
  const archivedTopics = useMemo(
    () => archivedTopicsQuery.data?.topics ?? [],
    [archivedTopicsQuery.data?.topics],
  );

  const routeSelectedTopicId = useMemo(() => {
    if (!topicIdParam) {
      return null;
    }

    const parsedTopicId = Number(topicIdParam);
    if (!Number.isInteger(parsedTopicId) || parsedTopicId <= 0) {
      return null;
    }

    return parsedTopicId;
  }, [topicIdParam]);

  const effectiveSelectedTopicId = useMemo(() => {
    if (location.pathname === '/admin/tests') {
      return null;
    }

    return routeSelectedTopicId;
  }, [location.pathname, routeSelectedTopicId]);

  const navigateToTopic = useCallback(
    (topicId: number) => {
      navigate(`/admin/tests/${topicId}`);
    },
    [navigate],
  );

  const topicsErrorMessage = topicsQuery.isError ? parseApiError(topicsQuery.error) : null;

  const isSelectedTopicArchived = useMemo(() => {
    if (!effectiveSelectedTopicId) {
      return false;
    }

    return archivedTopics.some((topic) => topic.id === effectiveSelectedTopicId);
  }, [archivedTopics, effectiveSelectedTopicId]);

  const refetchTopicsOnly = useCallback(() => {
    void Promise.all([activeTopicsQuery.refetch(), archivedTopicsQuery.refetch()]);
  }, [activeTopicsQuery, archivedTopicsQuery]);

  return {
    activeTopicsQuery,
    archivedTopicsQuery,
    topicsQuery,
    topics,
    topicsErrorMessage,
    effectiveSelectedTopicId,
    navigateToTopic,
    listMode,
    setListMode,
    isSelectedTopicArchived,
    refetchTopicsOnly,
  };
}
