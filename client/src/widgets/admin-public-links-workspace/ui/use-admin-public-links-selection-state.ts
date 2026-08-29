import { useState } from 'react';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';

/** List-level UI state: what the operator is looking at, not what they are creating. */
export function useAdminPublicLinksSelectionState() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [pendingDeletePublicLinkId, setPendingDeletePublicLinkId] = useState<number | null>(null);
  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');
  const [publicLinksSearch, setPublicLinksSearch] = useState('');

  return {
    selectedTopicId,
    setSelectedTopicId,
    selectedPublicLinkId,
    setSelectedPublicLinkId,
    pendingDeletePublicLinkId,
    setPendingDeletePublicLinkId,
    publicLinksTab,
    setPublicLinksTab,
    publicLinksSearch,
    setPublicLinksSearch,
  };
}
