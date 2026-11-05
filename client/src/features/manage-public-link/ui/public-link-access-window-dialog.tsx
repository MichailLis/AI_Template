import { useState } from 'react';

import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { toAccessWindowValues, validateAccessWindow } from '../lib/access-window';
import { useSavePublicLinkAccessWindow } from '../model/use-public-link-access-window';

import { PublicLinkAccessWindowFields } from './public-link-access-window-fields';

import type {
  AccessWindowField,
  AccessWindowRange,
  AccessWindowValues,
} from '../lib/access-window';

export interface PublicLinkAccessWindowTarget extends AccessWindowRange {
  id: number;
  shortCode: string;
}

interface PublicLinkAccessWindowDialogProps {
  link: PublicLinkAccessWindowTarget | null;
  onClose: () => void;
}

/** Форма живет, пока открыт диалог: начальные значения берутся из ссылки при монтировании. */
function PublicLinkAccessWindowForm({
  link,
  onClose,
}: {
  link: PublicLinkAccessWindowTarget;
  onClose: () => void;
}) {
  const [values, setValues] = useState<AccessWindowValues>(() => toAccessWindowValues(link));
  const [isDraftValid, setIsDraftValid] = useState(true);
  const { savePublicLinkAccessWindow, isSavingAccessWindow } = useSavePublicLinkAccessWindow();
  const canSave = isDraftValid && validateAccessWindow(values) === null && !isSavingAccessWindow;

  const handleFieldChange = (field: AccessWindowField, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Окно доступа</DialogTitle>
        <DialogDescription>Ссылка {link.shortCode}</DialogDescription>
      </DialogHeader>

      <PublicLinkAccessWindowFields
        values={values}
        onChange={handleFieldChange}
        onDraftValidityChange={setIsDraftValid}
      />

      <DialogFooter className="gap-2 sm:space-x-0 [&>button]:w-full sm:[&>button]:w-auto">
        <Button type="button" variant="outline" onClick={onClose}>
          Отмена
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={() => savePublicLinkAccessWindow(link.id, values, link, onClose)}
        >
          {isSavingAccessWindow ? 'Сохраняем...' : 'Сохранить'}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Правка окна доступа существующей ссылки. Открывается из меню строки. */
export function PublicLinkAccessWindowDialog({ link, onClose }: PublicLinkAccessWindowDialogProps) {
  return (
    <Dialog
      open={link !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className={`sm:max-w-lg ${adminClassNames.dialog.content}`}>
        {link ? <PublicLinkAccessWindowForm link={link} onClose={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}
