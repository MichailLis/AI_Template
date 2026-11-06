import type { CreatePublicLinkValues } from './public-link-create-card.types';

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

interface ValidateCreatePublicLinkParams {
  publishedVersionId: number | undefined;
  educationOrganizationId: number | null;
  personalDataProcessingMode: 'PUBLIC' | 'ON_BEHALF_OF_EDUCATION_ORGANIZATION';
  educationOrganizations: Array<{
    id: number;
    isActive: boolean;
    personalDataReady: boolean;
  }>;
  maxAttemptsRaw: string;
  timeLimitRaw: string;
}

type ValidateCreatePublicLinkResult =
  | {
      ok: true;
      publishedVersionId: number;
      educationOrganizationId: number | null;
      maxAttemptsPerStudent: number;
      timeLimitMinutes: number | null;
    }
  | {
      ok: false;
      error: string;
    };

export const validateCreatePublicLinkInput = ({
  publishedVersionId,
  educationOrganizationId,
  personalDataProcessingMode,
  educationOrganizations,
  maxAttemptsRaw,
  timeLimitRaw,
}: ValidateCreatePublicLinkParams): ValidateCreatePublicLinkResult => {
  if (!publishedVersionId) {
    return {
      ok: false,
      error: 'Сначала опубликуйте версию теста, затем создайте публичную ссылку',
    };
  }

  if (personalDataProcessingMode === 'ON_BEHALF_OF_EDUCATION_ORGANIZATION') {
    if (!educationOrganizationId) {
      return {
        ok: false,
        error: 'Для обработки ПДн от имени организации выберите учебное заведение',
      };
    }

    const selectedOrganization = educationOrganizations.find(
      (organization) => organization.id === educationOrganizationId,
    );
    if (!selectedOrganization?.isActive || !selectedOrganization.personalDataReady) {
      return {
        ok: false,
        error:
          'Выбранная организация не готова к обработке ПДн от своего имени. Заполните реквизиты в разделе «Учебные заведения».',
      };
    }
  }

  const maxAttemptsPerStudent = Number.parseInt(maxAttemptsRaw, 10);
  if (!Number.isInteger(maxAttemptsPerStudent) || maxAttemptsPerStudent < 1) {
    return {
      ok: false,
      error: 'Лимит попыток должен быть целым числом больше 0',
    };
  }

  const trimmedTimeLimit = timeLimitRaw.trim();
  const timeLimitMinutes = trimmedTimeLimit ? Number.parseInt(trimmedTimeLimit, 10) : null;
  if (trimmedTimeLimit && (!timeLimitMinutes || timeLimitMinutes < 1)) {
    return {
      ok: false,
      error: 'Ограничение времени должно быть целым числом минут больше 0',
    };
  }

  return {
    ok: true,
    publishedVersionId,
    educationOrganizationId,
    maxAttemptsPerStudent,
    timeLimitMinutes,
  };
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
