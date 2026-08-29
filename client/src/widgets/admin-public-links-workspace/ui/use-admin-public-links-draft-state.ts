import { useState } from 'react';

import type {
  PublicLinkEntryProfileMode,
  PublicLinkTemplate,
  PersonalDataProcessingMode,
} from './public-link-create-card.types';

const DEFAULT_CONSENT_TEXT =
  'Я даю согласие на обработку персональных данных для прохождения тестирования и формирования аналитики.';

/** Fields of the public link the operator is currently drafting. */
export function useAdminPublicLinksDraftState() {
  const [newPublicShortCode, setNewPublicShortCode] = useState('');
  const [newEducationOrganizationId, setNewEducationOrganizationIdState] = useState<number | null>(
    null,
  );
  const [newEducationOrganizationName, setNewEducationOrganizationName] = useState('');
  const [newPersonalDataProcessingMode, setNewPersonalDataProcessingMode] =
    useState<PersonalDataProcessingMode>('PUBLIC');
  const [newPublicEntryProfileMode, setNewPublicEntryProfileMode] =
    useState<PublicLinkEntryProfileMode>('DEMOGRAPHIC');
  const [newPublicTemplate, setNewPublicTemplate] = useState<PublicLinkTemplate>('STANDARD');
  const [newPublicMaxAttempts, setNewPublicMaxAttempts] = useState('3');
  const [newPublicTimeLimit, setNewPublicTimeLimit] = useState('30');
  const [newPublicAllowResume, setNewPublicAllowResume] = useState(true);
  const [newPublicConsentVersion, setNewPublicConsentVersion] = useState('v1');
  const [newPublicConsentText, setNewPublicConsentText] = useState(DEFAULT_CONSENT_TEXT);

  const resetNewPublicLinkForm = () => {
    setNewPublicShortCode('');
    setNewPersonalDataProcessingMode('PUBLIC');
  };

  return {
    newPublicShortCode,
    setNewPublicShortCode,
    newEducationOrganizationId,
    setNewEducationOrganizationIdState,
    newEducationOrganizationName,
    setNewEducationOrganizationName,
    newPersonalDataProcessingMode,
    setNewPersonalDataProcessingMode,
    newPublicEntryProfileMode,
    setNewPublicEntryProfileMode,
    newPublicTemplate,
    setNewPublicTemplate,
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
    resetNewPublicLinkForm,
  };
}
