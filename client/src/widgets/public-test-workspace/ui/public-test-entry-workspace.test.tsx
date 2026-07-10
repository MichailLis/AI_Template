import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  personalData: {
    processingMode: 'PUBLIC',
    operatorFullName: 'ООО «Оператор тестирования»',
    operatorShortName: null,
    privacyPolicyUrl: '/privacy',
    consentDocumentUrl: null,
    logoUrl: null,
  },
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
    expect(screen.getByText('ООО «Оператор тестирования»')).toBeInTheDocument();
    expect(screen.queryByText(/Профессор Полюс/i)).not.toBeInTheDocument();
  });

  it('renders the Polus entry template for POLUS public links', () => {
    mockLinkAccess('POLUS');

    render(<PublicTestEntryWorkspace />);

    expect(screen.getByText(/Профессор Полюс/i)).toBeInTheDocument();
    expect(screen.getByText('ООО «Оператор тестирования»')).toBeInTheDocument();
    expect(screen.getByText(/Найди свой инженерный маршрут/i)).toBeInTheDocument();
    expect(screen.getByText('Демографическая анкета')).toBeInTheDocument();
    expect(screen.queryByText('Готовность к старту')).not.toBeInTheDocument();
    expect(screen.getByText('Заполните свои данные')).toBeInTheDocument();
    expect(
      screen.queryByText('коротких вопросов без оценки правильности ответов'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText('минут в среднем на спокойное прохождение')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Пройдите короткий тест и узнайте, какие технические задачи вам ближе/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/3D-моделирование, печать изделий/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Профессор Полюс придумал этот тест, чтобы помочь вам примерить/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/спокойно показать/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/что тебе ближе/i)).not.toBeInTheDocument();
    const personalMapRow = screen
      .getByText(
        'По итогам вы получите подходящие направления, профессии и первые практические шаги.',
      )
      .closest('.polus-metric-row');
    expect(personalMapRow).not.toBeNull();
    expect(personalMapRow?.querySelector('strong')).toBeNull();
  });

  it('renders education and demographic fields together for the Polus hybrid profile mode', async () => {
    mockLinkAccess('POLUS', 'EDUCATION_DEMOGRAPHIC');
    const user = userEvent.setup();

    render(<PublicTestEntryWorkspace />);

    expect(screen.getByLabelText('Имя')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите ваше имя')).toBeInTheDocument();
    expect(screen.queryByLabelText('Имя участника')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Фамилия (1-я буква)')).toHaveClass('polus-initial-input');
    expect(screen.getByPlaceholderText('И')).toBeInTheDocument();
    expect(screen.getByLabelText('Отчество (1-я буква)')).toHaveClass('polus-initial-input');
    expect(screen.getByPlaceholderText('О')).toBeInTheDocument();
    expect(screen.getByLabelText('Возраст')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Например, 17')).toBeInTheDocument();
    expect(screen.getByLabelText('Класс / группа')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('10А, ИС-21...')).toBeInTheDocument();
    expect(screen.getByLabelText('Учебное заведение')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Школа, колледж, вуз...')).toBeInTheDocument();
    expect(screen.getByLabelText('Пол')).toHaveClass('polus-select-trigger');
    expect(screen.getByLabelText('Пол')).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('Область, город или населенный пункт')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Город или населенный пункт')).toBeInTheDocument();
    const educationLevelSelect = screen.getByLabelText('Уровень образования');
    expect(educationLevelSelect).toHaveClass('polus-select-trigger');
    expect(educationLevelSelect).toHaveAttribute('aria-required', 'true');
    expect(educationLevelSelect.closest('.polus-field')).not.toHaveClass('polus-field-wide');
    expect(educationLevelSelect.closest('.polus-select-field')).toHaveAttribute(
      'data-placement',
      'top',
    );
    await user.click(educationLevelSelect);
    expect(screen.getByRole('option', { name: 'Среднее общее' })).toBeInTheDocument();
    await user.tab();
    expect(screen.queryByRole('option', { name: 'Среднее общее' })).not.toBeInTheDocument();
    await user.click(educationLevelSelect);
    await user.click(screen.getByRole('option', { name: 'Среднее общее' }));
    expect(educationLevelSelect).toHaveTextContent('Среднее общее');
    expect(screen.queryByText('Данные для статистики')).not.toBeInTheDocument();
    expect(screen.queryByText('Дополнительная анкета')).not.toBeInTheDocument();
    expect(screen.queryByText('1. Укажите, пожалуйста Ваш пол?')).not.toBeInTheDocument();
  });

  it('removes Latin letters from Polus typed profile fields', async () => {
    mockLinkAccess('POLUS', 'EDUCATION_DEMOGRAPHIC');
    const user = userEvent.setup();

    render(<PublicTestEntryWorkspace />);

    const nameInput = screen.getByLabelText('Имя');
    const lastInitialInput = screen.getByLabelText('Фамилия (1-я буква)');
    const middleInitialInput = screen.getByLabelText('Отчество (1-я буква)');
    const groupInput = screen.getByLabelText('Класс / группа');
    const organizationInput = screen.getByLabelText('Учебное заведение');
    const residenceInput = screen.getByLabelText('Место жительства');

    await user.type(nameInput, 'AlexАня');
    await user.type(lastInitialInput, 'Qж');
    await user.type(middleInitialInput, 'oп');
    await user.type(groupInput, '10A, ИС-21');
    await user.type(organizationInput, 'Лицей No42');
    await user.type(residenceInput, 'Каzань');

    expect(nameInput).toHaveValue('АНЯ');
    expect(lastInitialInput).toHaveValue('Ж');
    expect(middleInitialInput).toHaveValue('П');
    expect(groupInput).toHaveValue('10, ИС-21');
    expect(organizationInput).toHaveValue('Лицей 42');
    expect(residenceInput).toHaveValue('Каань');

    fireEvent.change(nameInput, { target: { value: 'maxМария' } });
    fireEvent.change(lastInitialInput, { target: { value: 'Qж' } });
    fireEvent.change(middleInitialInput, { target: { value: 'oп' } });

    expect(nameInput).toHaveValue('МАРИЯ');
    expect(lastInitialInput).toHaveValue('Ж');
    expect(middleInitialInput).toHaveValue('П');
  });
});
