import { Archive, MoreHorizontal, RotateCcw, Settings, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { AdminStateBlock } from '@/shared/ui/admin-state-block';
import { Button } from '@/shared/ui/button';
import { CardContent } from '@/shared/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

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
  const isDeleteConfirming = pendingPermanentDeleteTopicId === topic.id;
  const isArchiveBusy = isArchivingTopic && archivingTopicId === topic.id;
  const isRestoreBusy = isRestoringTopic && restoringTopicId === topic.id;
  const isDeleteBusy = isDeletingTopic && deletingTopicId === topic.id;

  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50 transition-colors">
      <button type="button" onClick={() => onSelectTest(topic.id)} className="flex-1 text-left">
        <p className="text-sm font-medium text-slate-900">{topic.draftTitle}</p>
      </button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-slate-500 hover:text-slate-900"
            aria-label="Действия"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="end">
          <div className="flex flex-col">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 justify-start px-2 text-left text-sm"
              onClick={() => onSelectTest(topic.id)}
            >
              Открыть
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 justify-start px-2 text-left text-sm"
              onClick={() => onOpenSettings(topic.id)}
            >
              <Settings className="mr-2 h-3.5 w-3.5" />
              Настройки
            </Button>
            {listMode === 'active' ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 justify-start px-2 text-left text-sm"
                onClick={() => onRequestArchiveTest(topic)}
                disabled={isArchiveBusy}
              >
                <Archive className="mr-2 h-3.5 w-3.5" />
                Архивировать
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 justify-start px-2 text-left text-sm"
                  onClick={() => onRequestRestoreTest(topic)}
                  disabled={isRestoreBusy}
                >
                  <RotateCcw className="mr-2 h-3.5 w-3.5" />
                  Восстановить
                </Button>
                {isDeleteConfirming ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 justify-start px-2 text-left text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onRequestDeleteTest(topic)}
                    disabled={isDeleteBusy}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Подтвердить удаление
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 justify-start px-2 text-left text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => onSetPendingDelete(topic.id)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Удалить навсегда...
                  </Button>
                )}
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>
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
