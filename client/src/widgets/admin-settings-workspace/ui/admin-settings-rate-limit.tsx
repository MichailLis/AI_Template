import { useQueryClient } from '@tanstack/react-query';
import { Gauge, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetPublicRateLimitSettingsQueryKey,
  useAdminSettingsControllerGetPublicRateLimitSettings,
  useAdminSettingsControllerUpdatePublicRateLimit,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import { SettingsLoadError } from './admin-settings-cards.parts';

import type { FormEvent } from 'react';

const MAX_LIMIT = 10000;

/** Целое от 1 до 10 000, как требует сервер; иначе null — кнопка сохранения неактивна. */
const parseRateLimitValue = (value: string) => {
  const parsed = Number(value.trim());
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MAX_LIMIT ? parsed : null;
};

export function PublicRateLimitSettingsCard() {
  const queryClient = useQueryClient();
  const settingsQuery = useAdminSettingsControllerGetPublicRateLimitSettings();
  const saved = settingsQuery.data?.publicRateLimit;
  // Черновик появляется с первой правкой; до неё поля показывают сохранённые значения.
  const [draft, setDraft] = useState<{ perMinute: string; burst: string } | null>(null);
  const perMinute = draft?.perMinute ?? String(saved?.perMinute ?? '');
  const burst = draft?.burst ?? String(saved?.burst ?? '');
  const parsedPerMinute = parseRateLimitValue(perMinute);
  const parsedBurst = parseRateLimitValue(burst);

  const updateMutation = useAdminSettingsControllerUpdatePublicRateLimit({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' }));
      },
      onSuccess: async () => {
        setDraft(null);
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetPublicRateLimitSettingsQueryKey(),
        });
        toast.success('Лимит запросов сохранён');
      },
    },
  });

  const canSubmit = Boolean(draft && parsedPerMinute && parsedBurst) && !updateMutation.isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit || !parsedPerMinute || !parsedBurst) {
      return;
    }

    updateMutation.mutate({ data: { perMinute: parsedPerMinute, burst: parsedBurst } });
  };

  const updateDraft = (field: 'perMinute' | 'burst', value: string) =>
    setDraft((current) => ({ perMinute, burst, ...current, [field]: value }));

  return (
    <Card className={`rounded-lg ${adminClassNames.panel.card}`}>
      <CardHeader className={adminClassNames.border.bottom}>
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gauge className="size-4 shrink-0 text-admin-muted" />
            Лимит запросов учеников
          </CardTitle>
          <CardDescription>
            Сколько раз с одного адреса можно начать или завершить тест. Каждое завершение запускает
            платный AI-анализ; весь класс школы обычно выходит в интернет с одного адреса, поэтому
            лимит должен быть с запасом.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-4">
        {settingsQuery.isLoading ? (
          <div className={adminClassNames.panel.loading}>Загружаем текущий лимит...</div>
        ) : null}

        {settingsQuery.isError ? (
          <SettingsLoadError
            message="Не удалось загрузить лимит запросов."
            onRetry={() => {
              void settingsQuery.refetch();
            }}
          />
        ) : null}

        {saved ? (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="public-rate-limit-per-minute">Запросов в минуту</Label>
              <Input
                id="public-rate-limit-per-minute"
                type="number"
                min={1}
                max={MAX_LIMIT}
                step={1}
                value={perMinute}
                onChange={(event) => updateDraft('perMinute', event.target.value)}
              />
              <p className={adminClassNames.form.fieldHint}>
                Отдельно для начала и для завершения теста. По умолчанию 60.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="public-rate-limit-burst">Всплеск подряд</Label>
              <Input
                id="public-rate-limit-burst"
                type="number"
                min={1}
                max={MAX_LIMIT}
                step={1}
                value={burst}
                onChange={(event) => updateDraft('burst', event.target.value)}
              />
              <p className={adminClassNames.form.fieldHint}>
                Сколько запросов проходит сразу, например когда класс одновременно нажимает
                «Начать». По умолчанию 120.
              </p>
            </div>

            <Button type="submit" disabled={!canSubmit}>
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Сохраняем...' : 'Сохранить лимит'}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
