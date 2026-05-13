import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetProfessionAtlasSettingsQueryKey,
  getAdminSettingsControllerGetOpenRouterSettingsQueryKey,
  useAdminSettingsControllerGetProfessionAtlasSettings,
  useAdminSettingsControllerGetOpenRouterSettings,
  useAdminSettingsControllerUpdateProfessionAtlasUrl,
  useAdminSettingsControllerUpdateOpenRouterApiKey,
} from '@/shared/api/generated/admin/admin';

import { OpenRouterSettingsCard, ProfessionAtlasSettingsCard } from './admin-settings-cards';

import type { FormEvent } from 'react';

const getApiErrorMessage = (error: unknown) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'Запрос не выполнен';
  }

  const response = error.response;

  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return 'Запрос не выполнен';
  }

  const data = response.data;

  if (typeof data !== 'object' || data === null) {
    return 'Запрос не выполнен';
  }

  if (
    'error' in data &&
    typeof data.error === 'object' &&
    data.error !== null &&
    'message' in data.error
  ) {
    return String(data.error.message);
  }

  if ('message' in data) {
    return String(data.message);
  }

  return 'Запрос не выполнен';
};

export function AdminSettingsWorkspace() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');
  const [professionAtlasForm, setProfessionAtlasForm] = useState({
    isDirty: false,
    value: '',
  });

  const settingsQuery = useAdminSettingsControllerGetOpenRouterSettings();
  const professionAtlasQuery = useAdminSettingsControllerGetProfessionAtlasSettings();
  const updateApiKeyMutation = useAdminSettingsControllerUpdateOpenRouterApiKey({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error));
      },
      onSuccess: async () => {
        setApiKey('');
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetOpenRouterSettingsQueryKey(),
        });
        toast.success('OpenRouter API key сохранен');
      },
    },
  });
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
  const normalizedApiKey = apiKey.trim();
  const professionAtlasUrl = professionAtlasForm.isDirty
    ? professionAtlasForm.value
    : (professionAtlas?.url ?? '');
  const normalizedProfessionAtlasUrl = professionAtlasUrl.trim();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!normalizedApiKey || updateApiKeyMutation.isPending) {
      return;
    }

    updateApiKeyMutation.mutate({
      data: {
        apiKey: normalizedApiKey,
      },
    });
  };

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
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-normal text-slate-900">Настройки</h1>
        <p className="text-sm text-slate-600">
          OpenRouter используется для анализа ответов. Атлас профессий показывается на публичной
          странице результата.
        </p>
      </div>

      <OpenRouterSettingsCard
        apiKey={apiKey}
        canSubmit={Boolean(normalizedApiKey) && !updateApiKeyMutation.isPending}
        isError={settingsQuery.isError}
        isLoading={settingsQuery.isLoading}
        isSaving={updateApiKeyMutation.isPending}
        openRouter={openRouter}
        onApiKeyChange={setApiKey}
        onRetry={() => {
          void settingsQuery.refetch();
        }}
        onSubmit={handleSubmit}
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
