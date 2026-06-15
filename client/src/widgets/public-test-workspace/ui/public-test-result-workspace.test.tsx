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

vi.mock('@/features/tests', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/features/tests');

  return {
    ...actual,
    parseAnalysisResult: () => null,
  };
});

describe('PublicTestResultWorkspace', () => {
  const getRecentFinishedAt = (elapsedMs: number) => new Date(Date.now() - elapsedMs).toISOString();
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
  const profOrientation3dPrintDirection = {
    id: 'A2',
    name: '3D-печать',
    score: 46.4,
    resultCard: {
      headline: 'Профиль: изготовление прототипов',
      meaning: 'Тебе ближе настройка печати и получение физического прототипа.',
      fitsIf: ['интересно видеть физический результат'],
      tryActions: ['подобрать параметры печати'],
      learn: ['3D-печать и материалы'],
      miniProject: 'Напечатай прототип с двумя наборами настроек.',
    },
    professions: [
      { code: '201315', title: 'Инженер по 3D-печати' },
      { code: '103442', title: 'Оператор трехмерной печати' },
    ],
  };

  const getMinimalProfOrientationSummary = ({
    atlas = undefined,
    llm,
    meaning = profOrientationPrimaryDirection.resultCard.meaning,
  }: {
    atlas?: Record<string, unknown>;
    llm: Record<string, unknown>;
    meaning?: string;
  }) => ({
    resultKind: 'prof_orientation_v3_plus',
    primaryDirection: {
      ...profOrientationPrimaryDirection,
      resultCard: {
        ...profOrientationPrimaryDirection.resultCard,
        meaning,
      },
    },
    topDirections: [],
    confidence: { level: 'high', label: 'высокая' },
    profile: {
      type: 'single_profile',
      title: '3D-моделирование',
      meaning: 'Алгоритмический профиль.',
    },
    flags: [],
    llm,
    ...(atlas ? { atlas } : {}),
  });
  const mockSessionResult = (overrides: Record<string, unknown>) => {
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
          providerMode: 'STUB',
          status: 'READY',
          summary: null,
          errorMessage: null,
          generatedAt: '2026-05-12T12:00:01.000Z',
        },
        ...overrides,
      },
    } as never);
  };

  it('shows a full processing screen while analysis is still pending', () => {
    mockSessionResult({
      analysis: {
        providerMode: 'LLM',
        status: 'PENDING',
        summary: null,
        errorMessage: null,
        generatedAt: null,
      },
    });

    render(<PublicTestResultWorkspace />);

    expect(screen.getByRole('heading', { name: /формируем отчет/i })).toBeInTheDocument();
    expect(screen.getByText(/страница обновится автоматически/i)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /результат теста/i })).not.toBeInTheDocument();
  });

  it('shows the configured profession atlas link with student-facing explanation', () => {
    mockSessionResult({ professionAtlasUrl: 'https://atlas.example/professions' });

    render(<PublicTestResultWorkspace />);

    expect(screen.getByText(/ознакомиться с профессиями и спросом на них/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Открыть Атлас профессий' })).toHaveAttribute(
      'href',
      'https://atlas.example/professions',
    );
  });

  it('renders the Polus result template when the session uses POLUS', () => {
    mockSessionResult({ publicTemplate: 'POLUS' });

    render(<PublicTestResultWorkspace />);

    expect(screen.getByText(/Профессор Полюс говорит/i)).toBeInTheDocument();
    expect(screen.getByText(/Персональная карта развития/i)).toBeInTheDocument();
  });

  it('renders prof-orientation Polus summary when algorithm result is available', () => {
    mockSessionResult({
      publicTemplate: 'POLUS',
      professionAtlasUrl: 'https://atlas.example/professions',
      analysis: {
        providerMode: 'ALGORITHM',
        status: 'READY',
        summary: {
          ...getMinimalProfOrientationSummary({
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
          }),
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
          profile: {
            type: 'single_profile',
            title: '3D-моделирование',
            meaning: 'Тебе ближе цифровое проектирование.',
          },
        },
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

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
    expect(within(professionsSection as HTMLElement).getByText('Код 20.15.24')).toBeInTheDocument();
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
    mockSessionResult({
      publicTemplate: 'POLUS',
      finishedAt: 'not-a-date',
      analysis: {
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: getMinimalProfOrientationSummary({
          meaning: 'Алгоритмическое описание карточки не должно быть речью профессора.',
          llm: {
            status: 'pending',
          },
        }),
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

    const { container } = render(<PublicTestResultWorkspace />);

    expect(container.textContent).toContain('Формируем отчет');
    expect(container.textContent).toContain('Страница обновится автоматически');
    expect(container.textContent).not.toContain('%');
    expect(container.querySelector('.theme-public--polus')).toBeInTheDocument();
    expect(container.querySelector('.polus-processing-card')).toBeInTheDocument();
    expect(container.querySelector('.polus-result-message')).not.toBeInTheDocument();
    expect(container.textContent).not.toContain('Алгоритмическое описание карточки');
  });

  it('shows one Atlas mini profession card from each direction for a mixed profile', () => {
    const mixedPrimaryDirection = {
      ...profOrientationPrimaryDirection,
      score: 48,
      professions: [
        { code: '201524', title: 'Инженер-конструктор' },
        { code: '204016', title: 'Техник-конструктор' },
      ],
    };

    mockSessionResult({
      publicTemplate: 'POLUS',
      professionAtlasUrl: 'https://atlas.example',
      analysis: {
        providerMode: 'ALGORITHM',
        status: 'READY',
        summary: {
          ...getMinimalProfOrientationSummary({
            llm: { status: 'not_requested' },
            atlas: {
              status: 'ready',
              publicUrl: 'https://atlas.example',
              apiUrl: 'https://atlas.example/api-backend',
              unmatchedProfessions: [],
              duplicateProfessions: [],
              professions: [
                {
                  source: 'primary',
                  requestedTitle: 'Инженер-конструктор',
                  title: 'Инженер-конструктор',
                  slug: 'engineer-designer',
                  url: 'https://atlas.example/professions/engineer-designer',
                  summary: 'Проектирует детали и сборки.',
                  demandLevel: 'high',
                  industry: 'Машиностроение',
                  municipality: 'Казань',
                  skills: ['CAD', 'чертежи'],
                },
                {
                  source: 'secondary',
                  requestedTitle: 'Инженер по 3D-печати',
                  title: 'Инженер по 3D-печати',
                  slug: '3d-print-engineer',
                  url: 'https://atlas.example/professions/3d-print-engineer',
                  summary: 'Готовит модели к печати.',
                  demandLevel: 'medium',
                  industry: 'Аддитивное производство',
                  municipality: null,
                  skills: ['3D-печать'],
                },
              ],
              enterprises: [],
              events: [
                {
                  title: 'CAD-практикум',
                  slug: 'cad-practice',
                  url: 'https://atlas.example/events#event-cad-practice',
                  summary: 'Практика проектирования',
                  subtitle: 'Технопарк',
                },
              ],
              institutions: [],
            },
          }),
          primaryDirection: mixedPrimaryDirection,
          topDirections: [mixedPrimaryDirection, profOrientation3dPrintDirection],
          profile: {
            type: 'mixed_profile',
            title: 'Цифровое производство: от модели до изделия',
            meaning: 'Тебе подходит маршрут от CAD-модели до напечатанного прототипа.',
            miniProject: 'Смоделируй деталь, подготовь ее в слайсере и напечатай два варианта.',
          },
        },
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

    const { container } = render(<PublicTestResultWorkspace />);
    const professionsSection = container.querySelector(
      'section[aria-label="Подходящие специальности"]',
    );
    const atlasSection = container.querySelector('section[aria-label="Атлас профессий"]');

    expect(professionsSection).toBeInTheDocument();
    expect(
      within(professionsSection as HTMLElement).getByText('Инженер-конструктор'),
    ).toBeInTheDocument();
    expect(
      within(professionsSection as HTMLElement).getByText('Инженер по 3D-печати'),
    ).toBeInTheDocument();
    expect(professionsSection?.textContent).not.toContain('Техник-конструктор');
    expect(professionsSection?.textContent).not.toContain('Оператор трехмерной печати');
    expect(
      within(professionsSection as HTMLElement).getByRole('link', {
        name: /Инженер-конструктор в Атласе профессий/i,
      }),
    ).toHaveAttribute('href', 'https://atlas.example/professions/engineer-designer');
    expect(
      within(professionsSection as HTMLElement).getByRole('link', {
        name: /Инженер по 3D-печати в Атласе профессий/i,
      }),
    ).toHaveAttribute('href', 'https://atlas.example/professions/3d-print-engineer');
    expect(atlasSection).toBeInTheDocument();
    expect(within(atlasSection as HTMLElement).getByText('CAD-практикум')).toBeInTheDocument();
    expect(
      within(atlasSection as HTMLElement).queryByRole('link', {
        name: /Инженер-конструктор/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(atlasSection as HTMLElement).queryByRole('link', {
        name: /Инженер по 3D-печати/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('combines Atlas profession cards with suitable professions and renders recommendations below', () => {
    mockSessionResult({
      publicTemplate: 'POLUS',
      professionAtlasUrl: 'https://atlas.example',
      analysis: {
        providerMode: 'ALGORITHM',
        status: 'READY',
        summary: getMinimalProfOrientationSummary({
          llm: { status: 'not_requested' },
          atlas: {
            status: 'ready',
            publicUrl: 'https://atlas.example',
            apiUrl: 'https://atlas.example/api-backend',
            unmatchedProfessions: [],
            duplicateProfessions: [],
            professions: [
              {
                source: 'primary',
                requestedTitle: 'Инженер-конструктор',
                title: 'Инженер-конструктор',
                slug: 'engineer-designer',
                url: 'https://atlas.example/professions/engineer-designer',
                summary: 'Проектирует детали и сборки.',
                demandLevel: 'high',
                industry: 'Машиностроение',
                municipality: 'Казань',
                skills: ['CAD', 'чертежи'],
              },
              {
                source: 'secondary',
                requestedTitle: 'Инженер по 3D-печати',
                title: 'Инженер по 3D-печати',
                slug: '3d-print-engineer',
                url: 'https://atlas.example/professions/3d-print-engineer',
                summary: 'Готовит модели к печати.',
                demandLevel: 'medium',
                industry: 'Аддитивное производство',
                municipality: null,
                skills: ['3D-печать'],
              },
            ],
            enterprises: [
              {
                title: 'Завод будущего',
                slug: 'future-plant',
                url: 'https://atlas.example/enterprises#enterprise-future-plant',
                summary: 'Производственная площадка',
                subtitle: 'Стажировка конструктора',
              },
            ],
            events: [
              {
                title: 'CAD-практикум',
                slug: 'cad-practice',
                url: 'https://atlas.example/events#event-cad-practice',
                summary: 'Практика проектирования',
                subtitle: 'Технопарк',
              },
            ],
            institutions: [
              {
                title: 'Политехнический колледж',
                slug: 'polytechnic-college',
                url: 'https://atlas.example/institutions/polytechnic-college',
                summary: 'Технология машиностроения',
                subtitle: 'Казань',
              },
            ],
          },
        }),
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

    const { container } = render(<PublicTestResultWorkspace />);
    const atlasSection = container.querySelector('section[aria-label="Атлас профессий"]');
    const professionsSection = container.querySelector(
      'section[aria-label="Подходящие специальности"]',
    );

    expect(atlasSection).toBeInTheDocument();
    expect(
      within(atlasSection as HTMLElement).getByText('Дальше в Атласе профессий'),
    ).toBeInTheDocument();
    expect(
      within(professionsSection as HTMLElement).getByRole('link', {
        name: /Инженер-конструктор в Атласе профессий/i,
      }),
    ).toHaveAttribute('href', 'https://atlas.example/professions/engineer-designer');
    const professionCode = within(professionsSection as HTMLElement).getByText('Код 20.15.24');
    expect(professionCode).toHaveClass('polus-atlas-profession-code');
    expect(professionCode.closest('.polus-atlas-profession-header')).toBeInTheDocument();
    expect(
      within(atlasSection as HTMLElement).queryByRole('link', {
        name: /Инженер-конструктор/i,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(atlasSection as HTMLElement).getByRole('link', {
        name: /Завод будущего/i,
      }),
    ).toHaveAttribute('href', 'https://atlas.example/enterprises#enterprise-future-plant');
    expect(
      within(atlasSection as HTMLElement)
        .getByText('Мероприятия')
        .closest('.polus-atlas-recommendation-group'),
    ).toHaveClass('polus-atlas-recommendation-group--events');
    expect(
      within(atlasSection as HTMLElement).getByRole('link', {
        name: /CAD-практикум/i,
      }),
    ).toHaveAttribute('href', 'https://atlas.example/events#event-cad-practice');
    expect(
      within(atlasSection as HTMLElement)
        .getByText('Учебные заведения')
        .closest('.polus-atlas-recommendation-group'),
    ).toHaveClass('polus-atlas-recommendation-group--institutions');
    expect(
      within(atlasSection as HTMLElement).getByRole('link', {
        name: /Политехнический колледж/i,
      }),
    ).toHaveAttribute('href', 'https://atlas.example/institutions/polytechnic-college');
    expect(
      within(professionsSection as HTMLElement).queryByRole('link', {
        name: /перейти в атлас профессий/i,
      }),
    ).not.toBeInTheDocument();
  });

  it('renders a partial Atlas block without a technical error', () => {
    mockSessionResult({
      publicTemplate: 'POLUS',
      analysis: {
        providerMode: 'ALGORITHM',
        status: 'READY',
        summary: getMinimalProfOrientationSummary({
          llm: { status: 'not_requested' },
          atlas: {
            status: 'partial',
            publicUrl: 'https://atlas.example',
            apiUrl: 'https://atlas.example/api-backend',
            unmatchedProfessions: ['Инженер по 3D-печати'],
            duplicateProfessions: [],
            professions: [
              {
                source: 'primary',
                requestedTitle: 'Инженер-конструктор',
                title: 'Инженер-конструктор',
                slug: 'engineer-designer',
                url: 'https://atlas.example/professions/engineer-designer',
                summary: 'Проектирует детали и сборки.',
                demandLevel: null,
                industry: null,
                municipality: null,
                skills: [],
              },
            ],
            enterprises: [],
            events: [],
            institutions: [
              {
                title: 'Политехнический колледж',
                slug: 'polytechnic-college',
                url: 'https://atlas.example/institutions/polytechnic-college',
                summary: 'Технология машиностроения',
                subtitle: null,
              },
            ],
          },
        }),
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

    const { container } = render(<PublicTestResultWorkspace />);
    const professionsSection = container.querySelector(
      'section[aria-label="Подходящие специальности"]',
    );
    const atlasSection = container.querySelector('section[aria-label="Атлас профессий"]');

    expect(professionsSection).toBeInTheDocument();
    expect(atlasSection).toBeInTheDocument();
    expect(
      within(atlasSection as HTMLElement).getByText(/Показаны найденные совпадения/i),
    ).toBeInTheDocument();
    expect(
      within(professionsSection as HTMLElement).getByText('Инженер-конструктор'),
    ).toBeInTheDocument();
    expect(atlasSection?.textContent).not.toContain('Инженер-конструктор');
    expect(
      within(atlasSection as HTMLElement).getByText('Политехнический колледж'),
    ).toBeInTheDocument();
    expect(atlasSection?.textContent).not.toContain('Atlas is down');
  });

  it('keeps the Polus processing screen for a short minimum time when methodology LLM is already ready', () => {
    mockSessionResult({
      publicTemplate: 'POLUS',
      finishedAt: getRecentFinishedAt(5_000),
      analysis: {
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: null,
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

    const { container } = render(<PublicTestResultWorkspace />);

    expect(container.textContent).toContain('Формируем отчет');
    expect(container.querySelector('.polus-processing-card')).toBeInTheDocument();
    expect(container.querySelector('.polus-result-message')).not.toBeInTheDocument();
  });

  it('keeps the Polus processing screen while methodology LLM is pending after the soft wait', () => {
    mockSessionResult({
      publicTemplate: 'POLUS',
      finishedAt: getRecentFinishedAt(60_000),
      analysis: {
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: getMinimalProfOrientationSummary({
          meaning: 'Алгоритмическое описание карточки можно показать во время ожидания ИИ.',
          llm: {
            status: 'pending',
          },
        }),
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

    const { container } = render(<PublicTestResultWorkspace />);

    expect(container.querySelector('.polus-processing-card')).toBeInTheDocument();
    expect(container.querySelector('.polus-result-message')).not.toBeInTheDocument();
  });

  it('uses deterministic professor copy when methodology LLM fails', () => {
    mockSessionResult({
      publicTemplate: 'POLUS',
      analysis: {
        providerMode: 'ALGORITHM_LLM',
        status: 'READY',
        summary: getMinimalProfOrientationSummary({
          meaning: 'Алгоритмическое описание карточки можно показать после ошибки ИИ.',
          llm: {
            status: 'failed',
            errorMessage: 'OpenRouter request timeout',
          },
        }),
        errorMessage: 'OpenRouter request timeout',
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
    });

    const { container } = render(<PublicTestResultWorkspace />);

    const heroText = container.querySelector('.polus-result-message')?.textContent ?? '';

    expect(heroText).toContain('можно показать после ошибки ИИ');
    expect(heroText).toContain('Профессор Полюс говорит');
  });
});
