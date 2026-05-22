import * as React from 'react';

import { cn } from '@/shared/lib/utils';

import { adminClassNames } from './admin-design-tokens';

const AdminSelectField = React.forwardRef<HTMLSelectElement, React.ComponentProps<'select'>>(
  ({ className, ...props }, ref) => {
    return <select className={cn(adminClassNames.form.select, className)} ref={ref} {...props} />;
  },
);
AdminSelectField.displayName = 'AdminSelectField';

export { AdminSelectField };
