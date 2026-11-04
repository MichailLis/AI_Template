import { vi } from 'vitest';

import { useTestsPublicControllerGetSessionResult } from '@/shared/api/generated/tests-public/tests-public';

import type {
  PublicProfOrientationAtlas,
  PublicProfOrientationDirection,
  PublicProfOrientationEnrichment,
  PublicProfOrientationSummary,
  PublicProfOrientationSummaryLlmStatus,
  PublicSessionResultResponseDto,
} from '@/shared/api/model';

export const getRecentFinishedAt = (elapsedMs: number) =>
  new Date(Date.now() - elapsedMs).toISOString();
export const profOrientationPrimaryDirection: PublicProfOrientationDirection = {
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
export const profOrientation3dPrintDirection: PublicProfOrientationDirection = {
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
  atlas = null,
  llm,
  meaning = profOrientationPrimaryDirection.resultCard.meaning,
}: {
  atlas?: PublicProfOrientationAtlas | null;
  llm: {
    status: PublicProfOrientationSummaryLlmStatus;
    analysis?: PublicProfOrientationEnrichment;
  };
  meaning?: string;
}): PublicProfOrientationSummary => ({
  resultKind: 'prof_orientation_v3_plus',
  primaryDirection: {
    ...profOrientationPrimaryDirection,
    resultCard: {
      ...profOrientationPrimaryDirection.resultCard,
      meaning,
    },
  },
  topDirections: [],
  confidence: { label: 'высокая' },
  profile: {
    type: 'single_profile',
    title: '3D-моделирование',
    meaning: 'Алгоритмический профиль.',
    miniProject: null,
  },
  llm: { status: llm.status, analysis: llm.analysis ?? null },
  atlas,
});
export const mockSessionResult = (overrides: Partial<PublicSessionResultResponseDto>) => {
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
        summary: { resultKind: 'none' },
        errorMessage: null,
        generatedAt: '2026-05-12T12:00:01.000Z',
      },
      ...overrides,
    },
  } as never);
};
