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

import { formatUpdatedAt, sourceLabels } from './admin-settings-cards.model';

import type { OpenRouterSettings, ProfessionAtlasSettings } from './admin-settings-cards.model';
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

export function ProfessionAtlasForm({
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
