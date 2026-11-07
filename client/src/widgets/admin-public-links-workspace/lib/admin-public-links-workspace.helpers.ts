import type { CreatePublicLinkValues } from '@/features/manage-public-link';

export type PublicLinksTab = 'active' | 'archived';

export const CREATE_PUBLIC_LINK_DEFAULTS: CreatePublicLinkValues = {
  shortCode: '',
  educationOrganizationId: null,
  personalDataProcessingMode: 'PUBLIC',
  publicTemplate: 'STANDARD',
  entryProfileMode: 'DEMOGRAPHIC',
  maxAttempts: '3',
  timeLimit: '30',
  allowResume: true,
  consentVersion: 'v1',
  consentText:
    'Я даю согласие на обработку персональных данных для прохождения тестирования и формирования аналитики.',
  startsAt: '',
  endsAt: '',
};

export const getShortLinkUrl = (shortCode: string) => {
  if (typeof window === 'undefined') {
    return `/t/${shortCode}`;
  }

  return `${window.location.origin}/t/${shortCode}`;
};

export const getShortLinkQrUrl = (shortCode: string) => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(
    getShortLinkUrl(shortCode),
  )}`;
};
