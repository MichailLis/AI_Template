import { useQueryClient } from '@tanstack/react-query';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import {
  getAdminSettingsControllerGetAiProviderSettingsQueryKey,
  useAdminSettingsControllerUpdateAiProviderSettings,
} from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { adminClassNames } from '@/shared/ui/admin-design-tokens';
import { AdminSelectField } from '@/shared/ui/admin-select-field';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { AiProviderSettings } from './admin-settings-cards.model';
import type { FormEvent } from 'react';

type ProviderId = AiProviderSettings['provider'];

const PROVIDER_OPTIONS: Array<{ value: ProviderId; label: string; baseUrlHint: string }> = [
  { value: 'polza', label: 'Polza.ai', baseUrlHint: 'https://polza.ai/api/v1' },
  { value: 'openrouter', label: 'OpenRouter', baseUrlHint: 'https://openrouter.ai/api/v1' },
  {
    value: 'openai-compatible',
    label: 'Другой OpenAI-совместимый API',
    baseUrlHint: 'https://api.example.com/v1',
  },
];

/**
 * Форма провайдера ИИ. Состояние берётся из загруженных настроек один раз при монтировании:
 * после сохранения родитель перемонтирует форму по `key`. Ключ в форму не возвращается, поле
 * пустое, пока админ не введёт новый.
 */
export function AiProviderForm({ aiProvider }: { aiProvider: AiProviderSettings }) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<ProviderId>(aiProvider.provider);
  const [baseUrl, setBaseUrl] = useState(aiProvider.baseUrl ?? '');
  const [apiKey, setApiKey] = useState('');
  const [defaultModel, setDefaultModel] = useState(aiProvider.defaultModel ?? '');
  const [clearApiKey, setClearApiKey] = useState(false);

  const mutation = useAdminSettingsControllerUpdateAiProviderSettings({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, { fallbackMessage: 'Запрос не выполнен' }));
      },
      onSuccess: async () => {
        setApiKey('');
        setClearApiKey(false);
        await queryClient.invalidateQueries({
          queryKey: getAdminSettingsControllerGetAiProviderSettingsQueryKey(),
        });
        toast.success('Настройки провайдера ИИ сохранены');
      },
    },
  });

  const selected = PROVIDER_OPTIONS.find((option) => option.value === provider);
  const isBaseUrlRequired = provider === 'openai-compatible';
  const canSubmit = !mutation.isPending && (!isBaseUrlRequired || baseUrl.trim().length > 0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    mutation.mutate({
      data: {
        provider,
        baseUrl: baseUrl.trim() || null,
        defaultModel: defaultModel.trim() || null,
        ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
        ...(clearApiKey && !apiKey.trim() ? { clearApiKey: true } : {}),
      },
    });
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-provider-id">Провайдер</Label>
        <AdminSelectField
          id="ai-provider-id"
          value={provider}
          onChange={(event) => setProvider(event.target.value as ProviderId)}
        >
          {PROVIDER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </AdminSelectField>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-provider-base-url">Адрес API (base URL)</Label>
        <Input
          id="ai-provider-base-url"
          type="url"
          value={baseUrl}
          onChange={(event) => setBaseUrl(event.target.value)}
          placeholder={selected?.baseUrlHint}
          autoComplete="off"
          spellCheck={false}
        />
        <p className={adminClassNames.form.fieldHint}>
          {isBaseUrlRequired
            ? 'Обязателен: адрес, к которому добавляются /chat/completions и /models.'
            : `Можно оставить пустым: будет использован ${selected?.baseUrlHint}.`}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-provider-api-key">Ключ API</Label>
        <Input
          id="ai-provider-api-key"
          type="password"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={aiProvider.maskedValue ?? 'Вставьте ключ'}
          autoComplete="new-password"
          spellCheck={false}
        />
        <p className={adminClassNames.form.fieldHint}>
          Хранится в базе в зашифрованном виде и не показывается после сохранения. Пустое поле
          оставляет текущий ключ.
        </p>
        {aiProvider.source === 'DB' ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={clearApiKey}
              onChange={(event) => setClearApiKey(event.target.checked)}
            />
            Удалить сохранённый ключ (останется ключ из переменной окружения, если она задана)
          </label>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="ai-provider-default-model">Модель по умолчанию</Label>
        <Input
          id="ai-provider-default-model"
          value={defaultModel}
          onChange={(event) => setDefaultModel(event.target.value)}
          placeholder="openai/gpt-4o-mini"
          autoComplete="off"
          spellCheck={false}
        />
        <p className={adminClassNames.form.fieldHint}>
          Используется, если модели сохранённого промпта нет в каталоге провайдера.
        </p>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        <Save className="h-4 w-4" />
        {mutation.isPending ? 'Сохраняем...' : 'Сохранить настройки'}
      </Button>
    </form>
  );
}
