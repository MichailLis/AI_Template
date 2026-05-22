import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { adminClassNames } from './admin-design-tokens';
import { AdminSelectField } from './admin-select-field';

describe('AdminSelectField', () => {
  it('renders an admin-styled select and preserves custom classes', () => {
    render(
      <AdminSelectField aria-label="Status" className="flex" defaultValue="active">
        <option value="active">Active</option>
        <option value="archived">Archived</option>
      </AdminSelectField>,
    );

    const select = screen.getByLabelText('Status');

    expect(select).toHaveClass('flex');
    expect(select).toHaveClass(...adminClassNames.form.select.split(' '));
    expect(select).toHaveValue('active');
  });

  it('forwards refs to the select element', () => {
    const ref = createRef<HTMLSelectElement>();

    render(
      <AdminSelectField ref={ref} aria-label="Type">
        <option value="open">Open</option>
      </AdminSelectField>,
    );

    expect(ref.current).toBe(screen.getByLabelText('Type'));
  });
});
