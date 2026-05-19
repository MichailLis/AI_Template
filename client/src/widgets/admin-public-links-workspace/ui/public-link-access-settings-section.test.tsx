import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicLinkAccessSettingsSection } from './public-link-access-settings-section';

const baseProps = {
  newPublicShortCode: '',
  onShortCodeChange: vi.fn(),
  newPublicTemplate: 'STANDARD' as const,
  onPublicTemplateChange: vi.fn(),
  newPublicEntryProfileMode: 'DEMOGRAPHIC' as const,
  onEntryProfileModeChange: vi.fn(),
  newPublicMaxAttempts: '1',
  onMaxAttemptsChange: vi.fn(),
  newPublicTimeLimit: '30',
  onTimeLimitChange: vi.fn(),
  newPublicConsentVersion: 'v1',
  onConsentVersionChange: vi.fn(),
  newPublicConsentText: 'Согласие',
  onConsentTextChange: vi.fn(),
  newPublicAllowResume: true,
  onAllowResumeChange: vi.fn(),
};

describe('PublicLinkAccessSettingsSection', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows current public test template by default and reports Polus selection', async () => {
    const user = userEvent.setup();
    const onPublicTemplateChange = vi.fn();

    render(
      <PublicLinkAccessSettingsSection
        {...baseProps}
        onPublicTemplateChange={onPublicTemplateChange}
      />,
    );

    const templateSelect = screen.getByLabelText('Шаблон публичного теста');
    expect(templateSelect).toHaveValue('STANDARD');

    await user.selectOptions(templateSelect, 'POLUS');

    expect(onPublicTemplateChange).toHaveBeenCalledWith('POLUS');
  });

  it('reports education plus demographic profile mode selection', async () => {
    const user = userEvent.setup();
    const onEntryProfileModeChange = vi.fn();

    render(
      <PublicLinkAccessSettingsSection
        {...baseProps}
        onEntryProfileModeChange={onEntryProfileModeChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText('Анкета перед тестом'), 'EDUCATION_DEMOGRAPHIC');

    expect(onEntryProfileModeChange).toHaveBeenCalledWith('EDUCATION_DEMOGRAPHIC');
  });
});
