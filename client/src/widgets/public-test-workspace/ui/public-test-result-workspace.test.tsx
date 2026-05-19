import { render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useTestsPublicControllerGetSessionResult } from '@/shared/api/generated/tests-public/tests-public';

import { PublicTestResultWorkspace } from './public-test-result-workspace';

vi.mock('react-router-dom', () => ({
  useParams: () => ({ sessionToken: 'session-token' }),
}));

vi.mock('@/shared/api/generated/tests-public/tests-public', () => ({
  useTestsPublicControllerGetSessionResult: vi.fn(),
}));

vi.mock('@/features/tests', () => ({
  parseAnalysisResult: () => null,
}));

describe('PublicTestResultWorkspace', () => {
  it('shows a full processing screen while analysis is still pending', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'STANDARD',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: null,
        analysis: {
          providerMode: 'LLM',
          status: 'PENDING',
          summary: null,
          rawText: null,
          errorMessage: null,
          generatedAt: null,
        },
      },
    } as never);

    render(<PublicTestResultWorkspace />);

    expect(screen.getByRole('heading', { name: /формируем отчет/i })).toBeInTheDocument();
    expect(screen.getByText(/может занять около минуты/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /результат теста/i })).not.toBeInTheDocument();
  });

  it('shows the configured profession atlas link with student-facing explanation', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'STANDARD',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: 'https://atlas.example/professions',
        analysis: {
          providerMode: 'STUB',
          status: 'READY',
          summary: null,
          rawText: null,
          errorMessage: null,
          generatedAt: '2026-05-12T12:00:01.000Z',
        },
      },
    } as never);

    render(<PublicTestResultWorkspace />);

    expect(screen.getByText(/ознакомиться с профессиями и спросом на них/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть Атлас профессий' })).toHaveAttribute(
      'href',
      'https://atlas.example/professions',
    );
  });

  it('renders the Polus result template when the session uses POLUS', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'POLUS',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: null,
        analysis: {
          providerMode: 'STUB',
          status: 'READY',
          summary: null,
          rawText: null,
          errorMessage: null,
          generatedAt: '2026-05-12T12:00:01.000Z',
        },
      },
    } as never);

    render(<PublicTestResultWorkspace />);

    expect(screen.getByText(/Профессор Полюс говорит/i)).toBeInTheDocument();
    expect(screen.getByText(/Персональная карта развития/i)).toBeInTheDocument();
  });

  it('renders prof-orientation Polus summary when algorithm result is available', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'POLUS',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: 'https://atlas.example/professions',
        analysis: {
          providerMode: 'ALGORITHM',
          status: 'READY',
          summary: {
            resultKind: 'prof_orientation_v3_plus',
            primaryDirection: {
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
            },
            topDirections: [
              {
                id: 'A1',
                name: '3D-моделирование',
                score: 54.2,
                professions: [{ code: '201524', title: 'Инженер-конструктор' }],
                resultCard: {
                  headline: 'Профиль: проектирование и цифровая модель',
                  meaning: 'Тебе ближе этап, где идея превращается в точную 3D-модель.',
                  fitsIf: ['интересно работать в CAD'],
                  tryActions: ['смоделировать корпус датчика'],
                  learn: ['основы черчения'],
                  miniProject: 'Смоделируй корпус небольшого устройства.',
                },
              },
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
            confidence: { level: 'high', label: 'высокая' },
            profile: {
              type: 'single_profile',
              title: '3D-моделирование',
              meaning: 'Тебе ближе цифровое проектирование.',
            },
            flags: [],
            llm: {
              status: 'ready',
              analysis: {
                professorSummary:
                  'Тебе ближе 3D-моделирование: идеи хочется превращать в понятные цифровые модели и проверять их на практике.',
                summary:
                  'Профиль single_profile означает, что участнику ближе перевод идеи в точную цифровую модель.',
                confidenceComment:
                  'Высокая уверенность связана с gap 12 и consistencyIndex 1 по цифровым шкалам.',
                methodSignals: [
                  'В большинстве вопросов выбран вариант, связанный с 3D-моделированием.',
                  'Интерес к направлению A1 выше остальных.',
                ],
                firstSteps: [
                  'Смоделировать простой корпус устройства.',
                  'Сделать сборку из нескольких деталей.',
                ],
                learningPlan: ['основы черчения', 'CAD/САПР'],
                professionNotes: ['Инженер-конструктор проектирует детали и сборки.'],
                nextMiniProject: 'Смоделируй корпус небольшого устройства и подготовь чертеж.',
                cautions: [],
              },
            },
          },
          rawText: null,
          errorMessage: null,
          generatedAt: '2026-05-12T12:00:01.000Z',
        },
      },
    } as never);

    const { container } = render(<PublicTestResultWorkspace />);
    const view = within(container);

    expect(view.getByRole('heading', { name: /профиль: проектирование/i })).toBeInTheDocument();
    const heroText = container.querySelector('.polus-result-message')?.textContent ?? '';
    expect(heroText).toContain('идеи хочется превращать в понятные цифровые модели');
    expect(heroText).toContain('практическую пробу');
    expect(view.getAllByText(/3D-моделирование/).length).toBeGreaterThan(0);
    expect(container.textContent).toContain('54 балла');
    expect(view.getAllByText(/Смоделируй корпус небольшого устройства/i).length).toBeGreaterThan(0);
    expect(container.textContent).not.toContain('Персональные рекомендации');
    expect(container.textContent).not.toContain('Пояснение по методике v3+');
    expect(container.textContent).not.toContain('Почему такой профиль');
    expect(container.textContent).not.toContain('Уверенность');
    expect(container.textContent).not.toContain('Профиль ведущего направления');
    expect(view.queryByText(/single_profile/i)).not.toBeInTheDocument();
    expect(view.queryByText(/consistencyIndex/i)).not.toBeInTheDocument();
    expect(view.queryByText(/gap/i)).not.toBeInTheDocument();
    expect(view.queryByText(/слайдер/i)).not.toBeInTheDocument();
    expect(view.queryByText(/большинстве вопросов выбран вариант/i)).not.toBeInTheDocument();
    expect(view.getByText(/Как читать результат/i)).toBeInTheDocument();
    expect(container.textContent).not.toContain('Как это связано с профессиями');
    expect(container.textContent?.match(/Инженер-конструктор/g) ?? []).toHaveLength(1);
    expect(container.textContent).toContain('Проектирует детали и сборки.');
    expect(view.getByText(/подготовь чертеж/i)).toBeInTheDocument();
    expect(container.textContent?.match(/Подходящие специальности/g) ?? []).toHaveLength(1);
    const professionsSection = container.querySelector(
      'section[aria-label="Подходящие специальности"]',
    );
    expect(professionsSection).toBeInTheDocument();
    expect(within(professionsSection as HTMLElement).getByText('20.15.24')).toBeInTheDocument();
    expect(professionsSection?.textContent).not.toContain('201524');
    const atlasLink = within(professionsSection as HTMLElement).getByRole('link', {
      name: /перейти в атлас профессий/i,
    });
    expect(atlasLink).toHaveAttribute('href', 'https://atlas.example/professions');
    expect(atlasLink).toHaveClass('polus-atlas-inline-action');
    expect(
      container.querySelector('section[aria-label="Атлас профессий"]'),
    ).not.toBeInTheDocument();
    expect(
      container.textContent?.toLocaleLowerCase('ru-RU').match(/атлас профессий/g) ?? [],
    ).toHaveLength(1);
  });

  it('shows the processing screen instead of the Polus result while methodology LLM is pending', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'POLUS',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: null,
        analysis: {
          providerMode: 'ALGORITHM_LLM',
          status: 'READY',
          summary: {
            resultKind: 'prof_orientation_v3_plus',
            primaryDirection: {
              id: 'A1',
              name: '3D-моделирование',
              score: 54.2,
              resultCard: {
                headline: 'Профиль: проектирование и цифровая модель',
                meaning: 'Алгоритмическое описание карточки не должно быть речью профессора.',
                fitsIf: ['интересно работать в CAD'],
                tryActions: ['смоделировать корпус датчика'],
                learn: ['основы черчения'],
                miniProject: 'Смоделируй корпус небольшого устройства.',
              },
              professions: [{ code: '201524', title: 'Инженер-конструктор' }],
            },
            topDirections: [],
            confidence: { level: 'high', label: 'высокая' },
            profile: {
              type: 'single_profile',
              title: '3D-моделирование',
              meaning: 'Алгоритмический профиль.',
            },
            flags: [],
            llm: {
              status: 'pending',
            },
          },
          rawText: null,
          errorMessage: null,
          generatedAt: '2026-05-12T12:00:01.000Z',
        },
      },
    } as never);

    const { container } = render(<PublicTestResultWorkspace />);

    expect(container.textContent).toContain('Формируем отчет');
    expect(container.textContent).toContain('Страница обновится автоматически');
    expect(container.querySelector('.theme-public--polus')).toBeInTheDocument();
    expect(container.querySelector('.polus-processing-card')).toBeInTheDocument();
    expect(container.querySelector('.polus-result-message')).not.toBeInTheDocument();
    expect(container.textContent).not.toContain('Алгоритмическое описание карточки');
  });

  it('uses deterministic professor copy when methodology LLM fails', () => {
    vi.mocked(useTestsPublicControllerGetSessionResult).mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        sessionToken: 'session-token',
        publicTemplate: 'POLUS',
        status: 'COMPLETED',
        finishedAt: '2026-05-12T12:00:00.000Z',
        professionAtlasUrl: null,
        analysis: {
          providerMode: 'ALGORITHM_LLM',
          status: 'READY',
          summary: {
            resultKind: 'prof_orientation_v3_plus',
            primaryDirection: {
              id: 'A1',
              name: '3D-моделирование',
              score: 54.2,
              resultCard: {
                headline: 'Профиль: проектирование и цифровая модель',
                meaning: 'Алгоритмическое описание карточки можно показать после ошибки ИИ.',
                fitsIf: ['интересно работать в CAD'],
                tryActions: ['смоделировать корпус датчика'],
                learn: ['основы черчения'],
                miniProject: 'Смоделируй корпус небольшого устройства.',
              },
              professions: [{ code: '201524', title: 'Инженер-конструктор' }],
            },
            topDirections: [],
            confidence: { level: 'high', label: 'высокая' },
            profile: {
              type: 'single_profile',
              title: '3D-моделирование',
              meaning: 'Алгоритмический профиль.',
            },
            flags: [],
            llm: {
              status: 'failed',
              errorMessage: 'OpenRouter request timeout',
            },
          },
          rawText: null,
          errorMessage: 'OpenRouter request timeout',
          generatedAt: '2026-05-12T12:00:01.000Z',
        },
      },
    } as never);

    const { container } = render(<PublicTestResultWorkspace />);

    const heroText = container.querySelector('.polus-result-message')?.textContent ?? '';

    expect(heroText).toContain('можно показать после ошибки ИИ');
    expect(heroText).toContain('Профессор Полюс говорит');
  });
});
