import { useAnalysisPromptsControllerGetPromptHistory } from '@/shared/api/generated/admin/admin';
import { AuditHistoryList } from '@/shared/ui/audit-history-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface PromptHistoryDialogProps {
  prompt: { id: number; title: string } | null;
  onClose: () => void;
}

function PromptHistoryEvents({ promptId }: { promptId: number }) {
  const historyQuery = useAnalysisPromptsControllerGetPromptHistory(promptId);

  return (
    <AuditHistoryList
      events={historyQuery.data?.events}
      isLoading={historyQuery.isLoading}
      isError={historyQuery.isError}
    />
  );
}

/** История промпта: кто создал версию, поменял модель, опубликовал или удалил промпт. */
export function PromptHistoryDialog({ prompt, onClose }: PromptHistoryDialogProps) {
  return (
    <Dialog
      open={prompt !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="admin-surface max-h-[85vh] max-w-lg overflow-y-auto border-admin-border">
        <DialogHeader>
          <DialogTitle>История промпта</DialogTitle>
          <DialogDescription>{prompt?.title}</DialogDescription>
        </DialogHeader>
        {prompt ? <PromptHistoryEvents promptId={prompt.id} /> : null}
      </DialogContent>
    </Dialog>
  );
}
