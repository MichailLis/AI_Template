import { ConfirmActionDialog, type TestTopicListItem } from '@/features/tests';

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
  pendingDeleteQuestion: PendingQuestion | null;
  isDeletingQuestion: boolean;
  onConfirmDeleteQuestion: () => void;
  onCloseDeleteQuestion: () => void;
  isPublishConfirmOpen: boolean;
  isPublishing: boolean;
  onConfirmPublish: () => void;
  onClosePublish: () => void;
}

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
  pendingDeleteQuestion,
  isDeletingQuestion,
  onConfirmDeleteQuestion,
  onCloseDeleteQuestion,
  isPublishConfirmOpen,
  isPublishing,
  onConfirmPublish,
  onClosePublish,
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
        description={
          pendingDeleteTopic
            ? `Тест "${pendingDeleteTopic.draftTitle}" будет удален вместе с черновиком и опубликованными версиями.`
            : 'Тест будет удален вместе с черновиком и опубликованными версиями.'
        }
        confirmLabel="Удалить тест"
        variant="destructive"
        isConfirming={isDeletingTopic}
        onConfirm={onConfirmDeleteTopic}
        onClose={onCloseDeleteTopic}
      />

      <ConfirmActionDialog
        open={Boolean(pendingDeleteQuestion)}
        title="Удалить вопрос?"
        description={
          pendingDeleteQuestion
            ? `Вопрос "${pendingDeleteQuestion.title}" будет удален из версии в работе.`
            : 'Вопрос будет удален из версии в работе.'
        }
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
    </>
  );
}
