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
  consentAccepted: true,
};

describe('PublicTestRegistrationCard', () => {
  it('hides personal data consent copy while keeping the public test start form visible', () => {
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
    expect(screen.queryByText(/согласие на обработку данных/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/персональных данных/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
