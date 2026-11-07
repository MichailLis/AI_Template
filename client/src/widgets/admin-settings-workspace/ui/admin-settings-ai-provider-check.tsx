import { ShieldCheck } from 'lucide-react';

import { useCheckAiProvider } from '@/features/manage-app-settings';
import { formatDateTime } from '@/shared/lib/date-format';
import { adminClassNames, adminToneClassNames } from '@/shared/ui/admin-design-tokens';
import { Button } from '@/shared/ui/button';

import { aiCheckReasonLabels } from '../lib/admin-settings-cards.model';

import type { AiProviderCheck } from '../lib/admin-settings-cards.model';

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
  const { check, isChecking, result } = useCheckAiProvider();

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
        <Button type="button" variant="outline" size="sm" disabled={isChecking} onClick={check}>
          <ShieldCheck className="h-4 w-4" />
          {isChecking ? 'Проверяем...' : 'Проверить ключ и баланс'}
        </Button>
      </div>
      {result ? <AiProviderCheckResult result={result} /> : null}
    </div>
  );
}
