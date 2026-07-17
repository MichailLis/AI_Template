import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PolusResultHero } from '@/features/tests';

const assertAccessiblePolusHero = (hero: HTMLElement) => {
  expect(
    within(hero).getByText('Профессор Полюс говорит:', { selector: '.polus-speaker-label' }),
  ).toBeInTheDocument();
  expect(hero.querySelector('.polus-result-professor')).toHaveAttribute('aria-hidden', 'true');
  expect(hero.querySelector('img.polus-result-professor-figure')).toHaveAttribute('alt', '');
};

describe('PolusResultHero', () => {
  it('renders the shared accessible professor hero with caller-owned copy', () => {
    render(
      <PolusResultHero
        headline="Ваш профиль: исследователь инженерных решений"
        professorSummary="Соберите первые практические шаги и проверьте гипотезу на коротком проекте."
      />,
    );

    const hero = screen.getByLabelText('Профессор Полюс рассказывает результат');
    expect(
      within(hero).getByRole('heading', {
        name: 'Ваш профиль: исследователь инженерных решений',
      }),
    ).toBeInTheDocument();
    expect(
      within(hero).getByText(
        'Соберите первые практические шаги и проверьте гипотезу на коротком проекте.',
      ),
    ).toBeInTheDocument();
    assertAccessiblePolusHero(hero);
  });
});
