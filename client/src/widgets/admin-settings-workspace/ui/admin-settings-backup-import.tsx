import { useQueryClient } from '@tanstack/react-query';
import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminBackupsControllerGetOverviewQueryKey,
  useAdminBackupsControllerImportBackup,
} from '@/shared/api/generated/admin/admin';
import { Button } from '@/shared/ui/button';

import { toBackupErrorMessage } from './use-backups-settings';

import type { ChangeEvent } from 'react';

/**
 * Загрузка готового дампа (.dump) с этого или другого сервера. Файл уходит телом запроса как есть,
 * поэтому браузер показывает настоящий прогресс отправки.
 */
export function BackupImportButton({ disabled }: { disabled: boolean }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const importMutation = useAdminBackupsControllerImportBackup({
    request: {
      onUploadProgress: (event) => {
        if (event.total) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      },
    },
    mutation: {
      onError: (error) => {
        toast.error(toBackupErrorMessage(error));
      },
      onSuccess: async () => {
        toast.success('Копия загружена. Восстановить базу из нее можно кнопкой «Восстановить»');
        await queryClient.invalidateQueries({
          queryKey: getAdminBackupsControllerGetOverviewQueryKey(),
        });
      },
      onSettled: () => {
        setProgress(null);
      },
    },
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      setProgress(0);
      importMutation.mutate({ data: file, params: { fileName: file.name } });
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".dump,application/octet-stream"
        className="hidden"
        aria-label="Файл резервной копии"
        onChange={handleChange}
      />
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={disabled || importMutation.isPending}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {importMutation.isPending ? `Загрузка ${progress ?? 0}%` : 'Загрузить копию'}
      </Button>
    </>
  );
}
