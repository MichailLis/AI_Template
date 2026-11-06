import { describe, expect, it } from 'vitest';

import { resolveEffectivePublicLinkId } from './resolve-effective-public-link-id';

describe('resolveEffectivePublicLinkId', () => {
  it('keeps the selected link when it is listed', () => {
    expect(resolveEffectivePublicLinkId(2, [{ id: 1 }, { id: 2 }])).toBe(2);
  });

  it('falls back to the first link when the selection is missing or stale', () => {
    expect(resolveEffectivePublicLinkId(null, [{ id: 1 }, { id: 2 }])).toBe(1);
    expect(resolveEffectivePublicLinkId(9, [{ id: 1 }, { id: 2 }])).toBe(1);
  });

  it('returns null for an empty list', () => {
    expect(resolveEffectivePublicLinkId(1, [])).toBeNull();
  });
});
