import { describe, expect, it } from 'vitest';

import indexHtml from '../../index.html?raw';

describe('app metadata', () => {
  it('uses student-facing browser tab metadata instead of Vite defaults', () => {
    expect(indexHtml).toContain('<title>Профориентационный тест</title>');
    expect(indexHtml).toContain('href="/favicon.svg"');
    expect(indexHtml).not.toContain('/vite.svg');
    expect(indexHtml).not.toContain('<title>client</title>');
  });
});
