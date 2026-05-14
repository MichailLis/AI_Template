import { useState } from 'react';

import type { PublicLinksTab } from './admin-public-links-workspace.helpers';
import type { PublicLinkEntryProfileMode } from './public-link-create-card.types';
import type { GroupValidationMode } from '@/shared/lib/group-validation';

interface EducationOrganizationValidationSnapshot {
  id: number;
  groupValidationMode: GroupValidationMode;
  groupValidationPattern: string | null;
  groupValidationExample: string | null;
  groupValidationHint: string | null;
}

export function useAdminPublicLinksFormState() {
  const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);
  const [newPublicShortCode, setNewPublicShortCode] = useState('');
  const [newEducationOrganizationId, setNewEducationOrganizationIdState] = useState<number | null>(
    null,
  );
  const [newEducationOrganizationName, setNewEducationOrganizationName] = useState('');
  const [groupValidationMode, setGroupValidationMode] = useState<GroupValidationMode>('NONE');
  const [groupValidationPattern, setGroupValidationPattern] = useState('');
  const [groupValidationExample, setGroupValidationExample] = useState('');
  const [groupValidationHint, setGroupValidationHint] = useState('');
  const [newPublicEntryProfileMode, setNewPublicEntryProfileMode] =
    useState<PublicLinkEntryProfileMode>('DEMOGRAPHIC');
  const [newPublicMaxAttempts, setNewPublicMaxAttempts] = useState('3');
  const [newPublicTimeLimit, setNewPublicTimeLimit] = useState('30');
  const [newPublicAllowResume, setNewPublicAllowResume] = useState(true);
  const [newPublicConsentVersion, setNewPublicConsentVersion] = useState('v1');
  const [newPublicConsentText, setNewPublicConsentText] = useState(
    'Я даю согласие на обработку персональных данных для прохождения тестирования и формирования аналитики.',
  );
  const [selectedPublicLinkId, setSelectedPublicLinkId] = useState<number | null>(null);
  const [pendingDeletePublicLinkId, setPendingDeletePublicLinkId] = useState<number | null>(null);
  const [publicLinksTab, setPublicLinksTab] = useState<PublicLinksTab>('active');
  const [publicLinksSearch, setPublicLinksSearch] = useState('');

  const applyEducationOrganizationSelection = (
    value: number | null,
    organizations: EducationOrganizationValidationSnapshot[],
  ) => {
    setNewEducationOrganizationIdState(value);

    const selectedOrganization = organizations.find((organization) => organization.id === value);

    if (!selectedOrganization) {
      setGroupValidationMode('NONE');
      setGroupValidationPattern('');
      setGroupValidationExample('');
      setGroupValidationHint('');
      return;
    }

    setGroupValidationMode(selectedOrganization.groupValidationMode);
    setGroupValidationPattern(selectedOrganization.groupValidationPattern ?? '');
    setGroupValidationExample(selectedOrganization.groupValidationExample ?? '');
    setGroupValidationHint(selectedOrganization.groupValidationHint ?? '');
  };

  return {
    selectedTopicId,
    setSelectedTopicId,
    newPublicShortCode,
    setNewPublicShortCode,
    newEducationOrganizationId,
    setNewEducationOrganizationIdState,
    newEducationOrganizationName,
    setNewEducationOrganizationName,
    groupValidationMode,
    setGroupValidationMode,
    groupValidationPattern,
    setGroupValidationPattern,
    groupValidationExample,
    setGroupValidationExample,
    groupValidationHint,
    setGroupValidationHint,
    newPublicEntryProfileMode,
    setNewPublicEntryProfileMode,
    newPublicMaxAttempts,
    setNewPublicMaxAttempts,
    newPublicTimeLimit,
    setNewPublicTimeLimit,
    newPublicAllowResume,
    setNewPublicAllowResume,
    newPublicConsentVersion,
    setNewPublicConsentVersion,
    newPublicConsentText,
    setNewPublicConsentText,
    selectedPublicLinkId,
    setSelectedPublicLinkId,
    pendingDeletePublicLinkId,
    setPendingDeletePublicLinkId,
    publicLinksTab,
    setPublicLinksTab,
    publicLinksSearch,
    setPublicLinksSearch,
    applyEducationOrganizationSelection,
  };
}
