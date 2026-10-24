/**
 * Формат реквизитов учебного заведения. Серверная копия авторитетна:
 * server/src/tests/shared/organization-requisites.ts.
 */
export const isValidInn = (value: string) => /^(?:\d{10}|\d{12})$/.test(value);

export const isValidOgrn = (value: string) => /^(?:\d{13}|\d{15})$/.test(value);
