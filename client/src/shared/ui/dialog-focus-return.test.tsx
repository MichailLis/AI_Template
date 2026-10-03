import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogTitle,
} from './alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from './sheet';

/** Окна открываются из состояния, без Trigger — как во всей админке. */
function Harness({ kind }: { kind: 'dialog' | 'sheet' | 'alert' }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Открыть
      </button>
      {kind === 'dialog' ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogTitle>Окно</DialogTitle>
            <DialogDescription>Описание</DialogDescription>
          </DialogContent>
        </Dialog>
      ) : null}
      {kind === 'sheet' ? (
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent>
            <SheetTitle>Панель</SheetTitle>
            <SheetDescription>Описание</SheetDescription>
          </SheetContent>
        </Sheet>
      ) : null}
      {kind === 'alert' ? (
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogContent>
            <AlertDialogTitle>Подтверждение</AlertDialogTitle>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  );
}

/**
 * Находка аудита D02: после закрытия окна без Trigger фокус падал на body, и следующий Tab
 * начинал обход страницы сначала.
 */
describe('focus return after closing a modal', () => {
  afterEach(cleanup);

  it.each(['dialog', 'sheet', 'alert'] as const)(
    'returns focus to the opener of a %s on Escape',
    async (kind) => {
      const user = userEvent.setup();
      render(<Harness kind={kind} />);

      const opener = screen.getByRole('button', { name: 'Открыть' });
      await user.click(opener);
      expect(opener).not.toHaveFocus();

      await user.keyboard('{Escape}');

      await vi.waitFor(() => expect(opener).toHaveFocus());
    },
  );
});

/** Окно, открытое пунктом меню «…»: пункт к закрытию окна снят, и фокус должен вернуться на «…». */
function MenuHarness() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger asChild>
          <button type="button">Действия</button>
        </PopoverTrigger>
        <PopoverContent>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setDialogOpen(true);
            }}
          >
            Изменить
          </button>
        </PopoverContent>
      </Popover>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogTitle>Окно</DialogTitle>
          <DialogDescription>Описание</DialogDescription>
        </DialogContent>
      </Dialog>
    </>
  );
}

describe('focus return after a dialog opened from a menu item', () => {
  afterEach(cleanup);

  it('returns focus to the menu trigger when the menu item is gone', async () => {
    const user = userEvent.setup();
    render(<MenuHarness />);

    const trigger = screen.getByRole('button', { name: 'Действия' });
    await user.click(trigger);
    await user.click(await screen.findByRole('button', { name: 'Изменить' }));
    await screen.findByRole('dialog');

    await user.keyboard('{Escape}');

    await vi.waitFor(() => expect(trigger).toHaveFocus());
  });
});
