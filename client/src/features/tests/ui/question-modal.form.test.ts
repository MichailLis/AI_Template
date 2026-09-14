import { describe, expect, it } from 'vitest';

import { getOverlappingSliderBandIds } from './question-modal.form';

describe('getOverlappingSliderBandIds', () => {
  it('returns empty set when bands do not overlap', () => {
    const overlapping = getOverlappingSliderBandIds([
      { id: 'b1', minValue: '1', maxValue: '3', label: 'Низко', weight: '1' },
      { id: 'b2', minValue: '4', maxValue: '7', label: 'Средне', weight: '2' },
      { id: 'b3', minValue: '8', maxValue: '10', label: 'Высоко', weight: '3' },
    ]);

    expect(overlapping.size).toBe(0);
  });

  it('detects overlapping bands and returns their IDs', () => {
    const overlapping = getOverlappingSliderBandIds([
      { id: 'b1', minValue: '0', maxValue: '5', label: 'Низко', weight: '1' },
      { id: 'b2', minValue: '3', maxValue: '10', label: 'Высоко', weight: '3' },
    ]);

    expect(overlapping).toEqual(new Set(['b1', 'b2']));
  });

  it('detects boundary overlap (e.g. 0-5 and 5-10)', () => {
    const overlapping = getOverlappingSliderBandIds([
      { id: 'b1', minValue: '0', maxValue: '5', label: 'Низко', weight: '1' },
      { id: 'b2', minValue: '5', maxValue: '10', label: 'Высоко', weight: '3' },
    ]);

    expect(overlapping).toEqual(new Set(['b1', 'b2']));
  });

  it('ignores invalid or empty bands during detection', () => {
    const overlapping = getOverlappingSliderBandIds([
      { id: 'b1', minValue: '', maxValue: '', label: '', weight: '' },
      { id: 'b2', minValue: '1', maxValue: '3', label: 'Низко', weight: '1' },
      { id: 'b3', minValue: '5', maxValue: '2', label: 'Некорректно', weight: '1' },
    ]);

    expect(overlapping.size).toBe(0);
  });
});
