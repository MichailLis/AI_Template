import { describe, expect, it } from 'vitest';

import { parseAnalysisResult } from './test-analysis-result-parser';

const structuredAnalysis = {
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
};

describe('parseAnalysisResult', () => {
  it('keeps the top-level introduction for new structured analysis', () => {
    expect(parseAnalysisResult(structuredAnalysis)).toMatchObject({
      introduction: structuredAnalysis.introduction,
    });
  });

  it('keeps legacy analysis without introduction renderable', () => {
    const legacyAnalysis: Record<string, unknown> = { ...structuredAnalysis };
    delete legacyAnalysis.introduction;

    expect(parseAnalysisResult(legacyAnalysis)).toMatchObject({
      introduction: expect.any(String),
      skillsLevel: expect.objectContaining({
        title: 'Базовые навыки',
      }),
    });
  });
});
