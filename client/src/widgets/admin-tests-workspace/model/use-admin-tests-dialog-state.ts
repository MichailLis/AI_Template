import { useState } from 'react';

import type { TestTopicListItem } from '@/features/test-editor';

export function useAdminTestsDialogState() {
  const [testSearch, setTestSearch] = useState('');
  const [isAiGeneratorOpen, setIsAiGeneratorOpen] = useState(false);
  const [isImportConfirmOpen, setIsImportConfirmOpen] = useState(false);

  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [pendingDeleteTopic, setPendingDeleteTopic] = useState<TestTopicListItem | null>(null);

  const [pendingTopicSwitchId, setPendingTopicSwitchId] = useState<number | null>(null);
  const [isSwitchConfirmOpen, setIsSwitchConfirmOpen] = useState(false);

  const [isNavigationConfirmOpen, setIsNavigationConfirmOpen] = useState(false);
  const [pendingNavigationPath, setPendingNavigationPath] = useState<string | null>(null);

  const [pendingArchiveTopic, setPendingArchiveTopic] = useState<TestTopicListItem | null>(null);
  const [pendingRestoreTopic, setPendingRestoreTopic] = useState<TestTopicListItem | null>(null);

  return {
    testSearch,
    setTestSearch,
    isAiGeneratorOpen,
    setIsAiGeneratorOpen,
    isImportConfirmOpen,
    setIsImportConfirmOpen,
    isPublishConfirmOpen,
    setIsPublishConfirmOpen,
    pendingDeleteTopic,
    setPendingDeleteTopic,
    pendingTopicSwitchId,
    setPendingTopicSwitchId,
    isSwitchConfirmOpen,
    setIsSwitchConfirmOpen,
    isNavigationConfirmOpen,
    setIsNavigationConfirmOpen,
    pendingNavigationPath,
    setPendingNavigationPath,
    pendingArchiveTopic,
    setPendingArchiveTopic,
    pendingRestoreTopic,
    setPendingRestoreTopic,
  };
}
