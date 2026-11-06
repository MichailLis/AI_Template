import type { ShareItem } from '../reporting/analytics.types';

export type CountRecord = {
  label: string;
  count: number;
};

export const round1 = (value: number) => Math.round(value * 10) / 10;

export const toShare = (count: number, total: number) =>
  total === 0 ? 0 : round1((count / total) * 100);

export const buildCountShares = (counts: Map<string, CountRecord>, total: number): ShareItem[] =>
  Array.from(counts.entries())
    .map(([id, value]) => ({
      id,
      label: value.label,
      count: value.count,
      share: toShare(value.count, total),
    }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));
