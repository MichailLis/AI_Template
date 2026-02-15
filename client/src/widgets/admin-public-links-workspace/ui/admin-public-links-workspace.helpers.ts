export type PublicLinksTab = 'active' | 'archived';

interface TopicOption {
  id: number;
}

interface PublicLinkOption {
  id: number;
}

interface ValidateCreatePublicLinkParams {
  publishedVersionId: number | undefined;
  maxAttemptsRaw: string;
  timeLimitRaw: string;
}

type ValidateCreatePublicLinkResult =
  | {
      ok: true;
      publishedVersionId: number;
      maxAttemptsPerStudent: number;
      timeLimitMinutes: number | null;
    }
  | {
      ok: false;
      error: string;
    };

export const resolveEffectiveTopicId = (selectedTopicId: number | null, topics: TopicOption[]) => {
  if (topics.length === 0) {
    return 0;
  }

  if (selectedTopicId && topics.some((topic) => topic.id === selectedTopicId)) {
    return selectedTopicId;
  }

  return topics[0].id;
};

export const resolveEffectivePublicLinkId = (
  selectedPublicLinkId: number | null,
  visiblePublicLinks: PublicLinkOption[],
) => {
  if (visiblePublicLinks.length === 0) {
    return null;
  }

  if (selectedPublicLinkId && visiblePublicLinks.some((link) => link.id === selectedPublicLinkId)) {
    return selectedPublicLinkId;
  }

  return visiblePublicLinks[0].id;
};

export const validateCreatePublicLinkInput = ({
  publishedVersionId,
  maxAttemptsRaw,
  timeLimitRaw,
}: ValidateCreatePublicLinkParams): ValidateCreatePublicLinkResult => {
  if (!publishedVersionId) {
    return {
      ok: false,
      error: 'Сначала опубликуйте версию теста, затем создайте публичную ссылку',
    };
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
