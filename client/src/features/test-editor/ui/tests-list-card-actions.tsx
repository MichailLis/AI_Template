import { Archive, MoreHorizontal, RotateCcw, Settings, Trash2 } from 'lucide-react';

import { pluralizeRu } from '@/shared/lib/ru-plural';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';

import type { TestTopicListItem } from '../model/types';

interface TestsListItemActionsProps {
  topic: TestTopicListItem;
  listMode: 'active' | 'archived';
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
}

/**
 * Почему тест нельзя удалить навсегда. Сервер удаляет только тест без опубликованной версии, ссылок
 * и прохождений; раньше это выяснялось только после двух подтверждений и ошибки сервера.
 */
const getTopicDeleteBlockReason = (topic: TestTopicListItem) => {
  if (topic.canDelete) {
    return null;
  }

  const reasons = [
    topic.hasPublishedVersion ? 'опубликован' : null,
    topic.publicLinkCount > 0
      ? `${topic.publicLinkCount} ${pluralizeRu(topic.publicLinkCount, ['ссылка', 'ссылки', 'ссылок'])}`
      : null,
    topic.attemptCount > 0
      ? `${topic.attemptCount} ${pluralizeRu(topic.attemptCount, ['прохождение', 'прохождения', 'прохождений'])}`
      : null,
  ].filter((reason): reason is string => reason !== null);

  return `Нельзя удалить: ${reasons.length > 0 ? reasons.join(', ') : 'тест уже используется'}. Тест можно только держать в архиве.`;
};

export function TestsListItemActions({
  topic,
  listMode,
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
}: TestsListItemActionsProps) {
  const deleteBlockReason = getTopicDeleteBlockReason(topic);
  const isArchiveBusy = isArchivingTopic && archivingTopicId === topic.id;
  const isRestoreBusy = isRestoringTopic && restoringTopicId === topic.id;
  const isDeleteBusy = isDeletingTopic && deletingTopicId === topic.id;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={`h-8 w-8 ${adminClassNames.iconButton.muted}`}
          aria-label="Действия"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`${listMode === 'archived' ? 'w-64' : 'w-44'} p-1`} align="end">
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
              {/* Одно подтверждение — диалог; промежуточного пункта «Подтвердить удаление» больше нет. */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={adminClassNames.actionMenu.dangerItem}
                onClick={() => onRequestDeleteTest(topic)}
                disabled={deleteBlockReason !== null || isDeleteBusy}
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Удалить навсегда
              </Button>
              {deleteBlockReason ? (
                <p className={`px-2 pb-1 text-xs ${adminClassNames.text.muted}`}>
                  {deleteBlockReason}
                </p>
              ) : null}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
