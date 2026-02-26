import { Archive, MoreHorizontal, RotateCcw, Settings, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/shared/ui/button';
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

  const filteredTopics = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) {
      return topics;
    }

    return topics.filter((topic) => {
      return topic.draftTitle.toLowerCase().includes(query);
    });
  }, [searchValue, topics]);

  return (
    <div className="rounded-md border border-slate-200 bg-white shadow-sm">
      {topicsLoading ? (
        <div className="p-8 text-center text-sm text-slate-500">
          Загрузка тестов... Пожалуйста, подождите.
        </div>
      ) : null}

      {topicsError ? (
        <div className="space-y-2 rounded-md border-t border-red-200 bg-red-50 p-6">
          <p className="text-sm text-red-700">
            {topicsErrorMessage ??
              'Не удалось загрузить тесты. Проверьте подключение и повторите попытку.'}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onRetryTopics}>
            Повторить
          </Button>
        </div>
      ) : null}

      {!topicsLoading && !topicsError && filteredTopics.length === 0 ? (
        <div className="p-8 text-center text-sm text-slate-500">
          {searchValue.trim()
            ? 'По вашему запросу ничего не найдено.'
            : 'Нет тестов. Создайте первый тест.'}
        </div>
      ) : null}

      {filteredTopics.map((topic) => (
        <div
          key={topic.id}
          className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-b-0 hover:bg-slate-50 transition-colors"
        >
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
                    disabled={isArchivingTopic && archivingTopicId === topic.id}
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
                      disabled={isRestoringTopic && restoringTopicId === topic.id}
                    >
                      <RotateCcw className="mr-2 h-3.5 w-3.5" />
                      Восстановить
                    </Button>
                    {pendingPermanentDeleteTopicId === topic.id ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 justify-start px-2 text-left text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => {
                          setPendingPermanentDeleteTopicId(null);
                          onRequestDeleteTest(topic);
                        }}
                        disabled={isDeletingTopic && deletingTopicId === topic.id}
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
                        onClick={() => setPendingPermanentDeleteTopicId(topic.id)}
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
      ))}
    </div>
  );
}
