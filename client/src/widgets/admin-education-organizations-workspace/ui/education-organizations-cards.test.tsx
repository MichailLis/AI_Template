import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EducationOrganizationsCreateCard } from './education-organizations-create-card';
import { EducationOrganizationsEditCard } from './education-organizations-edit-card';

import type { AdminEducationOrganizationsListResponseDtoOrganizationsItem } from '@/shared/api/model';

const operatorValues = {
  fullName: '',
  shortName: '',
  inn: '',
  ogrn: '',
  legalAddress: '',
  email: '',
  phone: '',
  privacyPolicyUrl: '',
  consentDocumentUrl: '',
  logoUrl: '',
};

const commonValidationProps = {
  newValidationMode: 'NONE' as const,
  onNewValidationModeChange: vi.fn(),
  newValidationPattern: '',
  onNewValidationPatternChange: vi.fn(),
  newValidationExample: '',
  onNewValidationExampleChange: vi.fn(),
  newValidationHint: '',
  onNewValidationHintChange: vi.fn(),
};

const selectedOrganization: AdminEducationOrganizationsListResponseDtoOrganizationsItem = {
  id: 42,
  name: 'Лицей 42',
  ...operatorValues,
  fullName: 'Полное имя',
  shortName: null,
  inn: null,
  ogrn: null,
  legalAddress: null,
  email: null,
  phone: null,
  privacyPolicyUrl: 'https://example.com/privacy',
  consentDocumentUrl: null,
  logoUrl: null,
  personalDataReady: false,
  isActive: true,
  groupValidationMode: 'NONE',
  groupValidationPattern: null,
  groupValidationExample: null,
  groupValidationHint: null,
  linksCount: 0,
  activeLinksCount: 0,
  attemptsCount: 0,
  createdAt: '2026-07-09T00:00:00.000Z',
  updatedAt: '2026-07-09T00:00:00.000Z',
};

describe('education organization create and edit cards', () => {
  afterEach(cleanup);

  it('renders accessible grouped operator inputs in the create form', () => {
    render(
      <EducationOrganizationsCreateCard
        newOrganizationName=""
        onNewOrganizationNameChange={vi.fn()}
        {...commonValidationProps}
        operatorValues={operatorValues}
        onOperatorValueChange={vi.fn()}
        isCreating={false}
        onCreate={vi.fn()}
      />,
    );

    expect(screen.getByRole('group', { name: 'Оператор персональных данных' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Контакты и реквизиты' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Документы и оформление' })).toBeInTheDocument();
    const nameInput = screen.getByLabelText('Название *');
    expect(nameInput).toBeRequired();
    expect(nameInput).toHaveAttribute('placeholder', 'Например: Лицей № 42');

    for (const label of [
      'Полное наименование *',
      'Сокращённое наименование *',
      'Политика обработки ПДн *',
    ]) {
      expect(screen.getByLabelText(label)).not.toBeRequired();
    }

    for (const label of [
      'ИНН — необязательно',
      'ОГРН — необязательно',
      'Юридический адрес — необязательно',
      'Email — необязательно',
      'Телефон — необязательно',
      'Документ согласия — необязательно',
      'Логотип — необязательно',
    ]) {
      expect(screen.getByLabelText(label)).not.toBeRequired();
    }

    expect(
      screen.getByText(
        '* — обязательно для обработки ПДн от имени организации. Неполную организацию можно сохранить и заполнить позже.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Полное наименование *')).toHaveAttribute(
      'placeholder',
      'Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
    );
    expect(screen.getByLabelText('ИНН — необязательно')).toHaveAttribute(
      'placeholder',
      'Например: 1234567890',
    );
    expect(screen.getByLabelText('Политика обработки ПДн *')).toHaveAttribute(
      'placeholder',
      'https://school.example/privacy',
    );
    expect(screen.getByLabelText('Политика обработки ПДн *')).toHaveAttribute('type', 'url');
  });

  it('initializes the edit form with operator fields and server readiness status', () => {
    render(
      <EducationOrganizationsEditCard
        selectedOrganization={selectedOrganization}
        editName="Лицей 42"
        onEditNameChange={vi.fn()}
        editIsActive
        onEditIsActiveChange={vi.fn()}
        editValidationMode="NONE"
        onEditValidationModeChange={vi.fn()}
        editValidationPattern=""
        onEditValidationPatternChange={vi.fn()}
        editValidationExample=""
        onEditValidationExampleChange={vi.fn()}
        editValidationHint=""
        onEditValidationHintChange={vi.fn()}
        operatorValues={{ ...operatorValues, fullName: 'Полное имя' }}
        onOperatorValueChange={vi.fn()}
        isSaving={false}
        onSave={vi.fn()}
      />,
    );

    const editNameInput = screen.getByLabelText('Название *');
    expect(editNameInput).toBeRequired();
    expect(editNameInput).toHaveAttribute('placeholder', 'Например: Лицей № 42');
    expect(screen.getByLabelText('Полное наименование *')).toHaveValue('Полное имя');
    expect(screen.getByLabelText('Полное наименование *')).toHaveAttribute(
      'placeholder',
      'Например: Муниципальное автономное общеобразовательное учреждение «Лицей № 42»',
    );
    expect(screen.getByLabelText('Политика обработки ПДн *')).not.toBeRequired();
    expect(screen.getByLabelText('Логотип — необязательно')).toHaveAttribute(
      'placeholder',
      'https://school.example/logo.svg',
    );
    expect(screen.getByText('Данные ПДн не готовы')).toBeInTheDocument();
  });
});
