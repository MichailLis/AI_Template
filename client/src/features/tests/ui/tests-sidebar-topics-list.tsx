import { Trash2 } from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { AdminStateBlock } from '@/shared/ui/admin-state-block';
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
        <AdminStateBlock className="min-h-0 p-4">
          Загрузка тестов... Пожалуйста, подождите.
        </AdminStateBlock>
      ) : null}
      {topicsError ? (
        <AdminStateBlock
          tone="danger"
          className="min-h-0 p-4"
          action={
            <Button type="button" size="sm" variant="outline" onClick={onRetryTopics}>
              Повторить
            </Button>
          }
        >
          <p className={`text-sm ${adminToneClassNames.danger.text}`}>
            {topicsErrorMessage ??
              'Не удалось загрузить тесты. Проверьте подключение и повторите попытку.'}
          </p>
        </AdminStateBlock>
      ) : null}

      {!topicsLoading && !topicsError && filteredTopics.length === 0 ? (
        <div className={adminClassNames.panel.empty}>
          Ничего не найдено. Измените фильтры или создайте новый тест.
        </div>
      ) : null}

      {filteredTopics.map((topic) => (
        <div key={topic.id} className="flex items-start gap-2">
          <Button
            variant={selectedTopicId === topic.id ? 'secondary' : 'outline'}
            className="h-auto min-w-0 flex-1 items-start justify-start whitespace-normal"
            onClick={() => onSelectTest(topic.id)}
          >
            <div className="min-w-0 w-full space-y-1 text-left">
              <p className="break-words text-sm font-semibold leading-snug">{topic.draftTitle}</p>
              <p className={`break-all text-xs ${adminClassNames.text.muted}`}>{topic.slug}</p>
              <div className="flex flex-wrap items-center gap-1">
                <Badge variant="outline" className={adminBadgeClassNames.info}>
                  В работе v{topic.draftVersionNumber}
                </Badge>
                <Badge
                  variant="outline"
                  className={
                    topic.publishedVersionNumber
                      ? adminBadgeClassNames.success
                      : adminBadgeClassNames.warning
                  }
                >
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
            className={`mt-1 h-7 w-7 shrink-0 ${adminClassNames.iconButton.danger}`}
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
