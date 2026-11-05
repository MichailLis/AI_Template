import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PolusProfOrientationResult } from '../polus/polus-prof-orientation-result';

import { ProfOrientationResult } from './prof-orientation-result';

import type { ProfOrientationSummary } from './prof-orientation-summary';

const summary: ProfOrientationSummary = {
  resultKind: 'prof_orientation_v3_plus',
  primaryDirection: {
    id: 'A1',
    name: '3D-моделирование',
    score: 54.2,
    resultCard: {
      headline: 'Профиль: проектирование',
      meaning: 'Тебе ближе цифровая модель.',
      fitsIf: ['интересно работать в CAD'],
      tryActions: ['смоделировать корпус'],
      learn: [],
      miniProject: 'Смоделируй корпус.',
    },
    professions: [{ code: '201524', title: 'Инженер-конструктор' }],
  },
  topDirections: [],
  confidence: { label: 'высокая' },
  profile: {
    type: 'single_profile',
    title: '3D-моделирование',
    meaning: 'Алгоритмический профиль.',
    miniProject: null,
  },
  llm: { status: 'not_requested', analysis: null },
  atlas: null,
};

describe('ProfOrientationResult', () => {
  it('has no theme of its own: neutral banner and no POLUS markup', () => {
    const { container } = render(<ProfOrientationResult summary={summary} />);

    expect(screen.getByRole('heading', { name: 'Профиль: проектирование' })).toBeInTheDocument();
    expect(container.querySelector('.prof-result-hero')).toBeInTheDocument();
    expect(container.querySelector('[class*="polus-"]')).not.toBeInTheDocument();
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('lets a themed wrapper replace the banner and keeps the rest', () => {
    const { container } = render(
      <ProfOrientationResult
        summary={summary}
        renderHero={({ headline }) => <h1 data-testid="custom-hero">{headline}</h1>}
      />,
    );

    expect(screen.getByTestId('custom-hero')).toHaveTextContent('Профиль: проектирование');
    expect(container.querySelector('.prof-result-hero')).not.toBeInTheDocument();
    expect(screen.getAllByText('Инженер-конструктор').length).toBeGreaterThan(0);
  });
});

describe('PolusProfOrientationResult', () => {
  it('puts the professor in the banner of the shared result', () => {
    const { container } = render(<PolusProfOrientationResult summary={summary} />);

    expect(container.querySelector('.polus-result-hero')).toBeInTheDocument();
    expect(container.textContent).toContain('Профессор Полюс говорит');
    expect(container.querySelector('.prof-result-hero')).not.toBeInTheDocument();
    expect(screen.getAllByText('Инженер-конструктор').length).toBeGreaterThan(0);
  });
});
