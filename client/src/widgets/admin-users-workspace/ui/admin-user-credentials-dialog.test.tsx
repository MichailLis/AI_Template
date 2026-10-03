import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdminUserCredentialsDialog } from './admin-user-credentials-dialog';

import type { IssuedCredentials } from './admin-users-workspace.types';

const credentials: IssuedCredentials = {
  email: 'new@example.com',
  password: 'secret-123',
  reason: 'created',
};

/** Окно с паролем открывается после того, как форма создания уже закрылась и пропала. */
function Harness({ withRow }: { withRow: boolean }) {
  const [issued, setIssued] = useState<IssuedCredentials | null>(null);
  const [formOpen, setFormOpen] = useState(true);

  return (
    <>
      <button type="button">Добавить пользователя</button>
      {withRow ? (
        <button type="button" aria-label={`Действия для ${credentials.email}`}>
          …
        </button>
      ) : null}
      {formOpen ? (
        <button
          type="button"
          onClick={() => {
            setFormOpen(false);
            setIssued(credentials);
          }}
        >
          Создать пользователя
        </button>
      ) : null}
      <AdminUserCredentialsDialog credentials={issued} onClose={() => setIssued(null)} />
    </>
  );
}

const openAndClose = async () => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Создать пользователя' }));
  await screen.findByRole('dialog');
  await user.click(screen.getByRole('button', { name: 'Готово' }));
};

/** Задача ait-9os: после окна с одноразовым паролем фокус падал на body. */
describe('AdminUserCredentialsDialog focus on close', () => {
  afterEach(cleanup);

  it("returns focus to the new user's actions button", async () => {
    render(<Harness withRow />);
    await openAndClose();

    await vi.waitFor(() =>
      expect(
        screen.getByRole('button', { name: `Действия для ${credentials.email}` }),
      ).toHaveFocus(),
    );
  });

  it('falls back to "Добавить пользователя" when the row is not on the page', async () => {
    render(<Harness withRow={false} />);
    await openAndClose();

    await vi.waitFor(() =>
      expect(screen.getByRole('button', { name: 'Добавить пользователя' })).toHaveFocus(),
    );
  });
});
