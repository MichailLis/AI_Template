import { Trash2 } from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';

import type { TestTopicListItem } from '../model/types';

interface TestsSidebarTopicsListProps {
  filteredTopics: TestTopicListItem[];
  selectedTopicId: number | null;
  topicsLoading: boolean;
  topicsError: boolean;
  topicsErrorMessage?: string | null;
  isDeletingTopic: boolean;
  deletingTopicId: number | null;
  onSelectTest: (topicId: number) => void;
  onRequestDeleteTest: (topic: TestTopicListItem) => void;
  onRetryTopics: () => void;
}

export function TestsSidebarTopicsList({
  filteredTopics,
  selectedTopicId,
  topicsLoading,
  topicsError,
  topicsErrorMessage,
  isDeletingTopic,
  deletingTopicId,
  onSelectTest,
  onRequestDeleteTest,
  onRetryTopics,
}: TestsSidebarTopicsListProps) {
  return (
    <div className="space-y-2 border-t border-slate-200 pt-4">
      {topicsLoading ? <p className="text-sm text-slate-500">Загрузка тестов...</p> : null}
      {topicsError ? (
        <div className="space-y-2 rounded-md border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">
            {topicsErrorMessage ?? 'Не удалось загрузить тесты.'}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onRetryTopics}>
            Повторить
          </Button>
        </div>
      ) : null}

      {!topicsLoading && !topicsError && filteredTopics.length === 0 ? (
        <p className="text-sm text-slate-500">Ничего не найдено по текущему фильтру.</p>
      ) : null}

      {filteredTopics.map((topic) => (
        <div key={topic.id} className="relative">
          <Button
            variant={selectedTopicId === topic.id ? 'secondary' : 'outline'}
            className="h-auto w-full items-start justify-start whitespace-normal pr-10"
            onClick={() => onSelectTest(topic.id)}
          >
            <div className="min-w-0 w-full space-y-1 text-left">
              <p className="break-words text-sm font-semibold leading-snug">{topic.draftTitle}</p>
              <p className="break-all text-xs text-slate-500">{topic.slug}</p>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="outline">В работе v{topic.draftVersionNumber}</Badge>
                <Badge variant="outline">
                  {topic.publishedVersionNumber
                    ? `Опубликован v${topic.publishedVersionNumber}`
                    : 'Не опубликован'}
                </Badge>
              </div>
            </div>
          </Button>

          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="absolute right-1 top-1 h-7 w-7 text-slate-500 hover:text-red-600"
            onClick={() => onRequestDeleteTest(topic)}
            disabled={isDeletingTopic && deletingTopicId === topic.id}
            aria-label={`Удалить тест ${topic.draftTitle}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
