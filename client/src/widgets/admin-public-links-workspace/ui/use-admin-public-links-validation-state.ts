import { useState } from 'react';

import type { GroupValidationMode } from '@/shared/lib/group-validation';

export interface EducationOrganizationValidationSnapshot {
  id: number;
  groupValidationMode: GroupValidationMode;
  groupValidationPattern: string | null;
  groupValidationExample: string | null;
  groupValidationHint: string | null;
}

/**
 * Group validation fields always move as one unit: they are either cleared or filled
 * from the education organization bound to the link.
 */
export function useAdminPublicLinksValidationState() {
  const [groupValidationMode, setGroupValidationMode] = useState<GroupValidationMode>('NONE');
  const [groupValidationPattern, setGroupValidationPattern] = useState('');
  const [groupValidationExample, setGroupValidationExample] = useState('');
  const [groupValidationHint, setGroupValidationHint] = useState('');

  const applyOrganizationValidation = (
    organization: EducationOrganizationValidationSnapshot | undefined,
  ) => {
    if (!organization) {
      setGroupValidationMode('NONE');
      setGroupValidationPattern('');
      setGroupValidationExample('');
      setGroupValidationHint('');
      return;
    }

    setGroupValidationMode(organization.groupValidationMode);
    setGroupValidationPattern(organization.groupValidationPattern ?? '');
    setGroupValidationExample(organization.groupValidationExample ?? '');
    setGroupValidationHint(organization.groupValidationHint ?? '');
  };

  return {
    groupValidationMode,
    setGroupValidationMode,
    groupValidationPattern,
    setGroupValidationPattern,
    groupValidationExample,
    setGroupValidationExample,
    groupValidationHint,
    setGroupValidationHint,
    applyOrganizationValidation,
  };
}
