import { useState } from 'react';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';
import type { PublicLinkListItem } from './public-links-list-card.helpers';

/** List-level UI state: what the operator is looking at, not what they are creating. */
export function useAdminPublicLinksSelectionState() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [pendingDeletePublicLinkId, setPendingDeletePublicLinkId] = useState<number | null>(null);
  // Хранится вся ссылка, а не id: диалог подтверждения называет её код и номер новой версии.
  const [pendingMovePublicLink, setPendingMovePublicLink] = useState<PublicLinkListItem | null>(
    null,
  );
  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');
  const [publicLinksSearch, setPublicLinksSearch] = useState('');

  return {
    selectedTopicId,
    setSelectedTopicId,
    selectedPublicLinkId,
    setSelectedPublicLinkId,
    pendingDeletePublicLinkId,
    setPendingDeletePublicLinkId,
    pendingMovePublicLink,
    setPendingMovePublicLink,
    publicLinksTab,
    setPublicLinksTab,
    publicLinksSearch,
    setPublicLinksSearch,
  };
}
