import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { PolusResultHero } from './polus-result-hero';

/**
 * Both Polus result screens render this banner. They used to hold a copy each, so the accessibility
 * attributes below were duplicated markup that only one of the two would have been fixed in.
 */
describe('PolusResultHero', () => {
  // vitest runs without `globals`, so testing-library's auto-cleanup is not registered.
  afterEach(cleanup);

  const renderHero = () =>
    render(<PolusResultHero headline="Ваш профиль" professorSummary="Короткое описание" />);

  it('shows the headline as the page heading', () => {
    renderHero();

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ваш профиль');
  });

  it('shows the professor summary', () => {
    renderHero();

    expect(screen.getByText('Короткое описание')).toBeInTheDocument();
  });

  it('labels the banner for screen readers', () => {
    const { container } = renderHero();

    expect(
      container.querySelector('[aria-label="Профессор Полюс рассказывает результат"]'),
    ).not.toBeNull();
  });

  it('hides the decorative professor figure from screen readers', () => {
    const { container } = renderHero();

    const decoration = container.querySelector('.polus-result-professor');

    expect(decoration).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.polus-result-professor-figure')).toHaveAttribute('alt', '');
  });
});
