/**
 * Единый формат даты и времени для админки.
 *
 * Раньше форматов было четыре: `toLocaleString()` без локали (то есть локаль браузера — на
 * англоязычной машине админ видел `9/6/2026, 6:36:12 PM` в таблицах и `06.09.2026` рядом),
 * `dd.MM.yyyy HH:mm` в двух местах, `dateStyle: medium` в настройках и `dd.MM HH:mm` без года в
 * списке тестов — тест, обновленный год назад, выглядел как обновленный вчера.
 *
 * Локаль зафиксирована: интерфейс русскоязычный, и дата не должна зависеть от настроек браузера.
 */
const LOCALE = 'ru-RU';

/** IANA-пояс браузера: сервер считает по нему границы дня и время в выгрузках. */
export const getBrowserTimeZone = (): string | undefined =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const preciseFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const dateOnlyFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const timeOnlyFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
});

const format = (value: string, formatter: Intl.DateTimeFormat) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return formatter.format(date);
};

/** Основной формат: `06.09.2026, 18:36`. Подходит спискам, таблицам и карточкам. */
export const formatDateTime = (value: string) => format(value, dateTimeFormatter);

/** С секундами: нужен там, где события идут подряд, — например у прохождений одного студента. */
export const formatDateTimePrecise = (value: string) => format(value, preciseFormatter);

/** Только дата: для полей вроде даты публикации политики. */
export const formatDate = (value: string) => format(value, dateOnlyFormatter);

/**
 * Только время, `23:00:56`: для журналов в пределах одного дня, например запусков симуляции
 * промпта. Без фиксированной локали `toLocaleTimeString()` давал `11:00:56 PM`.
 */
export const formatTime = (value: string) => format(value, timeOnlyFormatter);

export const formatDateTimeOrDash = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return '—';
  }

  return formatDateTime(value);
};

export const formatDateTimePreciseOrDash = (value: string | null | undefined) => {
  if (value === null || value === undefined) {
    return '—';
  }

  return formatDateTimePrecise(value);
};

/** Длительность в секундах: `45 с`, `12 мин 05 с`, `1 ч 02 мин`. Для прохождений теста. */
export const formatDurationSeconds = (totalSeconds: number | null | undefined) => {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds)) {
    return '—';
  }

  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;

  if (hours > 0) {
    return `${hours} ч ${String(minutes).padStart(2, '0')} мин`;
  }

  if (minutes > 0) {
    return `${minutes} мин ${String(rest).padStart(2, '0')} с`;
  }

  return `${rest} с`;
};
