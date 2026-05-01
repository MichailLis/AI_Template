import { type TestTopicListItem } from '@/features/tests';
import { ConfirmActionDialog } from '@/shared/ui/confirm-action-dialog';

interface PendingQuestion {
  title: string;
}

interface AdminTestsConfirmDialogsProps {
  isSwitchConfirmOpen: boolean;
  onConfirmTopicSwitch: () => void;
  onCloseTopicSwitch: () => void;
  isDiscardQuestionConfirmOpen: boolean;
  onConfirmDiscardQuestion: () => void;
  onCloseDiscardQuestion: () => void;
  pendingDeleteTopic: TestTopicListItem | null;
  isDeletingTopic: boolean;
  onConfirmDeleteTopic: () => void;
  onCloseDeleteTopic: () => void;
  pendingArchiveTopic: TestTopicListItem | null;
  isArchivingTopic: boolean;
  onConfirmArchiveTopic: () => void;
  onCloseArchiveTopic: () => void;
  pendingRestoreTopic: TestTopicListItem | null;
  isRestoringTopic: boolean;
  onConfirmRestoreTopic: () => void;
  onCloseRestoreTopic: () => void;
  pendingDeleteQuestion: PendingQuestion | null;
  isDeletingQuestion: boolean;
  onConfirmDeleteQuestion: () => void;
  onCloseDeleteQuestion: () => void;
  isPublishConfirmOpen: boolean;
  isPublishing: boolean;
  onConfirmPublish: () => void;
  onClosePublish: () => void;
  isNavigationConfirmOpen: boolean;
  onConfirmNavigationLeave: () => void;
  onConfirmNavigationStay: () => void;
}

const getDeleteTopicDescription = (topic: TestTopicListItem | null) =>
  topic
    ? `Тест "${topic.draftTitle}" будет удален вместе с черновиком и опубликованными версиями.`
    : 'Тест будет удален вместе с черновиком и опубликованными версиями.';

const getArchiveTopicDescription = (topic: TestTopicListItem | null) =>
  topic
    ? `Тест "${topic.draftTitle}" будет скрыт из активного списка и станет доступен во вкладке "Архив".`
    : 'Тест будет перемещен в архив.';

const getRestoreTopicDescription = (topic: TestTopicListItem | null) =>
  topic
    ? `Тест "${topic.draftTitle}" снова появится во вкладке "Активные".`
    : 'Тест будет восстановлен в активный список.';

const getDeleteQuestionDescription = (question: PendingQuestion | null) =>
  question
    ? `Вопрос "${question.title}" будет удален из версии в работе.`
    : 'Вопрос будет удален из версии в работе.';

export function AdminTestsConfirmDialogs({
  isSwitchConfirmOpen,
  onConfirmTopicSwitch,
  onCloseTopicSwitch,
  isDiscardQuestionConfirmOpen,
  onConfirmDiscardQuestion,
  onCloseDiscardQuestion,
  pendingDeleteTopic,
  isDeletingTopic,
  onConfirmDeleteTopic,
  onCloseDeleteTopic,
  pendingArchiveTopic,
  isArchivingTopic,
  onConfirmArchiveTopic,
  onCloseArchiveTopic,
  pendingRestoreTopic,
  isRestoringTopic,
  onConfirmRestoreTopic,
  onCloseRestoreTopic,
  pendingDeleteQuestion,
  isDeletingQuestion,
  onConfirmDeleteQuestion,
  onCloseDeleteQuestion,
  isPublishConfirmOpen,
  isPublishing,
  onConfirmPublish,
  onClosePublish,
  isNavigationConfirmOpen,
  onConfirmNavigationLeave,
  onConfirmNavigationStay,
}: AdminTestsConfirmDialogsProps) {
  return (
    <>
      <ConfirmActionDialog
        open={isSwitchConfirmOpen}
        title="Переключить тест без сохранения?"
        description="У текущего теста есть несохраненные изменения. Они будут потеряны при переключении."
        confirmLabel="Переключить без сохранения"
        variant="destructive"
        onConfirm={onConfirmTopicSwitch}
        onClose={onCloseTopicSwitch}
      />

      <ConfirmActionDialog
        open={isDiscardQuestionConfirmOpen}
        title="Закрыть редактор вопроса?"
        description="Есть несохраненные изменения в вопросе. Они будут потеряны."
        confirmLabel="Закрыть без сохранения"
        variant="destructive"
        onConfirm={onConfirmDiscardQuestion}
        onClose={onCloseDiscardQuestion}
      />

      <ConfirmActionDialog
        open={Boolean(pendingDeleteTopic)}
        title="Удалить тест?"
        description={getDeleteTopicDescription(pendingDeleteTopic)}
        confirmLabel="Удалить тест"
        variant="destructive"
        isConfirming={isDeletingTopic}
        onConfirm={onConfirmDeleteTopic}
        onClose={onCloseDeleteTopic}
      />

      <ConfirmActionDialog
        open={Boolean(pendingArchiveTopic)}
        title="Архивировать тест?"
        description={getArchiveTopicDescription(pendingArchiveTopic)}
        confirmLabel="Архивировать"
        isConfirming={isArchivingTopic}
        onConfirm={onConfirmArchiveTopic}
        onClose={onCloseArchiveTopic}
      />

      <ConfirmActionDialog
        open={Boolean(pendingRestoreTopic)}
        title="Восстановить тест из архива?"
        description={getRestoreTopicDescription(pendingRestoreTopic)}
        confirmLabel="Восстановить"
        isConfirming={isRestoringTopic}
        onConfirm={onConfirmRestoreTopic}
        onClose={onCloseRestoreTopic}
      />

      <ConfirmActionDialog
        open={Boolean(pendingDeleteQuestion)}
        title="Удалить вопрос?"
        description={getDeleteQuestionDescription(pendingDeleteQuestion)}
        confirmLabel="Удалить вопрос"
        variant="destructive"
        isConfirming={isDeletingQuestion}
        onConfirm={onConfirmDeleteQuestion}
        onClose={onCloseDeleteQuestion}
      />

      <ConfirmActionDialog
        open={isPublishConfirmOpen}
        title="Опубликовать текущую версию теста?"
        description="Текущая версия в работе станет опубликованной. После публикации будет создана новая версия в работе для дальнейших изменений."
        confirmLabel="Опубликовать"
        isConfirming={isPublishing}
        onConfirm={onConfirmPublish}
        onClose={onClosePublish}
      />

      <ConfirmActionDialog
        open={isNavigationConfirmOpen}
        title="Уйти без сохранения?"
        description="У текущего теста есть несохраненные изменения. Они будут потеряны при переходе."
        confirmLabel="Уйти"
        cancelLabel="Остаться"
        variant="destructive"
        onConfirm={onConfirmNavigationLeave}
        onClose={onConfirmNavigationStay}
      />
    </>
  );
}
