import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinkOrganizationSection } from './public-link-organization-section';

const baseProps = {
  educationOrganizations: [
    { id: 1, name: 'Готовый лицей', isActive: true, personalDataReady: true },
    { id: 2, name: 'Неполный лицей', isActive: true, personalDataReady: false },
  ],
  newEducationOrganizationId: null,
  onEducationOrganizationSelect: vi.fn(),
  onCreateEducationOrganization: vi.fn(),
  onEditEducationOrganization: vi.fn(),
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

  it('explains PUBLIC profile locking', () => {
    render(<PublicLinkOrganizationSection {...baseProps} />);

    expect(
      screen.getByText(/выбор заведения для анкеты не меняет оператора персональных данных/i),
    ).toBeInTheDocument();
  });

  it('opens the organization editor and allows editing only a selected organization', async () => {
    const onCreateEducationOrganization = vi.fn();
    const onEditEducationOrganization = vi.fn();
    const { rerender } = render(
      <PublicLinkOrganizationSection
        {...baseProps}
        onCreateEducationOrganization={onCreateEducationOrganization}
        onEditEducationOrganization={onEditEducationOrganization}
      />,
    );

    expect(screen.getByRole('button', { name: 'Изменить заведение' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Новое заведение' }));
    expect(onCreateEducationOrganization).toHaveBeenCalledOnce();

    rerender(
      <PublicLinkOrganizationSection
        {...baseProps}
        newEducationOrganizationId={1}
        onCreateEducationOrganization={onCreateEducationOrganization}
        onEditEducationOrganization={onEditEducationOrganization}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Изменить заведение' }));
    expect(onEditEducationOrganization).toHaveBeenCalledOnce();
  });

  it('filters out disabled organizations from the selection list', () => {
    render(
      <PublicLinkOrganizationSection
        {...baseProps}
        educationOrganizations={[
          ...baseProps.educationOrganizations,
          { id: 3, name: 'Отключенная школа', isActive: false, personalDataReady: false },
        ]}
      />,
    );

    expect(screen.queryByText(/Отключенная школа/)).not.toBeInTheDocument();
  });
});
