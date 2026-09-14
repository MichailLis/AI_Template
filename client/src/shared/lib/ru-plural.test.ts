import { describe, expect, it } from 'vitest';

import { pluralizeRu } from './ru-plural';

describe('pluralizeRu', () => {
  const forms = ['ссылка', 'ссылки', 'ссылок'] as const;

  it('picks the singular form for counts ending in one', () => {
    expect(pluralizeRu(1, forms)).toBe('ссылка');
    expect(pluralizeRu(21, forms)).toBe('ссылка');
    expect(pluralizeRu(101, forms)).toBe('ссылка');
  });

  it('picks the few form for counts ending in two to four', () => {
    expect(pluralizeRu(2, forms)).toBe('ссылки');
    expect(pluralizeRu(3, forms)).toBe('ссылки');
    expect(pluralizeRu(4, forms)).toBe('ссылки');
    expect(pluralizeRu(22, forms)).toBe('ссылки');
  });

  it('picks the many form for counts ending in five to nine and zero', () => {
    expect(pluralizeRu(0, forms)).toBe('ссылок');
    expect(pluralizeRu(5, forms)).toBe('ссылок');
    expect(pluralizeRu(9, forms)).toBe('ссылок');
    expect(pluralizeRu(20, forms)).toBe('ссылок');
  });

  it('picks the many form for the teens, where the last digit misleads', () => {
    expect(pluralizeRu(11, forms)).toBe('ссылок');
    expect(pluralizeRu(12, forms)).toBe('ссылок');
    expect(pluralizeRu(14, forms)).toBe('ссылок');
    expect(pluralizeRu(111, forms)).toBe('ссылок');
    expect(pluralizeRu(112, forms)).toBe('ссылок');
  });
});
