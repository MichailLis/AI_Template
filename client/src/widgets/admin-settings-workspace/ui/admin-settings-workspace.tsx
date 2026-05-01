import { useQueryClient } from '@tanstack/react-query';
import { KeyRound, RefreshCcw, Save, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetOpenRouterSettingsQueryKey,
  useAdminSettingsControllerGetOpenRouterSettings,
  useAdminSettingsControllerUpdateOpenRouterApiKey,
} from '@/shared/api/generated/admin/admin';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type {
  AdminOpenRouterSettingsResponseDto,
  AdminOpenRouterSettingsResponseDtoOpenRouterSource,
} from '@/shared/api/model';
import type { FormEvent } from 'react';

type OpenRouterSettings = AdminOpenRouterSettingsResponseDto['openRouter'];

const sourceLabels: Record<AdminOpenRouterSettingsResponseDtoOpenRouterSource, string> = {
  DATABASE: 'Настройки админки',
  ENV: 'Переменная окружения',
  NONE: 'Не задан',
};

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

const formatUpdatedAt = (value: string | null) => {
  if (!value) {
    return 'не обновлялся через админку';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

function OpenRouterStateBadge({ openRouter }: { openRouter: OpenRouterSettings }) {
  const className = openRouter.isConfigured
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

  return (
    <Badge variant="outline" className={className}>
      {openRouter.isConfigured ? 'Ключ настроен' : 'Ключ не настроен'}
    </Badge>
  );
}

function SettingsLoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <span className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4" />
        Не удалось загрузить настройки OpenRouter.
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-red-200 bg-white text-red-700 hover:bg-red-50"
        onClick={onRetry}
      >
        <RefreshCcw className="h-4 w-4" />
        Повторить
      </Button>
    </div>
  );
}

function OpenRouterStatusPanel({ openRouter }: { openRouter: OpenRouterSettings }) {
  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Источник</p>
        <p className="mt-1 font-medium text-slate-900">{sourceLabels[openRouter.source]}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Текущий ключ</p>
        <p className="mt-1 font-mono text-slate-900">{openRouter.maskedValue ?? 'не задан'}</p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Обновлен</p>
        <p className="mt-1 font-medium text-slate-900">{formatUpdatedAt(openRouter.updatedAt)}</p>
      </div>
    </div>
  );
}

interface ApiKeyFormProps {
  apiKey: string;
  canSubmit: boolean;
  isSaving: boolean;
  openRouter: OpenRouterSettings | undefined;
  onApiKeyChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

function ApiKeyForm({
  apiKey,
  canSubmit,
  isSaving,
  openRouter,
  onApiKeyChange,
  onSubmit,
}: ApiKeyFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="openrouter-api-key">Новый API key</Label>
        <Input
          id="openrouter-api-key"
          type="password"
          value={apiKey}
          onChange={(event) => onApiKeyChange(event.target.value)}
          placeholder="sk-or-v1-..."
          autoComplete="off"
          spellCheck={false}
          className="font-mono"
        />
        <p className="text-xs text-slate-500">
          После сохранения поле очищается, а ключ отображается только в маскированном виде.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canSubmit}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Сохраняем...' : 'Сохранить ключ'}
        </Button>
        {openRouter?.source === 'ENV' ? (
          <span className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Сейчас используется ключ из окружения сервера.
          </span>
        ) : null}
      </div>
    </form>
  );
}

export function AdminSettingsWorkspace() {
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState('');

  const settingsQuery = useAdminSettingsControllerGetOpenRouterSettings();
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

  const openRouter = settingsQuery.data?.openRouter;
  const normalizedApiKey = apiKey.trim();

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

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-normal text-slate-900">Настройки</h1>
        <p className="text-sm text-slate-600">OpenRouter используется для анализа ответов.</p>
      </div>

      <Card className="rounded-lg border-slate-200 shadow-sm">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg">
                <KeyRound className="h-5 w-5 text-slate-700" />
                OpenRouter API key
              </CardTitle>
              <CardDescription>
                Новый ключ сохранится в настройках проекта и будет иметь приоритет над `.env`.
              </CardDescription>
            </div>
            {openRouter ? <OpenRouterStateBadge openRouter={openRouter} /> : null}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {settingsQuery.isLoading ? (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              Загружаем текущие настройки...
            </div>
          ) : null}

          {settingsQuery.isError ? (
            <SettingsLoadError
              onRetry={() => {
                void settingsQuery.refetch();
              }}
            />
          ) : null}

          {openRouter ? <OpenRouterStatusPanel openRouter={openRouter} /> : null}

          <ApiKeyForm
            apiKey={apiKey}
            canSubmit={Boolean(normalizedApiKey) && !updateApiKeyMutation.isPending}
            isSaving={updateApiKeyMutation.isPending}
            openRouter={openRouter}
            onApiKeyChange={setApiKey}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
