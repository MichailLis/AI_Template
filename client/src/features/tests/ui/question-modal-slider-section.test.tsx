import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QuestionModalSliderSection } from './question-modal-slider-section';

describe('QuestionModalSliderSection (FLOW-12)', () => {
  afterEach(cleanup);

  it('renders without overlap warnings for valid bands', () => {
    render(
      <QuestionModalSliderSection
        sliderMin="1"
        sliderMax="10"
        sliderStep="1"
        sliderBands={[
          { id: 'b1', minValue: '1', maxValue: '3', label: 'Низко', weight: '1' },
          { id: 'b2', minValue: '4', maxValue: '7', label: 'Средне', weight: '2' },
          { id: 'b3', minValue: '8', maxValue: '10', label: 'Высоко', weight: '3' },
        ]}
        onUpdateSliderScale={vi.fn()}
        onAddSliderBand={vi.fn()}
        onUpdateSliderBand={vi.fn()}
        onRemoveSliderBand={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(
        'Обнаружены пересекающиеся диапазоны слайдера. Исправьте границы перед сохранением.',
      ),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Диапазон пересекается с другим диапазоном')).not.toBeInTheDocument();
  });

  it('highlights overlapping bands and displays warning banner when ranges overlap', () => {
    render(
      <QuestionModalSliderSection
        sliderMin="0"
        sliderMax="10"
        sliderStep="1"
        sliderBands={[
          { id: 'b1', minValue: '0', maxValue: '5', label: 'Низко', weight: '3' },
          { id: 'b2', minValue: '3', maxValue: '10', label: 'Высоко', weight: '1' },
        ]}
        onUpdateSliderScale={vi.fn()}
        onAddSliderBand={vi.fn()}
        onUpdateSliderBand={vi.fn()}
        onRemoveSliderBand={vi.fn()}
      />,
    );

    expect(
      screen.getByText(
        'Обнаружены пересекающиеся диапазоны слайдера. Исправьте границы перед сохранением.',
      ),
    ).toBeInTheDocument();
    const rowWarnings = screen.getAllByText('Диапазон пересекается с другим диапазоном');
    expect(rowWarnings).toHaveLength(2);
  });

  it('highlights scale inputs and displays warning when minimum is greater than or equal to maximum (UX-19)', () => {
    render(
      <QuestionModalSliderSection
        sliderMin="15"
        sliderMax="10"
        sliderStep="1"
        sliderBands={[]}
        onUpdateSliderScale={vi.fn()}
        onAddSliderBand={vi.fn()}
        onUpdateSliderBand={vi.fn()}
        onRemoveSliderBand={vi.fn()}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Минимум шкалы должен быть меньше максимума',
    );
    expect(screen.getByLabelText('Минимум')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Максимум')).toHaveAttribute('aria-invalid', 'true');
  });
});
