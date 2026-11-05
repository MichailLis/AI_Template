import { ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import { useAdminSettingsControllerCheckAiProvider } from '@/shared/api/generated/admin/admin';
import { getApiErrorMessage } from '@/shared/lib/api-error';
import { formatDateTime } from '@/shared/lib/date-format';
import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

import { aiCheckReasonLabels } from './admin-settings-cards.model';

import type { AiProviderCheck } from './admin-settings-cards.model';

function AiProviderCheckResult({ result }: { result: AiProviderCheck }) {
  const checkedAt = formatDateTime(result.checkedAt);

  if (result.status === 'ok') {
    return (
      <div
        role="status"
        className={`rounded-md border px-3 py-2 text-sm ${adminToneClassNames.success.active}`}
      >
        Запрос к модели {result.model} выполнен: ключ принят, средств хватило · {checkedAt}
      </div>
    );
  }

  return (
    <div role="alert" className={adminClassNames.panel.dangerInline}>
      <p className="font-medium">
        Запрос к модели {result.model} не прошёл
        {result.httpStatus ? ` (HTTP ${result.httpStatus})` : ''} · {checkedAt}
      </p>
      <p className="mt-1">{aiCheckReasonLabels[result.reason ?? 'UNKNOWN']}</p>
      {result.errorMessage ? (
        <p className="mt-1 break-words font-mono text-xs">
          Ответ провайдера: {result.errorMessage}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Настоящая проверка связи. Бейдж в шапке видит только каталог моделей, который Polza отдаёт и без
 * валидного ключа, поэтому ключ и баланс проверяет один пробный запрос к модели. Он платный (один
 * токен) и потому идёт только по кнопке, не при открытии настроек.
 */
export function AiProviderCheck() {
  const mutation = useAdminSettingsControllerCheckAiProvider({
    mutation: {
      onError: (error) => {
        toast.error(getApiErrorMessage(error, { fallbackMessage: 'Проверка не выполнена' }));
      },
    },
  });

  return (
    <div className={`flex flex-col gap-3 ${adminClassNames.panel.compactSection}`}>
      <div>
        <p className={`text-sm font-medium ${adminClassNames.text.heading}`}>
          Проверка ключа и баланса
        </p>
        <p className={`mt-1 text-sm ${adminClassNames.text.muted}`}>
          Бейдж вверху показывает только, что провайдер отдаёт каталог моделей: так бывает и при
          отозванном ключе или пустом балансе. Кнопка отправляет один настоящий запрос на один токен
          к модели по умолчанию с сохранёнными настройками. Запрос платный, поэтому выполняется
          только по нажатию.
        </p>
      </div>
      <div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          <ShieldCheck className="h-4 w-4" />
          {mutation.isPending ? 'Проверяем...' : 'Проверить ключ и баланс'}
        </Button>
      </div>
      {mutation.data ? <AiProviderCheckResult result={mutation.data} /> : null}
    </div>
  );
}
