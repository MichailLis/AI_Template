import {
  formatAuditChange,
  getAuditActionLabel,
  getAuditActorLabel,
} from '@/shared/lib/audit-history-labels';
import { formatDateTime } from '@/shared/lib/date-format';

import { adminClassNames } from './admin-design-tokens';
import { AdminStateBlock } from './admin-state-block';

import type { AuditHistoryResponseDtoEventsItem } from '@/shared/api/model';

interface AuditHistoryListProps {
  events: AuditHistoryResponseDtoEventsItem[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

/** История изменений одной сущности: кто, что, когда, было → стало. Данные передает вызывающий. */
export function AuditHistoryList({ events, isLoading, isError }: AuditHistoryListProps) {
  if (isLoading) {
    return <AdminStateBlock>Загружаем историю изменений…</AdminStateBlock>;
  }

  if (isError) {
    return <AdminStateBlock tone="danger">Не удалось загрузить историю изменений.</AdminStateBlock>;
  }

  if (!events || events.length === 0) {
    return <AdminStateBlock>Изменений пока нет.</AdminStateBlock>;
  }

  return (
    <ol className="flex flex-col gap-3">
      {events.map((event) => (
        <li key={event.id} className={adminClassNames.panel.compactSection}>
          <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>
            {getAuditActionLabel(event.action)}
          </p>
          <p className={`mt-0.5 text-xs ${adminClassNames.text.muted}`}>
            {`${formatDateTime(event.createdAt)} · ${getAuditActorLabel(event.actor)}`}
          </p>
          {event.changes.length > 0 ? (
            <ul className={`mt-2 flex flex-col gap-1 text-sm ${adminClassNames.text.body}`}>
              {event.changes.map((change) => (
                <li key={change.field}>{formatAuditChange(change)}</li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
