import { render, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PolusPublicResult } from './polus-public-result';

import type { PublicSessionResultResponseDto } from '@/shared/api/model';

const buildResult = (items: unknown[], type: string) =>
  ({
    sessionToken: 't',
    publicTemplate: 'POLUS',
    status: 'COMPLETED',
    finishedAt: null,
    professionAtlasUrl: null,
    analysis: {
      providerMode: 'LLM',
      status: 'READY',
      errorMessage: null,
      generatedAt: null,
      summary: {
        skillsLevel: { title: 'Навыки', summary: 'Сводка', items },
        thinkingType: { title: 'Мышление', type, description: 'Описание', strengths: ['Сила'] },
        personalityTraits: {
          title: 'Черты',
          traits: [{ name: 'Т', description: 'Д', careerImpact: 'К' }],
        },
        careerDevelopment: { summary: 'Карьера', developmentRecommendations: ['Учиться'] },
      },
    },
  }) as unknown as PublicSessionResultResponseDto;

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
          [{ name: 'Логика', description: 'Решает задачи', level: 'high' }],
          'Аналитик',
        )}
      />,
    );

    expect(within(container).getByText('Ваш профиль: Аналитик')).toBeInTheDocument();
    expect(container.querySelector('.polus-result-grid')).not.toBeInTheDocument();
    expect(container.querySelector('.polus-profile-card')).not.toBeInTheDocument();
  });
});
