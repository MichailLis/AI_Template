import { PlusCircle } from 'lucide-react';
import { useWatch } from 'react-hook-form';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog';

import { TestsTopicBaseFields } from './tests-topic-base-fields';

import type { CreateTestValues } from '../model/types';
import type { UseFormReturn } from 'react-hook-form';

interface TestsCreateModalProps {
  open: boolean;
  isCreating: boolean;
  form: UseFormReturn<CreateTestValues>;
  onOpenChange: (nextOpen: boolean) => void;
  onCreateTest: () => void;
}

export function TestsCreateModal({
  open,
  isCreating,
  form,
  onOpenChange,
  onCreateTest,
}: TestsCreateModalProps) {
  const title = useWatch({ control: form.control, name: 'title' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={adminClassNames.dialog.content}>
        <DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div
                className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.info.icon}`}
              >
                <PlusCircle className="size-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle>Создать тест</DialogTitle>
                <DialogDescription>
                  Заполните базовую информацию. Редактировать можно будет позже.
                </DialogDescription>
              </div>
            </div>
            <Badge variant="outline" className={adminBadgeClassNames.info}>
              Новый черновик
            </Badge>
          </div>
        </DialogHeader>

        <div className={`my-4 flex flex-col gap-4 ${adminClassNames.panel.compactSection}`}>
          <TestsTopicBaseFields form={form} disabled={isCreating} titleLabel="Название теста *" />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCreating}
          >
            Отмена
          </Button>
          <Button type="button" onClick={onCreateTest} disabled={isCreating || !title.trim()}>
            {isCreating ? 'Создание...' : 'Создать тест'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
