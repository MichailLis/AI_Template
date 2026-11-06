import { describe, expect, it } from 'vitest';

import {
  resolveEffectiveAnalyticsTopicId,
  resolveEffectiveTopicId,
} from './resolve-effective-topic-id';

const draft = (id: number) => ({ id, publishedVersionNumber: null });
const published = (id: number) => ({ id, publishedVersionNumber: 1 });

/**
 * Находка аудита UX-14: мастер создания ссылки по умолчанию выбирал первый тест списка — чаще всего
 * свежий черновик без публикации — и сразу показывал предупреждение вместо рабочего выбора.
 */
describe('resolveEffectiveTopicId', () => {
  it('defaults to the first published test, not to a draft listed above it', () => {
    expect(resolveEffectiveTopicId(null, [draft(5), published(7), published(9)])).toBe(7);
  });

  it('keeps the test the admin picked, even an unpublished one', () => {
    expect(resolveEffectiveTopicId(5, [draft(5), published(7)])).toBe(5);
  });

  it('falls back to the first test when none is published yet', () => {
    expect(resolveEffectiveTopicId(null, [draft(5), draft(6)])).toBe(5);
  });

  it('returns 0 when there are no tests', () => {
    expect(resolveEffectiveTopicId(null, [])).toBe(0);
  });
});

describe('resolveEffectiveAnalyticsTopicId', () => {
  it('keeps the selected topic, otherwise the first one', () => {
    expect(resolveEffectiveAnalyticsTopicId(2, [{ id: 1 }, { id: 2 }])).toBe(2);
    expect(resolveEffectiveAnalyticsTopicId(9, [{ id: 1 }, { id: 2 }])).toBe(1);
  });

  it('returns null when there are no topics', () => {
    expect(resolveEffectiveAnalyticsTopicId(null, [])).toBeNull();
  });
});
