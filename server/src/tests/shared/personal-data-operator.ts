import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PersonalDataProcessingMode } from '@prisma/client';

import { DEFAULT_PLATFORM_OPERATOR_FULL_NAME } from '../../app-settings/privacy-policy.constants';
import type { PrismaService } from '../../prisma.service';

export const PUBLIC_OPERATOR_FULL_NAME = DEFAULT_PLATFORM_OPERATOR_FULL_NAME;
export const PUBLIC_PRIVACY_POLICY_URL = '/privacy';

const normalizeNullableString = (value: string | null) => value?.trim() || null;

export type ResolvedPersonalDataOperator = {
  processingMode: PersonalDataProcessingMode;
  operatorEducationOrganizationId: number | null;
  operatorFullNameSnapshot: string;
  operatorShortNameSnapshot: string | null;
  operatorPrivacyPolicyUrlSnapshot: string;
  operatorConsentDocumentUrlSnapshot: string | null;
  logoUrl: string | null;
};

export const resolvePersonalDataOperator = async (
  prisma: PrismaService,
  processingMode: PersonalDataProcessingMode,
  educationOrganizationId?: number | null,
  platformOperatorFullName = PUBLIC_OPERATOR_FULL_NAME,
): Promise<ResolvedPersonalDataOperator> => {
  if (processingMode === 'PUBLIC') {
    return {
      processingMode,
      operatorEducationOrganizationId: null,
      operatorFullNameSnapshot:
        normalizeNullableString(platformOperatorFullName) ?? PUBLIC_OPERATOR_FULL_NAME,
      operatorShortNameSnapshot: null,
      operatorPrivacyPolicyUrlSnapshot: PUBLIC_PRIVACY_POLICY_URL,
      operatorConsentDocumentUrlSnapshot: null,
      logoUrl: null,
    };
  }

  if (!educationOrganizationId) {
    throw new BadRequestException('Выберите учебное заведение для режима обработки по поручению');
  }

  const organization = await prisma.educationOrganization.findUnique({
    where: { id: educationOrganizationId },
    select: {
      id: true,
      isActive: true,
      fullName: true,
      shortName: true,
      privacyPolicyUrl: true,
      consentDocumentUrl: true,
      logoUrl: true,
    },
  });

  if (!organization) {
    throw new NotFoundException('Учебное заведение не найдено');
  }

  if (!organization.isActive) {
    throw new BadRequestException('Выбранное учебное заведение неактивно');
  }

  const fullName = normalizeNullableString(organization.fullName);
  const shortName = normalizeNullableString(organization.shortName);
  const privacyPolicyUrl = normalizeNullableString(organization.privacyPolicyUrl);

  if (!fullName) {
    throw new BadRequestException('Укажите полное наименование учебного заведения');
  }

  if (!shortName) {
    throw new BadRequestException('Укажите краткое наименование учебного заведения');
  }

  if (!privacyPolicyUrl) {
    throw new BadRequestException('Укажите ссылку на Политику обработки ПДн учебного заведения');
  }

  return {
    processingMode,
    operatorEducationOrganizationId: organization.id,
    operatorFullNameSnapshot: fullName,
    operatorShortNameSnapshot: shortName,
    operatorPrivacyPolicyUrlSnapshot: privacyPolicyUrl,
    operatorConsentDocumentUrlSnapshot: normalizeNullableString(organization.consentDocumentUrl),
    logoUrl: normalizeNullableString(organization.logoUrl),
  };
};
