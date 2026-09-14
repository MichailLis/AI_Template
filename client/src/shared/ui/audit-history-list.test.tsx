import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { formatDateTime } from '@/shared/lib/date-format';

import { AuditHistoryList } from './audit-history-list';

import type { AuditHistoryResponseDtoEventsItem } from '@/shared/api/model';

const events: AuditHistoryResponseDtoEventsItem[] = [
  {
    id: 3,
    action: 'USER_ROLE_CHANGED',
    actor: { id: 1, email: 'admin@admin.admin', name: null },
    changes: [{ field: 'role', before: 'USER', after: 'ADMIN' }],
    createdAt: '2026-09-13T10:00:00.000Z',
  },
  {
    id: 2,
    action: 'USER_PASSWORD_RESET',
    actor: null,
    changes: [],
    createdAt: '2026-09-12T09:00:00.000Z',
  },
];

/** Находка аудита FLOW-06: у карточек пользователя, промпта и ссылки не было истории изменений. */
describe('AuditHistoryList', () => {
  afterEach(cleanup);

  it('lists who did what and when, with the changed values', () => {
    render(<AuditHistoryList events={events} isLoading={false} isError={false} />);

    expect(screen.getByText('Изменена роль')).toBeInTheDocument();
    expect(screen.getByText('Роль: Пользователь → Администратор')).toBeInTheDocument();
    expect(screen.getByText(/admin@admin\.admin/)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(formatDateTime('2026-09-13T10:00:00.000Z'))),
    ).toBeInTheDocument();
    expect(screen.getByText('Сброшен пароль')).toBeInTheDocument();
    expect(screen.getByText(/Автор неизвестен/)).toBeInTheDocument();
  });

  it('says that there are no changes yet', () => {
    render(<AuditHistoryList events={[]} isLoading={false} isError={false} />);

    expect(screen.getByText('Изменений пока нет.')).toBeInTheDocument();
  });

  it('reports a failed history load', () => {
    render(<AuditHistoryList events={undefined} isLoading={false} isError />);

    expect(screen.getByText('Не удалось загрузить историю изменений.')).toBeInTheDocument();
  });

  it('shows that the history is loading', () => {
    render(<AuditHistoryList events={undefined} isLoading isError={false} />);

    expect(screen.getByText('Загружаем историю изменений…')).toBeInTheDocument();
  });
});
