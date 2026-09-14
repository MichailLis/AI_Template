/**
 * Ввод даты в формате ДД.ММ.ГГГГ вместо нативного `<input type="date">`.
 *
 * Нативное поле берёт маску из языка интерфейса браузера, а не из страницы: в англоязычном Chromium
 * это `mm/dd/yyyy` даже при `lang="ru"`, и 06/09 путается с 09/06. Здесь формат фиксирован, а наружу
 * отдаётся та же ISO-дата `ГГГГ-ММ-ДД`, что и у нативного поля, поэтому контракт фильтров не меняется.
 */

const DATE_DIGITS = 8;

/** Оставляет цифры и расставляет точки по мере ввода: `0609` → `06.09`. */
export const maskRuDateInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, DATE_DIGITS);
  const parts = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, DATE_DIGITS)];

  return parts.filter((part, index) => index === 0 || part.length > 0).join('.');
};

/**
 * Полная дата `ДД.ММ.ГГГГ` → `ГГГГ-ММ-ДД`; всё остальное — `null`.
 *
 * Дата проверяется обратной сверкой: `Date` молча переносит 31 февраля на 3 марта, поэтому
 * несуществующий день или месяц видно по несовпадению разобранных частей.
 */
export const parseRuDate = (value: string): string | null => {
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, dayText, monthText, yearText] = match;
  const day = Number(dayText);
  const month = Number(monthText);
  const year = Number(yearText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return `${yearText}-${monthText}-${dayText}`;
};

/** `ГГГГ-ММ-ДД` → `ДД.ММ.ГГГГ`; пустое или некорректное значение показывается пустой строкой. */
export const formatIsoDateAsRu = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  return match ? `${match[3]}.${match[2]}.${match[1]}` : '';
};

const DATE_TIME_DIGITS = DATE_DIGITS + 4;

/**
 * Маска даты со временем `ДД.ММ.ГГГГ ЧЧ:ММ` для замены `<input type="datetime-local">`, у которого та
 * же зависимость от языка браузера. Дата маскируется так же, как в поле без времени.
 */
export const maskRuDateTimeInput = (raw: string) => {
  const digits = raw.replace(/\D/g, '').slice(0, DATE_TIME_DIGITS);
  const datePart = maskRuDateInput(digits.slice(0, DATE_DIGITS));
  const hours = digits.slice(DATE_DIGITS, DATE_DIGITS + 2);
  const minutes = digits.slice(DATE_DIGITS + 2, DATE_TIME_DIGITS);

  if (!hours) {
    return datePart;
  }

  return minutes ? `${datePart} ${hours}:${minutes}` : `${datePart} ${hours}`;
};

/** Полные `ДД.ММ.ГГГГ ЧЧ:ММ` → значение `datetime-local` `ГГГГ-ММ-ДДTЧЧ:мм`; всё остальное — `null`. */
export const parseRuDateTime = (value: string): string | null => {
  const match = /^(\d{2}\.\d{2}\.\d{4}) (\d{2}):(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const [, datePart, hoursText, minutesText] = match;
  const isoDate = parseRuDate(datePart);

  if (!isoDate || Number(hoursText) > 23 || Number(minutesText) > 59) {
    return null;
  }

  return `${isoDate}T${hoursText}:${minutesText}`;
};

/** Значение `datetime-local` → `ДД.ММ.ГГГГ ЧЧ:ММ`; значение без времени показывается пустой строкой. */
export const formatIsoDateTimeLocalAsRu = (value: string) => {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/.exec(value);

  return match ? `${formatIsoDateAsRu(match[1])} ${match[2]}:${match[3]}` : '';
};
