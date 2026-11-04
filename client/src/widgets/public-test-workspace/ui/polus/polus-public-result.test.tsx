import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PolusPublicResult } from './polus-public-result';

import type { PublicAiAnalysisSummary, PublicSessionResultResponseDto } from '@/shared/api/model';

type SkillItem = PublicAiAnalysisSummary['skillsLevel']['items'][number];

const buildResult = (items: SkillItem[], type: string): PublicSessionResultResponseDto => ({
  sessionToken: 't',
  publicTemplate: 'POLUS',
  publicBranding: null,
  status: 'COMPLETED',
  finishedAt: null,
  professionAtlasUrl: null,
  analysis: {
    providerMode: 'LLM',
    status: 'READY',
    errorMessage: null,
    generatedAt: null,
    summary: {
      resultKind: 'ai_analysis',
      introduction: 'Введение',
      skillsLevel: { title: 'Навыки', summary: 'Сводка', items },
      thinkingType: { title: 'Мышление', type, description: 'Описание', strengths: ['Сила'] },
      personalityTraits: {
        title: 'Черты',
        traits: [{ name: 'Т', description: 'Д', careerImpact: 'К' }],
      },
      careerDevelopment: {
        summary: 'Карьера',
        recommendedDirections: [],
        developmentRecommendations: ['Учиться'],
        professionalNextSteps: [],
      },
    },
  },
});

describe('PolusPublicResult with a legacy analysis', () => {
  it('shows only real skills and no invented directions', () => {
    const { container } = render(
      <PolusPublicResult
        result={buildResult(
          [{ name: 'Логика', description: 'Решает задачи', level: 'high', score: 80 }],
          'Аналитик',
        )}
      />,
    );

    expect(within(container).getByText('Ваш профиль: Аналитик')).toBeInTheDocument();
    expect(container.textContent).toContain('Логика');
    expect(container.textContent).not.toContain('БПЛА');
  });

  it('hides skill cards when no skill has a score', () => {
    const { container } = render(
      <PolusPublicResult
        result={buildResult(
          [{ name: 'Логика', description: 'Решает задачи', level: 'high', score: null }],
          'Аналитик',
        )}
      />,
    );

    expect(within(container).getByText('Ваш профиль: Аналитик')).toBeInTheDocument();
    expect(container.querySelector('.polus-result-grid')).not.toBeInTheDocument();
    expect(container.querySelector('.polus-profile-card')).not.toBeInTheDocument();
  });
});
