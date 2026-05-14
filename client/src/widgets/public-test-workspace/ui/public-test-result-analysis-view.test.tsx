import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PublicTestResultAnalysisView } from './public-test-result-analysis-view';

const readyAnalysis = {
  providerMode: 'LLM',
  status: 'READY',
  summary: {
    introduction:
      'По результатам теста виден устойчивый интерес к практическим задачам и постепенному развитию профессиональных навыков.',
    skillsLevel: {
      title: 'Базовые навыки',
      summary: 'Навыки развиты на среднем уровне.',
      items: [
        {
          name: 'Коммуникация',
          level: 'medium',
          score: 68,
          description: 'Умеет объяснять решения.',
        },
      ],
    },
    thinkingType: {
      title: 'Тип мышления',
      type: 'Аналитический',
      description: 'Сначала ищет структуру.',
      strengths: ['структурность'],
    },
    personalityTraits: {
      title: 'Личностные особенности',
      traits: [
        {
          name: 'Самостоятельность',
          description: 'Берет ответственность за задачи.',
          careerImpact: 'Подходит для самостоятельных ролей.',
        },
      ],
    },
    careerDevelopment: {
      summary: 'Стоит развивать портфолио.',
      recommendedDirections: ['аналитика'],
      developmentRecommendations: ['делать мини-проекты'],
      professionalNextSteps: ['получить обратную связь'],
    },
  },
  rawText: null,
  errorMessage: null,
  generatedAt: '2026-05-12T12:00:01.000Z',
};

describe('PublicTestResultAnalysisView', () => {
  it('renders introduction before detailed analysis sections', () => {
    render(<PublicTestResultAnalysisView analysis={readyAnalysis} />);

    const introductionHeading = screen.getByRole('heading', { name: 'Введение' });
    const skillsHeading = screen.getByRole('heading', { name: 'Базовые навыки' });

    expect(screen.getByText(/устойчивый интерес к практическим задачам/i)).toBeInTheDocument();
    expect(
      introductionHeading.compareDocumentPosition(skillsHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
