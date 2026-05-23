import { KeyRound, Link2 } from 'lucide-react';

import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

import {
  OpenRouterStateBadge,
  OpenRouterStatusPanel,
  ProfessionAtlasForm,
  ProfessionAtlasStatusPanel,
  SettingsLoadError,
} from './admin-settings-cards.parts';

import type { OpenRouterSettings, ProfessionAtlasSettings } from './admin-settings-cards.model';
import type { FormEvent } from 'react';

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
