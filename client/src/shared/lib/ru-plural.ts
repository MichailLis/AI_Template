/**
 * Русские числовые формы: «1 ссылка», «2 ссылки», «5 ссылок».
 *
 * Формы передаются в порядке [одна, две-четыре, пять и больше]. Числа от 11 до 14 берут последнюю
 * форму, несмотря на последнюю цифру: «11 ссылок», а не «11 ссылка».
 */
export type RuPluralForms = readonly [one: string, few: string, many: string];

export const pluralizeRu = (count: number, forms: RuPluralForms) => {
  const absoluteCount = Math.abs(Math.trunc(count));
  const lastTwoDigits = absoluteCount % 100;
  const lastDigit = absoluteCount % 10;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return forms[2];
  }

  if (lastDigit === 1) {
    return forms[0];
  }

  if (lastDigit >= 2 && lastDigit <= 4) {
    return forms[1];
  }

  return forms[2];
};
