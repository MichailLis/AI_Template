import { ExternalLink, KeyRound, Link2, RefreshCcw, Save, TriangleAlert } from 'lucide-react';

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
} from '@/shared/api/model';
import type { FormEvent } from 'react';

type OpenRouterSettings = AdminOpenRouterSettingsResponseDto['openRouter'];
type ProfessionAtlasSettings = AdminProfessionAtlasSettingsResponseDto['professionAtlas'];

const sourceLabels: Record<OpenRouterSettings['source'], string> = {
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
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
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
  isError: boolean;
  isLoading: boolean;
  openRouter: OpenRouterSettings | undefined;
  onRetry: () => void;
}

export function OpenRouterSettingsCard({
  isError,
  isLoading,
  openRouter,
  onRetry,
}: OpenRouterSettingsCardProps) {
  return (
    <Card className={`rounded-lg ${adminClassNames.panel.card}`}>
      <CardHeader className={adminClassNames.border.bottom}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.info.icon}`}
            >
              <KeyRound className="size-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-lg">OpenRouter API key</CardTitle>
              <CardDescription>
                Ключ берется только из переменной окружения сервера.
              </CardDescription>
            </div>
          </div>
          {openRouter ? <OpenRouterStateBadge openRouter={openRouter} /> : null}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-4">
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
      <CardHeader className={adminClassNames.border.bottom}>
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={`grid size-10 shrink-0 place-items-center rounded-xl ${adminToneClassNames.accent.icon}`}
          >
            <Link2 className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-lg">Атлас профессий</CardTitle>
            <CardDescription>
              Ссылка будет показана студенту на странице результата теста.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-4">
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
