import { vi } from 'vitest';

import { useTestsPublicControllerGetSessionResult } from '@/shared/api/generated/tests-public/tests-public';

export const getRecentFinishedAt = (elapsedMs: number) =>
  new Date(Date.now() - elapsedMs).toISOString();
export const profOrientationPrimaryDirection = {
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
export const profOrientation3dPrintDirection = {
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

export const getMinimalProfOrientationSummary = ({
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
export const mockSessionResult = (overrides: Record<string, unknown>) => {
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
