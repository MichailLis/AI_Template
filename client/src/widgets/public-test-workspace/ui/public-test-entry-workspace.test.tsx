import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useTestsPublicControllerGetLinkAccess,
  useTestsPublicControllerStartSession,
} from '@/shared/api/generated/tests-public/tests-public';

import { PublicTestEntryWorkspace } from './public-test-entry-workspace';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ code: 'POLUS2026' }),
}));

vi.mock('@/shared/api/generated/tests-public/tests-public', () => ({
  useTestsPublicControllerGetLinkAccess: vi.fn(),
  useTestsPublicControllerStartSession: vi.fn(),
}));

const baseLink = {
  shortCode: 'POLUS2026',
  title: 'Инженерный маршрут',
  description: 'Короткая диагностика',
  entryProfileMode: 'DEMOGRAPHIC',
  publicTemplate: 'STANDARD',
  educationOrganization: null,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  questionCount: 18,
  maxAttemptsPerStudent: 1,
  timeLimitMinutes: 15,
  allowResume: true,
  startsAt: null,
  endsAt: null,
  consentVersion: 'v1',
  consentText: 'Согласие',
};

const mockLinkAccess = (
  publicTemplate: 'STANDARD' | 'POLUS',
  entryProfileMode: 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC' = 'DEMOGRAPHIC',
) => {
  vi.mocked(useTestsPublicControllerGetLinkAccess).mockReturnValue({
    isLoading: false,
    isError: false,
    data: {
      ...baseLink,
      publicTemplate,
      entryProfileMode,
    },
  } as never);
  vi.mocked(useTestsPublicControllerStartSession).mockReturnValue({
    mutateAsync: vi.fn(),
    isPending: false,
  } as never);
};

describe('PublicTestEntryWorkspace', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps the standard template on STANDARD public links', () => {
    mockLinkAccess('STANDARD');

    render(<PublicTestEntryWorkspace />);

    expect(screen.getByRole('heading', { name: 'Инженерный маршрут' })).toBeInTheDocument();
    expect(screen.queryByText(/Профессор Полюс/i)).not.toBeInTheDocument();
  });

  it('renders the Polus entry template for POLUS public links', () => {
    mockLinkAccess('POLUS');

    render(<PublicTestEntryWorkspace />);

    expect(screen.getByText(/Профессор Полюс/i)).toBeInTheDocument();
    expect(screen.getByText(/Найди свой инженерный маршрут/i)).toBeInTheDocument();
  });

  it('renders education and demographic fields together for the Polus hybrid profile mode', () => {
    mockLinkAccess('POLUS', 'EDUCATION_DEMOGRAPHIC');

    render(<PublicTestEntryWorkspace />);

    expect(screen.getByLabelText('Имя участника')).toBeInTheDocument();
    expect(screen.getByLabelText('Возраст')).toBeInTheDocument();
    expect(screen.getByLabelText('Класс / группа')).toBeInTheDocument();
    expect(screen.getByLabelText('Учебное заведение')).toBeInTheDocument();
    expect(screen.getByText('Дополнительная анкета')).toBeInTheDocument();
    expect(screen.getByLabelText('1. Укажите, пожалуйста Ваш пол?')).toBeInTheDocument();
  });
});
