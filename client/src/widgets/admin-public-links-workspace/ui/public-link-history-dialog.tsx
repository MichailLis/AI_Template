import { useTestsAdminPublicLinksControllerGetPublicLinkHistory } from '@/shared/api/generated/tests/tests';
import { AuditHistoryList } from '@/shared/ui/audit-history-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

interface PublicLinkHistoryDialogProps {
  link: { id: number; shortCode: string } | null;
  onClose: () => void;
}

function PublicLinkHistoryEvents({ linkId }: { linkId: number }) {
  const historyQuery = useTestsAdminPublicLinksControllerGetPublicLinkHistory(linkId);

  return (
    <AuditHistoryList
      events={historyQuery.data?.events}
      isLoading={historyQuery.isLoading}
      isError={historyQuery.isError}
    />
  );
}

/** История ссылки: кто создал, отключил, поменял согласие, перевыпустил код или перевел версию. */
export function PublicLinkHistoryDialog({ link, onClose }: PublicLinkHistoryDialogProps) {
  return (
    <Dialog
      open={link !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="admin-surface max-h-[85vh] max-w-lg overflow-y-auto border-admin-border">
        <DialogHeader>
          <DialogTitle>История ссылки</DialogTitle>
          <DialogDescription>{link?.shortCode}</DialogDescription>
        </DialogHeader>
        {link ? <PublicLinkHistoryEvents linkId={link.id} /> : null}
      </DialogContent>
    </Dialog>
  );
}
