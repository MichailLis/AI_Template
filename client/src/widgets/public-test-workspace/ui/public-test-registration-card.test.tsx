import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicTestRegistrationCard } from './public-test-registration-card';

import type { StudentFormState } from './public-test-entry.types';

const formState: StudentFormState = {
  studentName: '',
  studentLastInitial: '',
  studentMiddleInitial: '',
  educationOrganization: '',
  groupOrClass: '',
  consentAccepted: false,
};

describe('PublicTestRegistrationCard', () => {
  it('shows personal data consent checkbox and policy link', () => {
    render(
      <PublicTestRegistrationCard
        formState={formState}
        lockedEducationOrganization={null}
        groupValidationMode="NONE"
        groupValidationExample={null}
        groupValidationHint={null}
        groupValidationWarning={null}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onFieldChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: /начать тестирование/i })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /политик/i })).not.toBeChecked();
    expect(screen.getByRole('link', { name: /политик/i })).toHaveAttribute('href', '/privacy');
  });
});
