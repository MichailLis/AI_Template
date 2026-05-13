import { useMemo, useState } from 'react';

import { adminBadgeClassNames, adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { CardContent } from '@/shared/ui/card';

import { TestsListItemActions } from './tests-list-card-actions';

import type { TestTopicListItem } from '../model/types';

interface TestsListCardProps {
  topics: TestTopicListItem[];
  listMode: 'active' | 'archived';
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
  onSelectTest: (topicId: number) => void;
  onOpenSettings: (topicId: number) => void;
  onRequestArchiveTest: (topic: TestTopicListItem) => void;
  onRequestRestoreTest: (topic: TestTopicListItem) => void;
  onRequestDeleteTest: (topic: TestTopicListItem) => void;
  onRetryTopics: () => void;
}

interface TestsListStateBlockProps {
  topicsLoading: boolean;
  topicsError: boolean;
  topicsErrorMessage?: string | null;
  searchValue: string;
  topicsEmpty: boolean;
  onRetryTopics: () => void;
}

function TestsListStateBlock({
  topicsLoading,
  topicsError,
  topicsErrorMessage,
  searchValue,
  topicsEmpty,
  onRetryTopics,
}: TestsListStateBlockProps) {
  const isSearchActive = Boolean(searchValue.trim());

  if (topicsLoading) {
    return <AdminStateBlock>Загрузка тестов... Пожалуйста, подождите.</AdminStateBlock>;
  }

  if (topicsError) {
    return (
      <AdminStateBlock
        tone="danger"
        action={
          <Button type="button" size="sm" variant="outline" onClick={onRetryTopics}>
            Повторить
          </Button>
        }
      >
        {topicsErrorMessage ??
          'Не удалось загрузить тесты. Проверьте подключение и повторите попытку.'}
      </AdminStateBlock>
    );
  }

  if (!topicsEmpty) {
    return null;
  }

  return (
    <AdminStateBlock>
      {isSearchActive
        ? 'По вашему запросу ничего не найдено.'
        : 'Нет тестов. Создайте первый тест.'}
    </AdminStateBlock>
  );
}

interface TestListRowProps {
  topic: TestTopicListItem;
  listMode: 'active' | 'archived';
  isArchivingTopic: boolean;
  archivingTopicId: number | null;
  isRestoringTopic: boolean;
  restoringTopicId: number | null;
  isDeletingTopic: boolean;
  deletingTopicId: number | null;
  pendingPermanentDeleteTopicId: number | null;
  onSelectTest: (topicId: number) => void;
  onOpenSettings: (topicId: number) => void;
  onRequestArchiveTest: (topic: TestTopicListItem) => void;
  onRequestRestoreTest: (topic: TestTopicListItem) => void;
  onRequestDeleteTest: (topic: TestTopicListItem) => void;
  onSetPendingDelete: (topicId: number) => void;
}

const formatTopicUpdatedAt = (value: string) =>
  new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const getPublishLabel = (topic: TestTopicListItem) => {
  if (topic.publishedVersionNumber) {
    return `Опубликован v${topic.publishedVersionNumber}`;
  }

  return 'Только черновик';
};

function TestsListItemRow({
  topic,
  listMode,
  isArchivingTopic,
  archivingTopicId,
  isRestoringTopic,
  restoringTopicId,
  isDeletingTopic,
  deletingTopicId,
  pendingPermanentDeleteTopicId,
  onSelectTest,
  onOpenSettings,
  onRequestArchiveTest,
  onRequestRestoreTest,
  onRequestDeleteTest,
  onSetPendingDelete,
}: TestListRowProps) {
  return (
    <div className={`${adminClassNames.panel.listRow} flex items-start gap-3`}>
      <button
        type="button"
        onClick={() => onSelectTest(topic.id)}
        className="group min-w-0 flex-1 text-left"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p
            className={`min-w-0 truncate text-sm font-semibold ${adminClassNames.text.heading} group-hover:underline`}
          >
            {topic.draftTitle}
          </p>
          <Badge
            variant="outline"
            className={
              topic.publishedVersionNumber
                ? adminBadgeClassNames.success
                : adminBadgeClassNames.warning
            }
          >
            {getPublishLabel(topic)}
          </Badge>
        </div>
        <div
          className={`mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-xs ${adminClassNames.text.body}`}
        >
          <span>Черновик v{topic.draftVersionNumber}</span>
          <span>{topic.draftQuestionCount} вопросов</span>
          <span>Обновлен {formatTopicUpdatedAt(topic.updatedAt)}</span>
        </div>
      </button>

      <TestsListItemActions
        topic={topic}
        listMode={listMode}
        isArchivingTopic={isArchivingTopic}
        archivingTopicId={archivingTopicId}
        isRestoringTopic={isRestoringTopic}
        restoringTopicId={restoringTopicId}
        isDeletingTopic={isDeletingTopic}
        deletingTopicId={deletingTopicId}
        pendingPermanentDeleteTopicId={pendingPermanentDeleteTopicId}
        onSelectTest={onSelectTest}
        onOpenSettings={onOpenSettings}
        onRequestArchiveTest={onRequestArchiveTest}
        onRequestRestoreTest={onRequestRestoreTest}
        onRequestDeleteTest={onRequestDeleteTest}
        onSetPendingDelete={onSetPendingDelete}
      />
    </div>
  );
}

const getFilteredTopics = (topics: TestTopicListItem[], searchValue: string) => {
  const query = searchValue.trim().toLowerCase();
  if (!query) {
    return topics;
  }

  return topics.filter((topic) => topic.draftTitle.toLowerCase().includes(query));
};

export function TestsListCard({
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
  onSelectTest,
  onOpenSettings,
  onRequestArchiveTest,
  onRequestRestoreTest,
  onRequestDeleteTest,
  onRetryTopics,
}: TestsListCardProps) {
  const [pendingPermanentDeleteTopicId, setPendingPermanentDeleteTopicId] = useState<number | null>(
    null,
  );

  const filteredTopics = useMemo(
    () => getFilteredTopics(topics, searchValue),
    [searchValue, topics],
  );

  if (topicsLoading || topicsError || filteredTopics.length === 0) {
    return (
      <CardContent className="p-0">
        <TestsListStateBlock
          topicsLoading={topicsLoading}
          topicsError={topicsError}
          topicsErrorMessage={topicsErrorMessage}
          searchValue={searchValue}
          topicsEmpty={filteredTopics.length === 0}
          onRetryTopics={onRetryTopics}
        />
      </CardContent>
    );
  }

  return (
    <CardContent className="p-0">
      {filteredTopics.map((topic) => (
        <TestsListItemRow
          key={topic.id}
          topic={topic}
          listMode={listMode}
          isArchivingTopic={isArchivingTopic}
          archivingTopicId={archivingTopicId}
          isRestoringTopic={isRestoringTopic}
          restoringTopicId={restoringTopicId}
          isDeletingTopic={isDeletingTopic}
          deletingTopicId={deletingTopicId}
          pendingPermanentDeleteTopicId={pendingPermanentDeleteTopicId}
          onSelectTest={onSelectTest}
          onOpenSettings={onOpenSettings}
          onRequestArchiveTest={(topicToArchive) => {
            setPendingPermanentDeleteTopicId(null);
            onRequestArchiveTest(topicToArchive);
          }}
          onRequestRestoreTest={(topicToRestore) => {
            setPendingPermanentDeleteTopicId(null);
            onRequestRestoreTest(topicToRestore);
          }}
          onRequestDeleteTest={(topicToDelete) => {
            setPendingPermanentDeleteTopicId(null);
            onRequestDeleteTest(topicToDelete);
          }}
          onSetPendingDelete={setPendingPermanentDeleteTopicId}
        />
      ))}
    </CardContent>
  );
}
