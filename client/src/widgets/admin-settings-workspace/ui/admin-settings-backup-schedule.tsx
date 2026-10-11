import { useQueryClient } from '@tanstack/react-query';
import { CalendarClock, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminBackupsControllerGetOverviewQueryKey,
  useAdminBackupsControllerUpdateSettings,
} from '@/shared/api/generated/admin/admin';
import { formatDateTime } from '@/shared/lib/date-format';
import { cn } from '@/shared/lib/utils';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { formatScheduleHour, SCHEDULE_HOURS } from './admin-settings-backups.model';
import { toBackupErrorMessage } from './use-backups-settings';

import type { BackupSettings } from './admin-settings-backups.model';
import type { FormEvent } from 'react';

interface BackupScheduleFormProps {
  settings: BackupSettings;
  nextScheduledAt: string | null;
}

/**
 * Расписание и срок хранения копий. Черновик формы живет отдельно от данных запроса и
 * сбрасывается после сохранения: до первой правки форма показывает то, что вернул сервер.
 */
export function BackupScheduleForm({ settings, nextScheduledAt }: BackupScheduleFormProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<BackupSettings | null>(null);
  const values = draft ?? settings;

  const updateMutation = useAdminBackupsControllerUpdateSettings({
    mutation: {
      onError: (error) => {
        toast.error(toBackupErrorMessage(error));
      },
      onSuccess: async () => {
        setDraft(null);
        toast.success('Настройки резервного копирования сохранены');
        await queryClient.invalidateQueries({
          queryKey: getAdminBackupsControllerGetOverviewQueryKey(),
        });
      },
    },
  });

  const update = (patch: Partial<BackupSettings>) => setDraft({ ...values, ...patch });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (draft && !updateMutation.isPending) {
      updateMutation.mutate({ data: draft });
    }
  };

  return (
    <form
      className={`flex flex-col gap-4 ${adminClassNames.panel.section}`}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className={`flex items-center gap-2 font-medium ${adminClassNames.text.heading}`}>
            <CalendarClock className="size-4 shrink-0 text-admin-muted" />
            Копия каждый день
          </p>
          <p className={`text-xs ${adminClassNames.text.muted}`}>
            {settings.scheduleEnabled && nextScheduledAt
              ? `Следующая автоматическая копия: ${formatDateTime(nextScheduledAt)}`
              : 'Автоматические копии выключены'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={values.scheduleEnabled}
          aria-label="Создавать копию автоматически каждый день"
          onClick={() => update({ scheduleEnabled: !values.scheduleEnabled })}
          className={cn(
            'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
            values.scheduleEnabled
              ? adminClassNames.switch.active
              : adminClassNames.switch.inactive,
          )}
        >
          <span
            className={`${adminClassNames.switch.thumb} ${
              values.scheduleEnabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="backup-schedule-hour">Время запуска</Label>
          <AdminSelectField
            id="backup-schedule-hour"
            value={values.scheduleHourUtc}
            disabled={!values.scheduleEnabled}
            onChange={(event) => update({ scheduleHourUtc: Number(event.target.value) })}
          >
            {SCHEDULE_HOURS.map((hour) => (
              <option key={hour} value={hour}>
                {formatScheduleHour(hour)}
              </option>
            ))}
          </AdminSelectField>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="backup-retention-days">Хранить, дней</Label>
          <Input
            id="backup-retention-days"
            type="number"
            min={1}
            max={365}
            value={values.retentionDays}
            onChange={(event) => update({ retentionDays: Number(event.target.value) })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="backup-max-count">Не больше копий</Label>
          <Input
            id="backup-max-count"
            type="number"
            min={1}
            max={200}
            value={values.maxCount}
            onChange={(event) => update({ maxCount: Number(event.target.value) })}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={!draft || updateMutation.isPending}>
          <Save />
          {updateMutation.isPending ? 'Сохраняем...' : 'Сохранить'}
        </Button>
      </div>
    </form>
  );
}
