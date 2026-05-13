import {
  ExternalLink,
  KeyRound,
  Link2,
  RefreshCcw,
  Save,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type {
  AdminProfessionAtlasSettingsResponseDto,
  AdminOpenRouterSettingsResponseDto,
  AdminOpenRouterSettingsResponseDtoOpenRouterSource,
} from '@/shared/api/model';
import type { FormEvent } from 'react';

type OpenRouterSettings = AdminOpenRouterSettingsResponseDto['openRouter'];
type ProfessionAtlasSettings = AdminProfessionAtlasSettingsResponseDto['professionAtlas'];

const sourceLabels: Record<AdminOpenRouterSettingsResponseDtoOpenRouterSource, string> = {
  DATABASE: 'Настройки админки',
  ENV: 'Переменная окружения',
  NONE: 'Не задан',
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

function SettingsLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      <span className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4" />
        {message}
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

function ProfessionAtlasStatusPanel({
  professionAtlas,
}: {
  professionAtlas: ProfessionAtlasSettings;
}) {
  return (
    <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-[minmax(0,1fr)_12rem]">
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Текущая ссылка</p>
        {professionAtlas.url ? (
          <a
            href={professionAtlas.url}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex max-w-full items-center gap-1 break-all font-medium text-sky-700 hover:text-sky-800"
          >
            {professionAtlas.url}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : (
          <p className="mt-1 font-medium text-slate-900">не задана</p>
        )}
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Обновлена</p>
        <p className="mt-1 font-medium text-slate-900">
          {formatUpdatedAt(professionAtlas.updatedAt)}
        </p>
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

interface ProfessionAtlasFormProps {
  canSubmit: boolean;
  isSaving: boolean;
  url: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUrlChange: (value: string) => void;
}

function ProfessionAtlasForm({
  canSubmit,
  isSaving,
  url,
  onSubmit,
  onUrlChange,
}: ProfessionAtlasFormProps) {
  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="profession-atlas-url">Ссылка на Атлас профессий</Label>
        <Input
          id="profession-atlas-url"
          type="url"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="https://..."
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-slate-500">
          Эта ссылка появится на странице результата после завершения теста.
        </p>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        <Save className="h-4 w-4" />
        {isSaving ? 'Сохраняем...' : 'Сохранить ссылку'}
      </Button>
    </form>
  );
}

interface OpenRouterSettingsCardProps {
  apiKey: string;
  canSubmit: boolean;
  isError: boolean;
  isLoading: boolean;
  isSaving: boolean;
  openRouter: OpenRouterSettings | undefined;
  onApiKeyChange: (value: string) => void;
  onRetry: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function OpenRouterSettingsCard({
  apiKey,
  canSubmit,
  isError,
  isLoading,
  isSaving,
  openRouter,
  onApiKeyChange,
  onRetry,
  onSubmit,
}: OpenRouterSettingsCardProps) {
  return (
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
        {isLoading ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Загружаем текущие настройки...
          </div>
        ) : null}

        {isError ? (
          <SettingsLoadError
            message="Не удалось загрузить настройки OpenRouter."
            onRetry={onRetry}
          />
        ) : null}

        {openRouter ? <OpenRouterStatusPanel openRouter={openRouter} /> : null}

        <ApiKeyForm
          apiKey={apiKey}
          canSubmit={canSubmit}
          isSaving={isSaving}
          openRouter={openRouter}
          onApiKeyChange={onApiKeyChange}
          onSubmit={onSubmit}
        />
      </CardContent>
    </Card>
  );
}

interface ProfessionAtlasSettingsCardProps {
  canSubmit: boolean;
  isError: boolean;
  isLoading: boolean;
  isSaving: boolean;
  professionAtlas: ProfessionAtlasSettings | undefined;
  url: string;
  onRetry: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUrlChange: (value: string) => void;
}

export function ProfessionAtlasSettingsCard({
  canSubmit,
  isError,
  isLoading,
  isSaving,
  professionAtlas,
  url,
  onRetry,
  onSubmit,
  onUrlChange,
}: ProfessionAtlasSettingsCardProps) {
  return (
    <Card className="rounded-lg border-slate-200 shadow-sm">
      <CardHeader className="space-y-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="h-5 w-5 text-slate-700" />
            Атлас профессий
          </CardTitle>
          <CardDescription>
            Ссылка будет показана студенту на странице результата теста.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Загружаем текущую ссылку...
          </div>
        ) : null}

        {isError ? (
          <SettingsLoadError
            message="Не удалось загрузить настройки Атласа профессий."
            onRetry={onRetry}
          />
        ) : null}

        {professionAtlas ? <ProfessionAtlasStatusPanel professionAtlas={professionAtlas} /> : null}

        <ProfessionAtlasForm
          url={url}
          canSubmit={canSubmit}
          isSaving={isSaving}
          onUrlChange={onUrlChange}
          onSubmit={onSubmit}
        />
      </CardContent>
    </Card>
  );
}
