import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinkOrganizationSection } from './public-link-organization-section';

const baseProps = {
  educationOrganizations: [
    { id: 1, name: 'Готовый лицей', isActive: true, personalDataReady: true },
    { id: 2, name: 'Неполный лицей', isActive: true, personalDataReady: false },
  ],
  newEducationOrganizationId: null,
  onEducationOrganizationSelect: vi.fn(),
  newEducationOrganizationName: '',
  onEducationOrganizationNameChange: vi.fn(),
  groupValidationMode: 'NONE' as const,
  onGroupValidationModeChange: vi.fn(),
  groupValidationPattern: '',
  onGroupValidationPatternChange: vi.fn(),
  groupValidationExample: '',
  onGroupValidationExampleChange: vi.fn(),
  groupValidationHint: '',
  onGroupValidationHintChange: vi.fn(),
  onCreateEducationOrganization: vi.fn(),
  onUpdateEducationOrganization: vi.fn(),
  isCreatingEducationOrganization: false,
  isUpdatingEducationOrganization: false,
  newPersonalDataProcessingMode: 'PUBLIC' as const,
  onPersonalDataProcessingModeChange: vi.fn(),
};

describe('PublicLinkOrganizationSection', () => {
  afterEach(cleanup);

  it('renders accessible operator choices and server readiness in organization options', () => {
    render(<PublicLinkOrganizationSection {...baseProps} />);

    expect(screen.getByRole('group', { name: 'Оператор персональных данных' })).toBeInTheDocument();
    expect(screen.getByLabelText('Оператор — платформа')).toBeChecked();
    expect(screen.getByLabelText('От имени учебного заведения')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Готовый лицей — ПДн готовы' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Неполный лицей — ПДн не готовы' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/оператор и ссылки на документы фиксируются/i)).toBeInTheDocument();
  });

  it('explains PUBLIC profile locking and inline quick-create limitations', () => {
    render(<PublicLinkOrganizationSection {...baseProps} />);

    expect(
      screen.getByText(/выбор заведения для анкеты не меняет оператора персональных данных/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/после быстрого добавления заполните реквизиты в разделе/i),
    ).toBeInTheDocument();
  });
});
