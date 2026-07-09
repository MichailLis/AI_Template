import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicPrivacyConsent } from './public-privacy-consent';

describe('PublicPrivacyConsent', () => {
  it('renders a policy link and toggles consent state', () => {
    const onCheckedChange = vi.fn();

    render(<PublicPrivacyConsent checked={false} onCheckedChange={onCheckedChange} />);

    const checkbox = screen.getByRole('checkbox', { name: /политик/i });
    const link = screen.getByRole('link', { name: /политик/i });

    expect(checkbox).not.toBeChecked();
    expect(link).toHaveAttribute('href', '/privacy');

    fireEvent.click(checkbox);

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });
});
