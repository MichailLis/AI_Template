import { useMemo, useState } from 'react';

import {
  useTestsControllerCreatePublicLink,
  useTestsControllerDeletePublicLink,
  useTestsControllerGetTopicDraft,
  useTestsControllerListArchivedPublicLinks,
  useTestsControllerListPublicLinks,
  useTestsControllerListTopics,
  useTestsControllerRegeneratePublicLinkShortCode,
  useTestsControllerRestorePublicLink,
  useTestsControllerUpdatePublicLink,
} from '@/shared/api/generated/tests/tests';

import {
  resolveEffectivePublicLinkId,
  resolveEffectiveTopicId,
  type PublicLinksTab,
} from './admin-public-links-workspace.helpers';
import { useAdminPublicLinksActions } from './use-admin-public-links-actions';

export function useAdminPublicLinksWorkspace() {
  const topicsQuery = useTestsControllerListTopics();
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const topics = useMemo(() => topicsQuery.data?.topics ?? [], [topicsQuery.data?.topics]);
  const effectiveSelectedTopicId = useMemo(
    () => resolveEffectiveTopicId(selectedTopicId, topics),
    [selectedTopicId, topics],
  );

  const detailQuery = useTestsControllerGetTopicDraft(effectiveSelectedTopicId, {
    query: {
      enabled: effectiveSelectedTopicId > 0,
    },
  });

  const listPublicLinksQuery = useTestsControllerListPublicLinks();
  const listArchivedPublicLinksQuery = useTestsControllerListArchivedPublicLinks();
  const createPublicLinkMutation = useTestsControllerCreatePublicLink();
  const deletePublicLinkMutation = useTestsControllerDeletePublicLink();
  const updatePublicLinkMutation = useTestsControllerUpdatePublicLink();
  const regeneratePublicLinkShortCodeMutation = useTestsControllerRegeneratePublicLinkShortCode();
  const restorePublicLinkMutation = useTestsControllerRestorePublicLink();

  const [newPublicShortCode, setNewPublicShortCode] = useState('');
  const [newPublicMaxAttempts, setNewPublicMaxAttempts] = useState('3');
  const [newPublicTimeLimit, setNewPublicTimeLimit] = useState('30');
  const [newPublicAllowResume, setNewPublicAllowResume] = useState(true);
  const [newPublicConsentVersion, setNewPublicConsentVersion] = useState('v1');
  const [newPublicConsentText, setNewPublicConsentText] = useState(
    'Я даю согласие на обработку персональных данных для прохождения тестирования и формирования аналитики.',
  );
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [pendingDeletePublicLinkId, setPendingDeletePublicLinkId] = useState<number | null>(null);
  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');

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

  const effectivePublicLinkId = useMemo(
    () => resolveEffectivePublicLinkId(selectedPublicLinkId, visiblePublicLinks),
    [selectedPublicLinkId, visiblePublicLinks],
  );

  const refetchPublicLinks = () => {
    void Promise.all([listPublicLinksQuery.refetch(), listArchivedPublicLinksQuery.refetch()]);
  };

  const {
    handleCreatePublicLink,
    handleSwitchPublicLinksTab,
    handleCopyShortLink,
    handleOpenShortLinkQr,
    handleTogglePublicLink,
    handleRegeneratePublicLinkShortCode,
    handleDeletePublicLink,
    handleRestorePublicLink,
  } = useAdminPublicLinksActions({
    publishedVersionId: detailQuery.data?.published?.id,
    newPublicShortCode,
    newPublicMaxAttempts,
    newPublicTimeLimit,
    newPublicAllowResume,
    newPublicConsentVersion,
    newPublicConsentText,
    pendingDeletePublicLinkId,
    selectedPublicLinkId,
    createPublicLinkMutation,
    updatePublicLinkMutation,
    regeneratePublicLinkShortCodeMutation,
    deletePublicLinkMutation,
    restorePublicLinkMutation,
    setPublicLinksTab,
    setSelectedPublicLinkId,
    setPendingDeletePublicLinkId,
    setNewPublicShortCode,
    refetchPublicLinks,
  });

  return {
    topics,
    effectiveSelectedTopicId,
    detailQuery,
    newPublicShortCode,
    newPublicMaxAttempts,
    newPublicTimeLimit,
    newPublicAllowResume,
    newPublicConsentVersion,
    newPublicConsentText,
    pendingDeletePublicLinkId,
    publicLinksTab,
    visiblePublicLinks,
    effectivePublicLinkId,
    createPublicLinkMutation,
    updatePublicLinkMutation,
    regeneratePublicLinkShortCodeMutation,
    deletePublicLinkMutation,
    restorePublicLinkMutation,
    setSelectedTopicId,
    setNewPublicShortCode,
    setNewPublicMaxAttempts,
    setNewPublicTimeLimit,
    setNewPublicAllowResume,
    setNewPublicConsentVersion,
    setNewPublicConsentText,
    setSelectedPublicLinkId,
    setPendingDeletePublicLinkId,
    handleCreatePublicLink,
    handleSwitchPublicLinksTab,
    handleCopyShortLink,
    handleOpenShortLinkQr,
    handleTogglePublicLink,
    handleRegeneratePublicLinkShortCode,
    handleDeletePublicLink,
    handleRestorePublicLink,
  };
}
