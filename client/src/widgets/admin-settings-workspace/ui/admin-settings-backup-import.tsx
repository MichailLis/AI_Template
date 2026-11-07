import { Upload } from 'lucide-react';
import { useRef } from 'react';

import { useImportBackup } from '@/features/manage-backups';
import { Button } from '@/shared/ui/button';

import type { ChangeEvent } from 'react';

/** Выбор файла дампа (.dump) для загрузки; сама отправка и прогресс — в features/manage-backups. */
export function BackupImportButton({ disabled }: { disabled: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { importBackup, isImporting, progress } = useImportBackup();
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (file) {
      importBackup(file);
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
        disabled={disabled || isImporting}
        onClick={() => inputRef.current?.click()}
      >
        <Upload />
        {isImporting ? `Загрузка ${progress ?? 0}%` : 'Загрузить копию'}
      </Button>
    </>
  );
}
