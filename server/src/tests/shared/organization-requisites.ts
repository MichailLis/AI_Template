/**
 * Формат реквизитов учебного заведения: они попадают в данные оператора ПДн, которые видит ученик.
 * Клиентская копия: client/src/shared/lib/organization-requisites.ts.
 *
 * shortcut: проверяются длина и цифры, контрольные суммы нет; ОГРН из 15 цифр — ОГРНИП.
 * Добавить контрольную сумму, если опечатки в реквизитах продолжат проходить.
 */
export const isValidInn = (value: string) => /^(?:\d{10}|\d{12})$/.test(value);

export const isValidOgrn = (value: string) => /^(?:\d{13}|\d{15})$/.test(value);
