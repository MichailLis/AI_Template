import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useAdminPublicLinksFormState } from './use-admin-public-links-form-state';

describe('useAdminPublicLinksFormState', () => {
  it('defaults and resets personal-data processing to the platform', () => {
    const { result } = renderHook(() => useAdminPublicLinksFormState());

    expect(result.current.newPersonalDataProcessingMode).toBe('PUBLIC');

    act(() => {
      result.current.setNewPersonalDataProcessingMode('ON_BEHALF_OF_EDUCATION_ORGANIZATION');
      result.current.resetNewPublicLinkForm();
    });

    expect(result.current.newPersonalDataProcessingMode).toBe('PUBLIC');
  });
});
