import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PublicPrivacyConsent } from './public-privacy-consent';

import type { PublicLinkAccessResponseDtoPersonalData } from '@/shared/api/model';

const publicPersonalData: PublicLinkAccessResponseDtoPersonalData = {
  processingMode: 'PUBLIC',
  operatorFullName: 'ООО «Платформа диагностики»',
  operatorShortName: null,
  privacyPolicyUrl: '/privacy',
  consentDocumentUrl: null,
  logoUrl: null,
};

describe('PublicPrivacyConsent', () => {
  afterEach(cleanup);

  it('renders a policy link and toggles consent state', () => {
    const onCheckedChange = vi.fn();

    render(
      <PublicPrivacyConsent
        checked={false}
        personalData={publicPersonalData}
        onCheckedChange={onCheckedChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: /политик/i });
    const link = screen.getByRole('link', { name: /политик/i });

    expect(checkbox).not.toBeChecked();
    expect(checkbox).toBeRequired();
    expect(link).toHaveAttribute('href', '/privacy');
    expect(link).not.toHaveAttribute('target');
    expect(link.closest('label')).toBeNull();

    fireEvent.click(link);

    expect(onCheckedChange).not.toHaveBeenCalled();

    fireEvent.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('shows a separate consent document and protects external links', () => {
    render(
      <PublicPrivacyConsent
        checked={false}
        personalData={{
          ...publicPersonalData,
          privacyPolicyUrl: 'https://school.example/privacy',
          consentDocumentUrl: 'https://school.example/consent',
        }}
        onCheckedChange={vi.fn()}
      />,
    );

    const policyLink = screen.getByRole('link', { name: /политик/i });
    const consentLink = screen.getByRole('link', { name: /согласие на обработку/i });

    expect(policyLink).toHaveAttribute('href', 'https://school.example/privacy');
    expect(consentLink).toHaveAttribute('href', 'https://school.example/consent');
    for (const link of [policyLink, consentLink]) {
      expect(link.closest('label')).toBeNull();
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    }
  });
});
