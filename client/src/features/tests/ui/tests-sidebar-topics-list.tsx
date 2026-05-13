import { Trash2 } from 'lucide-react';

import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
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
    <div className={`space-y-2 pt-4 ${adminClassNames.border.top}`}>
      {topicsLoading ? (
        <p className={`text-sm ${adminClassNames.text.muted}`}>
          Загрузка тестов... Пожалуйста, подождите.
        </p>
      ) : null}
      {topicsError ? (
        <div className={`space-y-2 ${adminClassNames.panel.dangerInline}`}>
          <p className={`text-sm ${adminToneClassNames.danger.text}`}>
            {topicsErrorMessage ??
              'Не удалось загрузить тесты. Проверьте подключение и повторите попытку.'}
          </p>
          <Button type="button" size="sm" variant="outline" onClick={onRetryTopics}>
            Повторить
          </Button>
        </div>
      ) : null}

      {!topicsLoading && !topicsError && filteredTopics.length === 0 ? (
        <p className={`text-sm ${adminClassNames.text.muted}`}>
          Ничего не найдено. Измените фильтры или создайте новый тест.
        </p>
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
              <p className={`break-all text-xs ${adminClassNames.text.muted}`}>{topic.slug}</p>
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
            className={`absolute right-1 top-1 h-7 w-7 ${adminClassNames.iconButton.danger}`}
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
