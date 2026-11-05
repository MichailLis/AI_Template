import { formatDateTime } from '@/shared/lib/date-format';

/**
 * Окно доступа публичной ссылки (#175). В форме оно живет как локальное время браузера в виде
 * `ГГГГ-ММ-ДДTЧЧ:мм` — это значение `RuDateInput` в режиме `datetime`. На сервер уходит ISO UTC с
 * `Z`: сервер принимает только такой формат.
 */
export interface AccessWindowValues {
  startsAt: string;
  endsAt: string;
}

export type AccessWindowField = keyof AccessWindowValues;

export interface AccessWindowRange {
  startsAt: string | null;
  endsAt: string | null;
}

export type AccessWindowStatusTone = 'upcoming' | 'open' | 'closed';

export interface AccessWindowStatus {
  tone: AccessWindowStatusTone;
  label: string;
}

const pad = (part: number) => part.toString().padStart(2, '0');

const toLocalInput = (iso: string | null) => {
  if (!iso) {
    return '';
  }

  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
};

export const toAccessWindowValues = (link: AccessWindowRange): AccessWindowValues => ({
  startsAt: toLocalInput(link.startsAt),
  endsAt: toLocalInput(link.endsAt),
});

/**
 * Если минута поля не менялась, уходит исходный ISO: иначе правка соседнего поля обрезала бы
 * секунды, записанные через API. Невалидное значение бросает RangeError: тихо сбрасывать окно
 * нельзя.
 */
const toIso = (local: string, original: string | null) => {
  if (!local) {
    return null;
  }

  if (original && local === toLocalInput(original)) {
    return original;
  }

  return new Date(local).toISOString();
};

export const buildAccessWindowPayload = (
  values: AccessWindowValues,
  original: AccessWindowRange = { startsAt: null, endsAt: null },
): AccessWindowRange => ({
  startsAt: toIso(values.startsAt, original.startsAt),
  endsAt: toIso(values.endsAt, original.endsAt),
});

/** Текст ошибки порядка дат или null. Совпадает с проверкой сервера `endsAt > startsAt`. */
export const validateAccessWindow = (values: AccessWindowValues): string | null => {
  if (!values.startsAt || !values.endsAt) {
    return null;
  }

  return new Date(values.endsAt).getTime() > new Date(values.startsAt).getTime()
    ? null
    : 'Время «Закрыть в» должно быть позже «Открыть с».';
};

/**
 * Статус окна для списка ссылок. Границы те же, что у `ensurePublicLinkAccessible`: до
 * `startsAt` ссылка закрыта, после `endsAt` (строго) — истекла. Окно без `endsAt` статуса не имеет.
 */
export const getAccessWindowStatus = (
  link: AccessWindowRange,
  now: Date,
): AccessWindowStatus | null => {
  const current = now.getTime();

  if (link.startsAt && current < new Date(link.startsAt).getTime()) {
    return { tone: 'upcoming', label: `Откроется ${formatDateTime(link.startsAt)}` };
  }

  if (!link.endsAt) {
    return null;
  }

  if (current > new Date(link.endsAt).getTime()) {
    return { tone: 'closed', label: `Закрыта ${formatDateTime(link.endsAt)}` };
  }

  return { tone: 'open', label: `Открыта до ${formatDateTime(link.endsAt)}` };
};
