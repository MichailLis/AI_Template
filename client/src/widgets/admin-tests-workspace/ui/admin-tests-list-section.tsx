import { TestsListCard, TestsListHeader, type TestTopicListItem } from '@/features/tests';
import { Card } from '@/shared/ui/card';

import type { ListMode } from './use-admin-tests-workspace';

interface AdminTestsListSectionProps {
  topics: TestTopicListItem[];
  listMode: ListMode;
  topicsLoading: boolean;
  topicsError: boolean;
  topicsErrorMessage?: string | null;
  searchValue: string;
  isArchivingTopic: boolean;
  archivingTopicId: number | null;
  isRestoringTopic: boolean;
  restoringTopicId: number | null;
  isDeletingTopic: boolean;
  deletingTopicId: number | null;
  onSearchChange: (value: string) => void;
  onListModeChange: (mode: ListMode) => void;
  onOpenCreateModal: () => void;
  onOpenAiGenerator: () => void;
  onSelectTest: (topicId: number) => void;
  onOpenSettings: (topicId: number) => void;
  onRequestArchiveTest: (topic: TestTopicListItem) => void;
  onRequestRestoreTest: (topic: TestTopicListItem) => void;
  onRequestDeleteTest: (topic: TestTopicListItem) => void;
  onRetryTopics: () => void;
}

export function AdminTestsListSection({
  topics,
  listMode,
  topicsLoading,
  topicsError,
  topicsErrorMessage,
  searchValue,
  isArchivingTopic,
  archivingTopicId,
  isRestoringTopic,
  restoringTopicId,
  isDeletingTopic,
  deletingTopicId,
  onSearchChange,
  onListModeChange,
  onOpenCreateModal,
  onOpenAiGenerator,
  onSelectTest,
  onOpenSettings,
  onRequestArchiveTest,
  onRequestRestoreTest,
  onRequestDeleteTest,
  onRetryTopics,
}: AdminTestsListSectionProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <TestsListHeader
        searchValue={searchValue}
        listMode={listMode}
        onSearchChange={onSearchChange}
        onListModeChange={onListModeChange}
        onOpenCreateModal={onOpenCreateModal}
        onOpenAiGenerator={onOpenAiGenerator}
      />
      <TestsListCard
        topics={topics}
        listMode={listMode}
        topicsLoading={topicsLoading}
        topicsError={topicsError}
        topicsErrorMessage={topicsErrorMessage}
        searchValue={searchValue}
        isArchivingTopic={isArchivingTopic}
        archivingTopicId={archivingTopicId}
        isRestoringTopic={isRestoringTopic}
        restoringTopicId={restoringTopicId}
        isDeletingTopic={isDeletingTopic}
        deletingTopicId={deletingTopicId}
        onSelectTest={onSelectTest}
        onOpenSettings={onOpenSettings}
        onRequestArchiveTest={onRequestArchiveTest}
        onRequestRestoreTest={onRequestRestoreTest}
        onRequestDeleteTest={onRequestDeleteTest}
        onRetryTopics={onRetryTopics}
      />
    </Card>
  );
}
