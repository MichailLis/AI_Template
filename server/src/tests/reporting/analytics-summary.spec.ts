import { buildCountShares, toShare } from './analytics-summary';

describe('toShare', () => {
  it('returns share with 0.1% precision', () => {
    expect(toShare(1, 3)).toBe(33.3);
    expect(toShare(1, 0)).toBe(0);
  });
});

describe('buildCountShares', () => {
  it('builds share objects from counts and sorts by count then label', () => {
    const result = buildCountShares(
      new Map([
        ['B1', { label: 'B1', count: 1 }],
        ['A2', { label: 'A2', count: 2 }],
      ]),
      3,
    );
    expect(result).toEqual([
      { id: 'A2', label: 'A2', count: 2, share: 66.7 },
      { id: 'B1', label: 'B1', count: 1, share: 33.3 },
    ]);
  });
});
