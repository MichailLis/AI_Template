import { Archive, MoreHorizontal, RotateCcw, Settings, Trash2 } from 'lucide-react';

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
  pendingPermanentDeleteTopicId: number | null;
  onSelectTest: (topicId: number) => void;
  onOpenSettings: (topicId: number) => void;
  onRequestArchiveTest: (topic: TestTopicListItem) => void;
  onRequestRestoreTest: (topic: TestTopicListItem) => void;
  onRequestDeleteTest: (topic: TestTopicListItem) => void;
  onSetPendingDelete: (topicId: number) => void;
}

export function TestsListItemActions({
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
}: TestsListItemActionsProps) {
  const isDeleteConfirming = pendingPermanentDeleteTopicId === topic.id;
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
                  className={adminClassNames.actionMenu.dangerItem}
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
                  className={adminClassNames.actionMenu.dangerItem}
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
  );
}
