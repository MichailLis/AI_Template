export const FALLBACK_TIME_ZONE = 'UTC';

/** IANA-пояс клиента; пустой или неизвестный пояс — UTC. */
export const resolveTimeZone = (value?: string | null): string => {
  if (!value) return FALLBACK_TIME_ZONE;

  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: value }).resolvedOptions().timeZone;
  } catch {
    return FALLBACK_TIME_ZONE;
  }
};

const getOffsetMs = (instant: number, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(instant));
  const part = (type: string) => Number(parts.find((item) => item.type === type)?.value);
  const wallClockAsUtc = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );

  return wallClockAsUtc - Math.floor(instant / 1000) * 1000;
};

/**
 * Момент, когда в поясе `timeZone` на часах `date` (YYYY-MM-DD) и время `hms`.
 * shortcut: в «пропавший» час перевода часов даёт ближайший существующий момент, не бросает.
 */
export const zonedTimeToInstant = (date: string, hms: string, timeZone: string): Date => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second, ms] = hms.split(':').map(Number);
  const wallClockAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, ms);
  const firstGuess = wallClockAsUtc - getOffsetMs(wallClockAsUtc, timeZone);

  return new Date(wallClockAsUtc - getOffsetMs(firstGuess, timeZone));
};

export const getZonedDayStart = (date: string, timeZone: string) =>
  zonedTimeToInstant(date, '0:0:0:0', timeZone);

export const getZonedDayEnd = (date: string, timeZone: string) =>
  zonedTimeToInstant(date, '23:59:59:999', timeZone);

/** Дата, чьи UTC-поля равны местному времени: exceljs пишет Date по UTC, Excel покажет местное. */
export const toZonedWallClock = (instant: Date, timeZone: string): Date =>
  new Date(instant.getTime() + getOffsetMs(instant.getTime(), timeZone));

export const formatInTimeZone = (value: string | Date, timeZone: string): string =>
  new Intl.DateTimeFormat('ru-RU', {
    timeZone,
    hourCycle: 'h23',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
