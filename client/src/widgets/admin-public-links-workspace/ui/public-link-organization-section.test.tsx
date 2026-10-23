import { cleanup, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CREATE_PUBLIC_LINK_DEFAULTS } from './admin-public-links-workspace.helpers';
import { PublicLinkOrganizationSection } from './public-link-organization-section';

import type {
  CreatePublicLinkValues,
  EducationOrganizationOption,
} from './public-link-create-card.types';

const organizations: EducationOrganizationOption[] = [
  { id: 1, name: 'Готовый лицей', isActive: true, personalDataReady: true },
  { id: 2, name: 'Неполный лицей', isActive: true, personalDataReady: false },
];

const createForm = () =>
  renderHook(() => useForm<CreatePublicLinkValues>({ defaultValues: CREATE_PUBLIC_LINK_DEFAULTS }))
    .result.current;

const renderSection = ({
  educationOrganizations = organizations,
  onCreateEducationOrganization = vi.fn(),
  onEditEducationOrganization = vi.fn(),
}: {
  educationOrganizations?: EducationOrganizationOption[];
  onCreateEducationOrganization?: () => void;
  onEditEducationOrganization?: () => void;
} = {}) => {
  const form = createForm();
  render(
    <PublicLinkOrganizationSection
      form={form}
      educationOrganizations={educationOrganizations}
      onCreateEducationOrganization={onCreateEducationOrganization}
      onEditEducationOrganization={onEditEducationOrganization}
    />,
  );
  return form;
};

describe('PublicLinkOrganizationSection', () => {
  afterEach(cleanup);

  it('renders accessible operator choices and server readiness in organization options', () => {
    renderSection();

    expect(screen.getByRole('group', { name: 'Оператор персональных данных' })).toBeInTheDocument();
    expect(screen.getByLabelText('Оператор — платформа')).toBeChecked();
    expect(screen.getByLabelText('От имени учебного заведения')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Готовый лицей — ПДн готовы' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Неполный лицей — ПДн не готовы' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/оператор и ссылки на документы фиксируются/i)).toBeInTheDocument();
  });

  it('explains PUBLIC profile locking and hides the note for the organization operator', async () => {
    const user = userEvent.setup();
    const form = renderSection();
    const note = /выбор заведения для анкеты не меняет оператора персональных данных/i;

    expect(screen.getByText(note)).toBeInTheDocument();

    await user.click(screen.getByLabelText('От имени учебного заведения'));

    expect(form.getValues('personalDataProcessingMode')).toBe(
      'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
    );
    expect(screen.queryByText(note)).not.toBeInTheDocument();
  });

  it('opens the organization editor and allows editing only a selected organization', async () => {
    const user = userEvent.setup();
    const onCreateEducationOrganization = vi.fn();
    const onEditEducationOrganization = vi.fn();
    const form = renderSection({ onCreateEducationOrganization, onEditEducationOrganization });

    expect(screen.getByRole('button', { name: 'Изменить заведение' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Новое заведение' }));
    expect(onCreateEducationOrganization).toHaveBeenCalledOnce();

    await user.selectOptions(screen.getByLabelText('Заведение для ссылки'), '1');
    expect(form.getValues('educationOrganizationId')).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Изменить заведение' }));
    expect(onEditEducationOrganization).toHaveBeenCalledOnce();
  });

  it('filters out disabled organizations from the selection list', () => {
    renderSection({
      educationOrganizations: [
        ...organizations,
        { id: 3, name: 'Отключенная школа', isActive: false, personalDataReady: false },
      ],
    });

    expect(screen.queryByText(/Отключенная школа/)).not.toBeInTheDocument();
  });
});
