import { getApiErrorCode, getApiErrorMessage } from '@/shared/lib/api-error';

interface PublicTestRefusal {
  title: string;
  description: string;
}

// Коды отдаёт публичный контур сервера (public-link-access.ts, attempt-allocation.service.ts).
const REFUSALS: Record<string, PublicTestRefusal> = {
  LINK_NOT_FOUND: {
    title: 'Ссылка не найдена',
    description: 'Проверьте адрес ссылки или обратитесь к тому, кто её выдал.',
  },
  LINK_DISABLED: {
    title: 'Тест сейчас недоступен',
    description: 'Ссылка отключена. Обратитесь к тому, кто её выдал.',
  },
  LINK_NOT_STARTED: {
    title: 'Тест ещё не открыт',
    description: 'Тестирование по этой ссылке ещё не началось. Вернитесь позже.',
  },
  LINK_EXPIRED: {
    title: 'Срок прохождения вышел',
    description: 'Эта ссылка больше не принимает прохождения.',
  },
  ATTEMPTS_LIMIT_REACHED: {
    title: 'Попытки закончились',
    description: 'Вы уже использовали все попытки в этом тесте.',
  },
  // Лимит start/finish по адресу (public-rate-limit.guard.ts): класс за одним NAT упёрся в настройку.
  RATE_LIMITED: {
    title: 'Слишком много запросов',
    description:
      'С вашей сети тест сейчас проходят очень многие. Подождите минуту и попробуйте снова.',
  },
};

const formatOpensAt = (startsAt: string) =>
  new Date(startsAt).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * `startsAt` — из уже загруженной ссылки (сервер в ошибке его не отдаёт): есть при отказе на старте,
 * нет, когда сама ссылка не загрузилась.
 */
export const getPublicTestRefusal = (
  error: unknown,
  fallback: PublicTestRefusal,
  startsAt?: string | null,
): PublicTestRefusal => {
  const code = getApiErrorCode(error);

  if (code === 'LINK_NOT_STARTED' && startsAt) {
    return {
      ...REFUSALS.LINK_NOT_STARTED,
      description: `Тест откроется ${formatOpensAt(startsAt)}.`,
    };
  }

  if (code === 'GROUP_FORMAT_INVALID') {
    // Подсказку формата пишет администратор заведения по-русски — её и показываем.
    return {
      title: 'Проверьте группу или класс',
      description: getApiErrorMessage(error, { fallbackMessage: fallback.description }),
    };
  }

  return (code && REFUSALS[code]) || fallback;
};
