import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PrivacyPolicyForm } from './admin-settings-privacy.parts';

describe('PrivacyPolicyForm', () => {
  afterEach(() => {
    cleanup();
  });

  it('edits the platform personal-data operator name next to the policy', () => {
    const onOperatorFullNameChange = vi.fn();

    render(
      <PrivacyPolicyForm
        canSubmit
        content="Политика"
        isSaving={false}
        operatorFullName="АНО «Старый оператор»"
        publishedAt="2026-07-10T03:00"
        version="2026-07-10"
        onContentChange={vi.fn()}
        onOperatorFullNameChange={onOperatorFullNameChange}
        onPublishedAtChange={vi.fn()}
        onSubmit={vi.fn()}
        onVersionChange={vi.fn()}
      />,
    );

    const input = screen.getByRole('textbox', {
      name: 'Наименование оператора персональных данных',
    });
    fireEvent.change(input, { target: { value: 'ООО «Новый оператор»' } });

    expect(input).toHaveAttribute('maxlength', '512');
    expect(onOperatorFullNameChange).toHaveBeenCalledWith('ООО «Новый оператор»');
  });

  /**
   * Находка аудита UX-09: дата публикации была нативным `datetime-local` с маской браузера
   * `mm/dd/yyyy, --:-- --` в англоязычном интерфейсе.
   */
  it('edits the publication date in the Russian format and reports a datetime-local value', () => {
    const onPublishedAtChange = vi.fn();

    render(
      <PrivacyPolicyForm
        canSubmit
        content="Политика"
        isSaving={false}
        operatorFullName="АНО «Старый оператор»"
        publishedAt="2026-07-10T03:00"
        version="2026-07-10"
        onContentChange={vi.fn()}
        onOperatorFullNameChange={vi.fn()}
        onPublishedAtChange={onPublishedAtChange}
        onSubmit={vi.fn()}
        onVersionChange={vi.fn()}
      />,
    );

    const input = screen.getByLabelText('Дата публикации');

    expect(input).toHaveValue('10.07.2026 03:00');
    expect(input).not.toHaveAttribute('type', 'datetime-local');

    fireEvent.change(input, { target: { value: '06.09.2026 14:30' } });

    expect(onPublishedAtChange).toHaveBeenCalledWith('2026-09-06T14:30');
  });

  /** Находка аудита UX-18: предупреждение об устаревшей дате и кнопка подстановки даты. */
  it('displays warning when editing with old date and invokes onSetCurrentDate when clicked', () => {
    const onSetCurrentDate = vi.fn();

    render(
      <PrivacyPolicyForm
        canSubmit
        content="Новый текст политики"
        isOldDateWithNewContent
        isSaving={false}
        operatorFullName="Оператор"
        publishedAt="2026-07-10T03:00"
        version="2026-09-14-v2"
        onContentChange={vi.fn()}
        onOperatorFullNameChange={vi.fn()}
        onPublishedAtChange={vi.fn()}
        onSetCurrentDate={onSetCurrentDate}
        onSubmit={vi.fn()}
        onVersionChange={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/редакция изменена, но дата публикации осталась прежней/i),
    ).toBeInTheDocument();

    const setDateButton = screen.getByRole('button', { name: 'Поставить текущую дату' });
    fireEvent.click(setDateButton);

    expect(onSetCurrentDate).toHaveBeenCalledTimes(1);
  });
});
