import { useQueryClient } from '@tanstack/react-query';
import { SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey,
  useAdminSettingsControllerGetProfessionAtlasSettings,
  useAdminSettingsControllerGetOpenRouterSettings,
  useAdminSettingsControllerUpdateProfessionAtlasUrl,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage as getSharedApiErrorMessage } from '@/shared/lib/api-error';
import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';

import { OpenRouterSettingsCard, ProfessionAtlasSettingsCard } from './admin-settings-cards';

import type { FormEvent } from 'react';

const getApiErrorMessage = (error: unknown) =>
  getSharedApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' });

function AdminSettingsHero({
  isOpenRouterConfigured,
  isProfessionAtlasConfigured,
}: {
  isOpenRouterConfigured: boolean;
  isProfessionAtlasConfigured: boolean;
}) {
  return (
    <div className={`${adminClassNames.panel.hero} rounded-xl p-5`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <div
            className={`grid size-11 shrink-0 place-items-center rounded-xl ${adminToneClassNames.accent.icon}`}
          >
            <SlidersHorizontal className="size-5" />
          </div>
          <div className="min-w-0">
            <h1
              className={`text-2xl font-semibold tracking-normal ${adminClassNames.text.heading}`}
            >
              Настройки
            </h1>
            <p className={`mt-1 text-sm ${adminClassNames.text.body}`}>
              OpenRouter используется для анализа ответов. Атлас профессий показывается на публичной
              странице результата.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Badge
            variant="outline"
            className={
              isOpenRouterConfigured ? adminBadgeClassNames.success : adminBadgeClassNames.warning
            }
          >
            {isOpenRouterConfigured ? 'OpenRouter готов' : 'OpenRouter требует ключ'}
          </Badge>
          <Badge
            variant="outline"
            className={
              isProfessionAtlasConfigured ? adminBadgeClassNames.info : adminBadgeClassNames.neutral
            }
          >
            {isProfessionAtlasConfigured ? 'Атлас подключен' : 'Атлас не задан'}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function AdminSettingsWorkspace() {
  const queryClient = useQueryClient();
  const [professionAtlasForm, setProfessionAtlasForm] = useState({
    isDirty: false,
    value: '',
  });

  const settingsQuery = useAdminSettingsControllerGetOpenRouterSettings();
  const professionAtlasQuery = useAdminSettingsControllerGetProfessionAtlasSettings();
  const updateProfessionAtlasUrlMutation = useAdminSettingsControllerUpdateProfessionAtlasUrl({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
      onSuccess: async () => {
        setProfessionAtlasForm({ isDirty: false, value: '' });
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey(),
        });
        toast.success('Ссылка на Атлас профессий сохранена');
      },
    },
  });

  const openRouter = settingsQuery.data?.openRouter;
  const professionAtlas = professionAtlasQuery.data?.professionAtlas;
  const professionAtlasUrl = professionAtlasForm.isDirty
    ? professionAtlasForm.value
    : (professionAtlas?.url ?? '');
  const normalizedProfessionAtlasUrl = professionAtlasUrl.trim();

  const handleProfessionAtlasSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedProfessionAtlasUrl || updateProfessionAtlasUrlMutation.isPending) {
      return;
    }

    updateProfessionAtlasUrlMutation.mutate({
      data: {
        url: normalizedProfessionAtlasUrl,
      },
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <AdminSettingsHero
        isOpenRouterConfigured={Boolean(openRouter?.isConfigured)}
        isProfessionAtlasConfigured={Boolean(professionAtlas?.url)}
      />

      <OpenRouterSettingsCard
        isError={settingsQuery.isError}
        isLoading={settingsQuery.isLoading}
        openRouter={openRouter}
        onRetry={() => {
          void settingsQuery.refetch();
        }}
      />

      <ProfessionAtlasSettingsCard
        url={professionAtlasUrl}
        canSubmit={
          Boolean(normalizedProfessionAtlasUrl) && !updateProfessionAtlasUrlMutation.isPending
        }
        isError={professionAtlasQuery.isError}
        isLoading={professionAtlasQuery.isLoading}
        isSaving={updateProfessionAtlasUrlMutation.isPending}
        professionAtlas={professionAtlas}
        onRetry={() => {
          void professionAtlasQuery.refetch();
        }}
        onSubmit={handleProfessionAtlasSubmit}
        onUrlChange={(value) => setProfessionAtlasForm({ isDirty: true, value })}
      />
    </div>
  );
}
