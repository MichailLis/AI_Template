import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma.service';
import { resolvePersonalDataOperator } from './tests-personal-data-operator';

describe('resolvePersonalDataOperator', () => {
  const prismaMock = {
    educationOrganization: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the exact platform operator for PUBLIC without reading an organization', async () => {
    await expect(
      resolvePersonalDataOperator(prismaMock as unknown as PrismaService, 'PUBLIC', 42),
    ).resolves.toEqual({
      processingMode: 'PUBLIC',
      operatorEducationOrganizationId: null,
      operatorFullNameSnapshot: 'АНО «Центр развития компьютерного спорта и цифровых технологий»',
      operatorShortNameSnapshot: null,
      operatorPrivacyPolicyUrlSnapshot: '/privacy',
      operatorConsentDocumentUrlSnapshot: null,
      logoUrl: null,
    });
    expect(prismaMock.educationOrganization.findUnique).not.toHaveBeenCalled();
  });

  it('resolves and trims a complete active education organization operator', async () => {
    prismaMock.educationOrganization.findUnique.mockResolvedValue({
      id: 7,
      isActive: true,
      fullName: '  ГБОУ Полное  ',
      shortName: '  ГБОУ  ',
      privacyPolicyUrl: '  https://school.example/privacy  ',
      consentDocumentUrl: '  https://school.example/consent  ',
      logoUrl: '  https://school.example/logo.svg  ',
    });

    await expect(
      resolvePersonalDataOperator(
        prismaMock as unknown as PrismaService,
        'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        7,
      ),
    ).resolves.toEqual({
      processingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
      operatorEducationOrganizationId: 7,
      operatorFullNameSnapshot: 'ГБОУ Полное',
      operatorShortNameSnapshot: 'ГБОУ',
      operatorPrivacyPolicyUrlSnapshot: 'https://school.example/privacy',
      operatorConsentDocumentUrlSnapshot: 'https://school.example/consent',
      logoUrl: 'https://school.example/logo.svg',
    });
  });

  it('requires an organization id for processing on its behalf', async () => {
    await expect(
      resolvePersonalDataOperator(
        prismaMock as unknown as PrismaService,
        'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        null,
      ),
    ).rejects.toThrow(BadRequestException);
    await expect(
      resolvePersonalDataOperator(
        prismaMock as unknown as PrismaService,
        'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        null,
      ),
    ).rejects.toThrow('Выберите учебное заведение для режима обработки по поручению');
  });

  it('rejects a missing or inactive education organization', async () => {
    prismaMock.educationOrganization.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
      id: 7,
      isActive: false,
      fullName: 'ГБОУ Полное',
      shortName: 'ГБОУ',
      privacyPolicyUrl: 'https://school.example/privacy',
      consentDocumentUrl: null,
      logoUrl: null,
    });

    await expect(
      resolvePersonalDataOperator(
        prismaMock as unknown as PrismaService,
        'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        404,
      ),
    ).rejects.toThrow(NotFoundException);
    await expect(
      resolvePersonalDataOperator(
        prismaMock as unknown as PrismaService,
        'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        7,
      ),
    ).rejects.toThrow('Выбранное учебное заведение неактивно');
  });

  it.each([
    ['fullName', '   ', 'Укажите полное наименование учебного заведения'],
    ['shortName', null, 'Укажите краткое наименование учебного заведения'],
    ['privacyPolicyUrl', null, 'Укажите ссылку на Политику обработки ПДн'],
  ] as const)('rejects incomplete operator field %s', async (field, value, message) => {
    prismaMock.educationOrganization.findUnique.mockResolvedValue({
      id: 7,
      isActive: true,
      fullName: 'ГБОУ Полное',
      shortName: 'ГБОУ',
      privacyPolicyUrl: 'https://school.example/privacy',
      consentDocumentUrl: null,
      logoUrl: null,
      [field]: value,
    });

    await expect(
      resolvePersonalDataOperator(
        prismaMock as unknown as PrismaService,
        'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
        7,
      ),
    ).rejects.toThrow(message);
  });
});
