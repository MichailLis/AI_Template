import { render, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicTestResultWorkspace } from './public-test-result-workspace';
import {
  getMinimalProfOrientationSummary,
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

vi.mock('@/features/tests', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/features/tests');

  return {
    ...actual,
    parseAnalysisResult: () => null,
  };
});

describe('PublicTestResultWorkspace', () => {
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
    expect(
      within(professionsSection as HTMLElement).getByText(
        'Открыть: https://atlas.example/professions/engineer-designer',
      ),
    ).toHaveClass('polus-print-link');
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
      within(atlasSection as HTMLElement).getByText(
        'Открыть: https://atlas.example/enterprises#enterprise-future-plant',
      ),
    ).toHaveClass('polus-print-link');
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
      within(atlasSection as HTMLElement).getByText(
        'Открыть: https://atlas.example/events#event-cad-practice',
      ),
    ).toHaveClass('polus-print-link');
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
});
