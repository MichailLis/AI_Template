import {
  ExternalLink,
  KeyRound,
  Link2,
  RefreshCcw,
  Save,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
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
    ? adminBadgeClassNames.success
    : adminBadgeClassNames.warning;

  return (
    <Badge variant="outline" className={className}>
      {openRouter.isConfigured ? 'Ключ настроен' : 'Ключ не настроен'}
    </Badge>
  );
}

function SettingsLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 p-4 ${adminClassNames.panel.dangerInline}`}
    >
      <span className="flex items-center gap-2">
        <TriangleAlert className="h-4 w-4" />
        {message}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={adminToneClassNames.danger.active}
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
    <div className={`grid gap-3 text-sm sm:grid-cols-3 ${adminClassNames.panel.loading}`}>
      <div>
        <p className={adminClassNames.text.kicker}>Источник</p>
        <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>
          {sourceLabels[openRouter.source]}
        </p>
      </div>
      <div>
        <p className={adminClassNames.text.kicker}>Текущий ключ</p>
        <p className={`mt-1 font-mono ${adminClassNames.text.heading}`}>
          {openRouter.maskedValue ?? 'не задан'}
        </p>
      </div>
      <div>
        <p className={adminClassNames.text.kicker}>Обновлен</p>
        <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>
          {formatUpdatedAt(openRouter.updatedAt)}
        </p>
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
    <div
      className={`grid gap-3 text-sm sm:grid-cols-[minmax(0,1fr)_12rem] ${adminClassNames.panel.loading}`}
    >
      <div className="min-w-0">
        <p className={adminClassNames.text.kicker}>Текущая ссылка</p>
        {professionAtlas.url ? (
          <a
            href={professionAtlas.url}
            target="_blank"
            rel="noreferrer"
            className={`mt-1 inline-flex max-w-full items-center gap-1 break-all font-medium ${adminClassNames.text.linkInfo}`}
          >
            {professionAtlas.url}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : (
          <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>не задана</p>
        )}
      </div>
      <div>
        <p className={adminClassNames.text.kicker}>Обновлена</p>
        <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>
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
        <p className={adminClassNames.form.fieldHint}>
          После сохранения поле очищается, а ключ отображается только в маскированном виде.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!canSubmit}>
          <Save className="h-4 w-4" />
          {isSaving ? 'Сохраняем...' : 'Сохранить ключ'}
        </Button>
        {openRouter?.source === 'ENV' ? (
          <span className={`flex items-center gap-2 ${adminClassNames.form.fieldHint}`}>
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
        <p className={adminClassNames.form.fieldHint}>
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
    <Card className={`rounded-lg ${adminClassNames.panel.card}`}>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className={`h-5 w-5 ${adminClassNames.text.muted}`} />
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
          <div className={adminClassNames.panel.loading}>Загружаем текущие настройки...</div>
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
    <Card className={`rounded-lg ${adminClassNames.panel.card}`}>
      <CardHeader className="space-y-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className={`h-5 w-5 ${adminClassNames.text.muted}`} />
            Атлас профессий
          </CardTitle>
          <CardDescription>
            Ссылка будет показана студенту на странице результата теста.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {isLoading ? (
          <div className={adminClassNames.panel.loading}>Загружаем текущую ссылку...</div>
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
