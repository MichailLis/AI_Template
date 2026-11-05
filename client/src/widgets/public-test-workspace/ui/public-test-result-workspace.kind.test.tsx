import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicTestResultWorkspace } from './public-test-result-workspace';
import {
  getMinimalProfOrientationSummary,
  getRecentFinishedAt,
  mockSessionResult,
  profOrientation3dPrintDirection,
  profOrientationPrimaryDirection,
} from './public-test-result-workspace.fixtures';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ sessionToken: 'session-token' }),
}));

vi.mock('@/shared/api/generated/tests-public/tests-public', () => ({
  useTestsPublicControllerGetSessionResult: vi.fn(),
}));

describe('the result screen follows the result kind, the template only sets the look', () => {
  const buildProfOrientationAnalysis = (
    llm: Parameters<typeof getMinimalProfOrientationSummary>[0]['llm'],
  ) => ({
    providerMode: 'ALGORITHM_LLM' as const,
    status: 'READY' as const,
    summary: {
      ...getMinimalProfOrientationSummary({ llm }),
      topDirections: [profOrientationPrimaryDirection, profOrientation3dPrintDirection],
    },
    errorMessage: null,
    generatedAt: '2026-05-12T12:00:01.000Z',
  });

  it.each(['STANDARD', 'POLUS'] as const)(
    'shows the same prof-orientation result in the %s template',
    (publicTemplate) => {
      mockSessionResult({
        publicTemplate,
        finishedAt: getRecentFinishedAt(60_000),
        professionAtlasUrl: 'https://atlas.example/professions',
        analysis: buildProfOrientationAnalysis({ status: 'not_requested' }),
      });

      const { container } = render(<PublicTestResultWorkspace />);
      const view = within(container);

      expect(
        view.getByRole('heading', { name: 'Профиль: проектирование и цифровая модель' }),
      ).toBeInTheDocument();
      expect(container.textContent).toContain('54 балла');
      expect(container.textContent).toContain('46 баллов');
      expect(view.getByText('Инженер-конструктор')).toBeInTheDocument();
      expect(view.getByText('Код 20.15.24')).toBeInTheDocument();
      expect(view.getByRole('link', { name: /перейти в атлас профессий/i })).toHaveAttribute(
        'href',
        'https://atlas.example/professions',
      );
      expect(container.textContent).not.toContain('Ответы сохранены');
    },
  );

  it('draws the prof-orientation result in the standard look, without POLUS theme or professor', () => {
    mockSessionResult({
      publicTemplate: 'STANDARD',
      finishedAt: getRecentFinishedAt(60_000),
      analysis: buildProfOrientationAnalysis({ status: 'failed' }),
    });

    const { container } = render(<PublicTestResultWorkspace />);
    const view = within(container);

    expect(container.querySelector('.theme-public--standard')).toBeInTheDocument();
    expect(container.querySelector('.theme-public--polus')).not.toBeInTheDocument();
    expect(container.querySelector('[class*="polus-"]')).not.toBeInTheDocument();
    expect(container.querySelector('img, video')).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Полюс|Профессор/);
    expect(view.getByRole('heading', { level: 1, name: 'Результат теста' })).toBeInTheDocument();
    expect(
      view.getByText('Итог профориентационного теста: подходящие направления и специальности.'),
    ).toBeInTheDocument();
    expect(view.getAllByRole('button', { name: /скачать pdf/i }).length).toBeGreaterThan(0);
    // Алгоритмический итог показывается и после сбоя пояснения ИИ.
    expect(container.querySelector('.prof-result-hero')).toHaveTextContent(
      'Тебе ближе этап, где идея превращается в точную 3D-модель.',
    );
  });

  it('does not repeat the atlas link below a standard prof-orientation result', () => {
    mockSessionResult({
      publicTemplate: 'STANDARD',
      finishedAt: getRecentFinishedAt(60_000),
      professionAtlasUrl: 'https://atlas.example/professions',
      analysis: buildProfOrientationAnalysis({ status: 'not_requested' }),
    });

    const { container } = render(<PublicTestResultWorkspace />);

    expect(
      within(container).queryByRole('link', { name: 'Открыть Атлас профессий' }),
    ).not.toBeInTheDocument();
    expect(
      within(container).getAllByRole('link', { name: /перейти в атлас профессий/i }),
    ).toHaveLength(1);
  });

  it.each(['STANDARD', 'POLUS'] as const)(
    'waits for the methodology LLM in the %s template instead of showing a half-ready result',
    (publicTemplate) => {
      mockSessionResult({
        publicTemplate,
        finishedAt: getRecentFinishedAt(60_000),
        analysis: buildProfOrientationAnalysis({ status: 'pending' }),
      });

      const { container } = render(<PublicTestResultWorkspace />);

      expect(container.textContent).toContain('Формируем отчет');
      expect(container.textContent).not.toContain('Профиль: проектирование');
      expect(container.querySelector('.prof-result-hero, .polus-result-message')).toBeNull();
      expect(Boolean(container.querySelector('.polus-processing-card'))).toBe(
        publicTemplate === 'POLUS',
      );
    },
  );

  it('does not hold a standard result back for the POLUS minimum processing time', () => {
    mockSessionResult({
      publicTemplate: 'STANDARD',
      finishedAt: getRecentFinishedAt(1_000),
      analysis: buildProfOrientationAnalysis({ status: 'ready' }),
    });

    const { container } = render(<PublicTestResultWorkspace />);

    expect(container.textContent).not.toContain('Формируем отчет');
    expect(container.querySelector('.prof-result-hero')).toBeInTheDocument();
  });

  it('keeps the AI analysis in the standard screen when the result kind is ai_analysis', () => {
    mockSessionResult({
      publicTemplate: 'STANDARD',
      analysis: {
        providerMode: 'LLM',
        status: 'READY',
        summary: {
          resultKind: 'ai_analysis',
          introduction: 'Введение к анализу',
          skillsLevel: { title: 'Навыки', summary: 'Сводка', items: [] },
          thinkingType: { title: 'Мышление', type: 'Аналитик', description: 'О', strengths: [] },
          personalityTraits: { title: 'Черты', traits: [] },
          careerDevelopment: {
            summary: 'Карьера',
            recommendedDirections: [],
            developmentRecommendations: [],
            professionalNextSteps: [],
          },
        },
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

    const { container } = render(<PublicTestResultWorkspace />);

    expect(screen.getByText('Введение к анализу')).toBeInTheDocument();
    expect(container.querySelector('.prof-result-hero')).not.toBeInTheDocument();
  });
});
