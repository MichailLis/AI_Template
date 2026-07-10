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
});
