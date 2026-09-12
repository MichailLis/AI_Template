import { describe, expect, it } from 'vitest';

import {
  ATTEMPTS_LIMIT,
  buildAnalyticsParams,
  readLimit,
  readNumber,
  readTab,
  resolveAnalyticsTab,
} from './use-admin-public-links-stats-workspace.model';

describe('analytics selection read from the query string', () => {
  it('keeps the active scope unless the archive is explicitly requested', () => {
    expect(readTab('archived')).toBe('archived');
    expect(readTab('active')).toBe('active');
    expect(readTab(null)).toBe('active');
    expect(readTab('что-то')).toBe('active');
  });

  it('accepts only positive integers as identifiers', () => {
    expect(readNumber('1007')).toBe(1007);
    expect(readNumber('0')).toBeNull();
    expect(readNumber('-4')).toBeNull();
    expect(readNumber('abc')).toBeNull();
    expect(readNumber(null)).toBeNull();
  });

  it('falls back to the default page size for values outside the offered options', () => {
    expect(readLimit('25')).toBe(25);
    expect(readLimit('50')).toBe(50);
    expect(readLimit('1000')).toBe(ATTEMPTS_LIMIT);
    expect(readLimit(null)).toBe(ATTEMPTS_LIMIT);
  });

  it('opens the report tab for anything but the attempts value', () => {
    expect(resolveAnalyticsTab('attempts')).toBe('attempts');
    expect(resolveAnalyticsTab('report')).toBe('report');
    expect(resolveAnalyticsTab(null)).toBe('report');
  });
});

describe('analytics report query parameters', () => {
  /**
   * Находка аудита UX-08: фильтр «Ссылки в отчете» применялся и к отчёту по одной ссылке, поэтому
   * архивная ссылка при выбранных «Активных» давала пустой отчёт без объяснения.
   */
  it('does not narrow a one-link report by the link status filter', () => {
    expect(
      buildAnalyticsParams({
        scope: 'PUBLIC_LINK',
        publicLinkId: 22,
        linkStatus: 'ACTIVE',
        dateFrom: '',
        dateTo: '',
      }),
    ).toEqual({ scope: 'PUBLIC_LINK', publicLinkId: 22, linkStatus: 'ALL' });
  });

  it('keeps the link status filter for a whole-test report', () => {
    expect(
      buildAnalyticsParams({
        scope: 'TOPIC',
        publicLinkId: 22,
        linkStatus: 'ARCHIVED',
        dateFrom: '2026-09-01',
        dateTo: '',
      }),
    ).toEqual({ scope: 'TOPIC', linkStatus: 'ARCHIVED', dateFrom: '2026-09-01' });
  });
});
