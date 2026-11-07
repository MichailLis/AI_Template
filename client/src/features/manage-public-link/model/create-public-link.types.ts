export type PublicLinkEntryProfileMode = 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';
export type PublicLinkTemplate = 'STANDARD' | 'POLUS';
export type PersonalDataProcessingMode = 'PUBLIC' | 'ON_BEHALF_OF_EDUCATION_ORGANIZATION';

/** Поля создаваемой ссылки. Числа остаются строками до validateCreatePublicLinkInput. */
export interface CreatePublicLinkValues {
  shortCode: string;
  educationOrganizationId: number | null;
  personalDataProcessingMode: PersonalDataProcessingMode;
  publicTemplate: PublicLinkTemplate;
  entryProfileMode: PublicLinkEntryProfileMode;
  maxAttempts: string;
  timeLimit: string;
  allowResume: boolean;
  consentVersion: string;
  consentText: string;
  /** Окно доступа в локальном времени браузера (`ГГГГ-ММ-ДДTЧЧ:мм`) или пусто, см. lib/access-window. */
  startsAt: string;
  endsAt: string;
}
