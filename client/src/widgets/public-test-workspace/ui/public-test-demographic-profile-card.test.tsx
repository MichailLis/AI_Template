import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PublicTestDemographicProfileCard } from './public-test-demographic-profile-card';

import type { DemographicFormState } from './public-test-entry.types';

const formState: DemographicFormState = {
  gender: '',
  age: '',
  residence: '',
  educationLevel: '',
  consentAccepted: false,
};

describe('PublicTestDemographicProfileCard', () => {
  it('renders demographic fields before starting the test', () => {
    render(
      <PublicTestDemographicProfileCard
        formState={formState}
        isSubmitting={false}
        onSubmit={vi.fn()}
        onFieldChange={vi.fn()}
      />,
    );

    expect(screen.getByRole('combobox', { name: /^пол$/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/возраст/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/место жительства/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/уровень образования/i)).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /политик/i })).not.toBeChecked();
    expect(screen.getByRole('link', { name: /политик/i })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('button', { name: /начать тестирование/i })).toBeInTheDocument();
  });
});
