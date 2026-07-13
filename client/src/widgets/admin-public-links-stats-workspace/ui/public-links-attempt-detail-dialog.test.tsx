import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicLinksAttemptDetailDialog } from './public-links-attempt-detail-dialog';

const profOrientationPrimaryDirection = {
  id: 'A1',
  name: '3D-моделирование',
  score: 54.2,
  resultCard: {
    headline: 'Профиль: проектирование и цифровая модель',
    meaning: 'Тебе ближе этап, где идея превращается в точную 3D-модель.',
    fitsIf: ['интересно работать в CAD'],
    tryActions: ['смоделировать корпус датчика'],
    learn: ['основы черчения'],
    miniProject: 'Смоделируй корпус небольшого устройства.',
  },
  professions: [{ code: '201524', title: 'Инженер-конструктор' }],
};

const profOrientationSummary = {
  resultKind: 'prof_orientation_v3_plus',
  primaryDirection: profOrientationPrimaryDirection,
  topDirections: [
    profOrientationPrimaryDirection,
    {
      id: 'B2',
      name: 'Программирование',
      score: 41.1,
      professions: [],
      resultCard: {
        headline: 'Профиль: программирование',
        meaning: 'Тебе ближе логика программ.',
        fitsIf: [],
        tryActions: [],
        learn: [],
        miniProject: 'Напиши простую программу.',
      },
    },
  ],
  confidence: { label: 'высокая' },
  profile: {
    type: 'single_profile',
    title: '3D-моделирование',
    meaning: 'Тебе ближе цифровое проектирование.',
    miniProject: 'Смоделируй корпус небольшого устройства.',
  },
  llm: {
    status: 'ready',
    analysis: {
      professorSummary:
        'Тебе ближе 3D-моделирование: идеи хочется превращать в понятные цифровые модели.',
      summary:
        'Профиль single_profile означает, что участнику ближе перевод идеи в точную цифровую модель.',
      firstSteps: ['Смоделировать простой корпус устройства.'],
      learningPlan: ['основы черчения'],
      professionNotes: ['Инженер-конструктор проектирует детали и сборки.'],
      nextMiniProject: 'Смоделируй корпус небольшого устройства и подготовь чертеж.',
      cautions: [],
      confidenceComment: 'Высокая уверенность связана с устойчивыми выборами.',
      methodSignals: ['Чаще выбирались задания, связанные с цифровой моделью.'],
    },
  },
};

const detailAttempt = {
  entryProfileMode: 'EDUCATION_DEMOGRAPHIC' as const,
  professionAtlasUrl: 'https://atlas.example/professions',
  studentName: 'Алексей',
  studentLastInitial: 'И',
  studentMiddleInitial: 'П',
  educationOrganization: 'Школа 1',
  groupOrClass: '10А',
  studentGender: 'MALE' as const,
  studentAge: 16,
  studentResidence: 'Мурманск',
  studentEducationLevel: 'SECONDARY_GENERAL' as const,
  attemptNumber: 1,
  status: 'COMPLETED',
  analysis: {
    providerMode: 'ALGORITHM_LLM',
    status: 'READY',
    summary: profOrientationSummary,
    rawText: null,
    errorMessage: null,
    generatedAt: '2026-05-12T12:00:01.000Z',
  },
  answers: [],
};

describe('PublicLinksAttemptDetailDialog', () => {
  it('renders prof-orientation v3+ analysis in the student-facing Polus format', () => {
    render(
      <PublicLinksAttemptDetailDialog
        isOpen
        detailView="analysis"
        detailAttempt={detailAttempt}
        isLoading={false}
        onClose={vi.fn()}
        formatDateTime={(value) => value ?? '—'}
        toPrettyJson={(value) => JSON.stringify(value, null, 2)}
      />,
    );

    expect(screen.getByText('Профессор Полюс говорит:')).toBeInTheDocument();
    expect(screen.getByText('Персональная карта развития')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /профиль: проектирование/i })).toBeInTheDocument();
    expect(
      screen.getByText(/идеи хочется превращать в понятные цифровые модели/i),
    ).toBeInTheDocument();

    const professionsSection = document.body.querySelector(
      'section[aria-label="Подходящие специальности"]',
    );
    const professorImage = document.body.querySelector('img.polus-result-professor-figure');

    expect(professorImage).toBeInTheDocument();
    expect(professorImage).toHaveAttribute('src', expect.stringContaining('professor-polus'));
    expect(professionsSection).toBeInTheDocument();
    expect(within(professionsSection as HTMLElement).getByText('Код 20.15.24')).toBeInTheDocument();
    expect(
      within(professionsSection as HTMLElement).getByRole('link', {
        name: /перейти в атлас профессий/i,
      }),
    ).toHaveAttribute('href', 'https://atlas.example/professions');
    expect(document.body.textContent).not.toContain('Структурированные данные анализа');
    expect(document.body.textContent).not.toContain('"resultKind"');
  });
});
