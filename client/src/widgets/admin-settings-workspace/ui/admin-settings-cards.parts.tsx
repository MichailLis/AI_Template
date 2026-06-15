import { ExternalLink, RefreshCcw, Save, TriangleAlert } from 'lucide-react';

import {
  adminBadgeClassNames,
  adminClassNames,
  adminToneClassNames,
} from '@/shared/ui/admin-design-tokens';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import {
  atlasCoverageItemStatusLabels,
  atlasCoverageStatusLabels,
  formatUpdatedAt,
  sourceLabels,
} from './admin-settings-cards.model';

import type {
  OpenRouterSettings,
  ProfessionAtlasCoverage,
  ProfessionAtlasSettings,
} from './admin-settings-cards.model';
import type { FormEvent } from 'react';

export function OpenRouterStateBadge({ openRouter }: { openRouter: OpenRouterSettings }) {
  const className = openRouter.isConfigured
    ? adminBadgeClassNames.success
    : adminBadgeClassNames.warning;

  return (
    <Badge variant="outline" className={className}>
      {openRouter.isConfigured ? 'Ключ настроен' : 'Ключ не настроен'}
    </Badge>
  );
}

export function SettingsLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
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

export function OpenRouterStatusPanel({ openRouter }: { openRouter: OpenRouterSettings }) {
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

export function ProfessionAtlasStatusPanel({
  professionAtlas,
}: {
  professionAtlas: ProfessionAtlasSettings;
}) {
  return (
    <div
      className={`grid gap-3 text-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem] ${adminClassNames.panel.loading}`}
    >
      <div className="min-w-0">
        <p className={adminClassNames.text.kicker}>Public URL</p>
        {(professionAtlas.publicUrl ?? professionAtlas.url) ? (
          <a
            href={professionAtlas.publicUrl ?? professionAtlas.url ?? ''}
            target="_blank"
            rel="noreferrer"
            className={`mt-1 inline-flex max-w-full items-center gap-1 break-all font-medium ${adminClassNames.text.linkInfo}`}
          >
            {professionAtlas.publicUrl ?? professionAtlas.url}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : (
          <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>не задана</p>
        )}
      </div>
      <div className="min-w-0">
        <p className={adminClassNames.text.kicker}>API URL</p>
        {professionAtlas.apiUrl ? (
          <a
            href={professionAtlas.apiUrl}
            target="_blank"
            rel="noreferrer"
            className={`mt-1 inline-flex max-w-full items-center gap-1 break-all font-medium ${adminClassNames.text.linkInfo}`}
          >
            {professionAtlas.apiUrl}
            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
          </a>
        ) : (
          <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>не задан</p>
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

const coverageBadgeClassNames: Record<ProfessionAtlasCoverage['status'], string> = {
  ready: adminBadgeClassNames.success,
  partial: adminBadgeClassNames.warning,
  unavailable: adminBadgeClassNames.danger,
};

const coverageItemBadgeClassNames: Record<
  ProfessionAtlasCoverage['items'][number]['status'],
  string
> = {
  found: adminBadgeClassNames.success,
  missing: adminBadgeClassNames.neutral,
  duplicate: adminBadgeClassNames.warning,
};

export function ProfessionAtlasCoveragePanel({
  coverage,
}: {
  coverage: ProfessionAtlasCoverage | null | undefined;
}) {
  if (!coverage) {
    return null;
  }

  return (
    <div className={`flex flex-col gap-3 ${adminClassNames.panel.loading}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className={adminClassNames.text.kicker}>Покрытие профессий методики</p>
          <p className={`mt-1 font-medium ${adminClassNames.text.heading}`}>
            {coverage.found} из {coverage.total} найдены
          </p>
        </div>
        <Badge variant="outline" className={coverageBadgeClassNames[coverage.status]}>
          {atlasCoverageStatusLabels[coverage.status]}
        </Badge>
      </div>

      {coverage.errorMessage ? (
        <div className={adminClassNames.panel.warningInline}>{coverage.errorMessage}</div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        {coverage.items.map((item) => {
          const primaryMatch = item.matches[0];

          return (
            <div
              key={item.title}
              className="flex min-w-0 flex-wrap items-center justify-between gap-2 rounded-md border border-admin-border bg-admin-panel px-3 py-2"
            >
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${adminClassNames.text.heading}`}>
                  {item.title}
                </p>
                {primaryMatch ? (
                  <a
                    href={primaryMatch.url}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-xs ${adminClassNames.text.linkInfo}`}
                  >
                    {primaryMatch.title}
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                ) : null}
              </div>
              <Badge variant="outline" className={coverageItemBadgeClassNames[item.status]}>
                {atlasCoverageItemStatusLabels[item.status]}
              </Badge>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ProfessionAtlasFormProps {
  apiUrl: string;
  canSubmit: boolean;
  isSaving: boolean;
  publicUrl: string;
  onApiUrlChange: (value: string) => void;
  onPublicUrlChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function ProfessionAtlasForm({
  apiUrl,
  canSubmit,
  isSaving,
  publicUrl,
  onApiUrlChange,
  onPublicUrlChange,
  onSubmit,
}: ProfessionAtlasFormProps) {
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="profession-atlas-public-url">Public URL Атласа</Label>
        <Input
          id="profession-atlas-public-url"
          type="url"
          value={publicUrl}
          onChange={(event) => onPublicUrlChange(event.target.value)}
          placeholder="https://atlas.rcs-center.ru"
          autoComplete="off"
          spellCheck={false}
        />
        <p className={adminClassNames.form.fieldHint}>
          Используется для внешних ссылок в результате студента.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profession-atlas-api-url">API URL Атласа</Label>
        <Input
          id="profession-atlas-api-url"
          type="url"
          value={apiUrl}
          onChange={(event) => onApiUrlChange(event.target.value)}
          placeholder="https://atlas.rcs-center.ru/api-backend"
          autoComplete="off"
          spellCheck={false}
        />
        <p className={adminClassNames.form.fieldHint}>
          Используется сервером для карточек профессий и рекомендаций.
        </p>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        <Save className="h-4 w-4" />
        {isSaving ? 'Сохраняем...' : 'Сохранить настройки'}
      </Button>
    </form>
  );
}
