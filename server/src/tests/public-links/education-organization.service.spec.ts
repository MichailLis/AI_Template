import { BadRequestException, ConflictException } from '@nestjs/common';

import type { AuditService } from '../../audit/audit.service';
import type { PrismaService } from '../../prisma.service';
import { TestsEducationOrganizationService } from '../public-links/education-organization.service';
import { createEducationOrganizationRecordFixture } from '../session/spec-fixtures';

type PrismaMock = {
  educationOrganization: {
    count: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  testPublicLink: {
    count: jest.Mock;
    findMany: jest.Mock;
    updateMany: jest.Mock;
  };
  $transaction: jest.Mock;
};

describe('TestsEducationOrganizationService', () => {
  let service: TestsEducationOrganizationService;
  let prismaMock: PrismaMock;

  beforeEach(() => {
    prismaMock = {
      educationOrganization: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      testPublicLink: {
        count: jest.fn().mockResolvedValue(0),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: PrismaMock) => Promise<unknown>) =>
        callback(prismaMock),
      ),
    };

    service = new TestsEducationOrganizationService(
      prismaMock as unknown as PrismaService,
      { record: jest.fn(), listForEntity: jest.fn() } as unknown as AuditService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Находка аудита UX-15: у всех заведений стояло «Реквизиты не заполнены», и найти те, что требуют
   * заполнения, можно было только листая страницы. Фильтр считает готовность тем же правилом, что и
   * бейдж, и пагинирует уже отфильтрованный список.
   */
  it('lists only organizations whose personal data details still need filling', async () => {
    const ready = createEducationOrganizationRecordFixture({
      id: 1,
      name: 'Готовый лицей',
      fullName: 'Полное имя',
      shortName: 'Краткое имя',
      privacyPolicyUrl: 'https://ready.example/privacy',
    });
    const missingPolicy = createEducationOrganizationRecordFixture({
      id: 2,
      name: 'Без политики',
      fullName: 'Полное имя',
      shortName: 'Краткое имя',
      privacyPolicyUrl: null,
    });
    const inactive = createEducationOrganizationRecordFixture({
      id: 3,
      name: 'Отключенный',
      fullName: 'Полное имя',
      shortName: 'Краткое имя',
      privacyPolicyUrl: 'https://inactive.example/privacy',
      isActive: false,
    });

    prismaMock.educationOrganization.count.mockResolvedValue(3);
    prismaMock.educationOrganization.findMany.mockResolvedValue([ready, missingPolicy, inactive]);
    prismaMock.testPublicLink.findMany.mockResolvedValue([]);

    const result = await (
      service.listEducationOrganizations as (query: {
        page: number;
        limit: number;
        needsPersonalData: boolean;
      }) => Promise<{ total: number; totalPages: number; organizations: Array<{ id: number }> }>
    )({ page: 1, limit: 1, needsPersonalData: true });

    expect(result.total).toBe(2);
    expect(result.totalPages).toBe(2);
    expect(result.organizations.map((organization) => organization.id)).toEqual([2]);
  });

  it('returns paginated education organizations with totals', async () => {
    const firstOrganization = createEducationOrganizationRecordFixture({
      id: 21,
      name: 'Гимназия 21',
      fullName: 'Государственная гимназия № 21',
      shortName: 'Гимназия № 21',
      privacyPolicyUrl: 'https://gym21.example/privacy',
    });
    const secondOrganization = createEducationOrganizationRecordFixture({
      id: 22,
      name: 'Лицей 22',
      isActive: false,
    });

    prismaMock.educationOrganization.count.mockResolvedValue(23);
    prismaMock.educationOrganization.findMany.mockResolvedValue([
      firstOrganization,
      secondOrganization,
    ]);
    prismaMock.testPublicLink.findMany.mockResolvedValue([
      {
        educationOrganizationId: 21,
        isActive: true,
        _count: {
          attempts: 4,
        },
      },
      {
        educationOrganizationId: 22,
        isActive: false,
        _count: {
          attempts: 2,
        },
      },
    ]);

    const result = await (
      service.listEducationOrganizations as (query: {
        page: number;
        limit: number;
      }) => Promise<unknown>
    )({ page: 3, limit: 10 });
    expect(prismaMock.educationOrganization.count).toHaveBeenCalledWith();
    expect(prismaMock.educationOrganization.findMany).toHaveBeenCalledWith({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      skip: 20,
      take: 10,
    });
    expect(result).toEqual({
      page: 3,
      limit: 10,
      total: 23,
      totalPages: 3,
      organizations: [
        {
          id: 21,
          name: 'Гимназия 21',
          fullName: 'Государственная гимназия № 21',
          shortName: 'Гимназия № 21',
          inn: null,
          ogrn: null,
          legalAddress: null,
          email: null,
          phone: null,
          privacyPolicyUrl: 'https://gym21.example/privacy',
          consentDocumentUrl: null,
          logoUrl: null,
          personalDataReady: true,
          isActive: true,
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationExample: null,
          groupValidationHint: null,
          linksCount: 1,
          activeLinksCount: 1,
          attemptsCount: 4,
          createdAt: firstOrganization.createdAt.toISOString(),
          updatedAt: firstOrganization.updatedAt.toISOString(),
        },
        {
          id: 22,
          name: 'Лицей 22',
          fullName: null,
          shortName: null,
          inn: null,
          ogrn: null,
          legalAddress: null,
          email: null,
          phone: null,
          privacyPolicyUrl: null,
          consentDocumentUrl: null,
          logoUrl: null,
          personalDataReady: false,
          isActive: false,
          groupValidationMode: 'NONE',
          groupValidationPattern: null,
          groupValidationExample: null,
          groupValidationHint: null,
          linksCount: 1,
          activeLinksCount: 0,
          attemptsCount: 2,
          createdAt: secondOrganization.createdAt.toISOString(),
          updatedAt: secondOrganization.updatedAt.toISOString(),
        },
      ],
    });
  });

  it('creates education organizations with trimmed names and case-insensitive duplicate check', async () => {
    const createdOrganization = createEducationOrganizationRecordFixture({
      id: 31,
      name: 'Лицей 42',
      fullName: 'Муниципальный лицей № 42',
      shortName: 'Лицей № 42',
      inn: '1234567890',
      ogrn: '1234567890123',
      legalAddress: 'Казань, ул. Примерная, 1',
      email: 'office@example.edu',
      phone: '+7 900 000-00-00',
      privacyPolicyUrl: 'https://example.edu/privacy',
      consentDocumentUrl: null,
      logoUrl: 'https://example.edu/logo.svg',
    });

    prismaMock.educationOrganization.findFirst.mockResolvedValue(null);
    prismaMock.educationOrganization.create.mockResolvedValue(createdOrganization);
    prismaMock.testPublicLink.findMany.mockResolvedValue([]);

    await service.createEducationOrganization(1, {
      name: '  Лицей 42  ',
      fullName: '  Муниципальный лицей № 42  ',
      shortName: '  Лицей № 42  ',
      inn: '  1234567890  ',
      ogrn: '  1234567890123  ',
      legalAddress: '  Казань, ул. Примерная, 1  ',
      email: '  office@example.edu  ',
      phone: '  +7 900 000-00-00  ',
      privacyPolicyUrl: '  https://example.edu/privacy  ',
      consentDocumentUrl: '   ',
      logoUrl: '  https://example.edu/logo.svg  ',
    });

    expect(prismaMock.educationOrganization.findFirst).toHaveBeenCalledWith({
      where: {
        name: {
          equals: 'Лицей 42',
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });
    expect(prismaMock.educationOrganization.create).toHaveBeenCalledWith({
      data: {
        name: 'Лицей 42',
        fullName: 'Муниципальный лицей № 42',
        shortName: 'Лицей № 42',
        inn: '1234567890',
        ogrn: '1234567890123',
        legalAddress: 'Казань, ул. Примерная, 1',
        email: 'office@example.edu',
        phone: '+7 900 000-00-00',
        privacyPolicyUrl: 'https://example.edu/privacy',
        consentDocumentUrl: null,
        logoUrl: 'https://example.edu/logo.svg',
        groupValidationMode: 'NONE',
        groupValidationPattern: null,
        groupValidationExample: null,
        groupValidationHint: null,
      },
    });
  });

  it('trims provided organization fields while preserving omitted update fields', async () => {
    const existing = createEducationOrganizationRecordFixture({
      id: 31,
      name: 'Лицей 42',
      fullName: 'Старое полное имя',
      shortName: 'Старое краткое имя',
      privacyPolicyUrl: 'https://example.edu/old-privacy',
    });
    const updated = createEducationOrganizationRecordFixture({
      ...existing,
      fullName: 'Новое полное имя',
      privacyPolicyUrl: null,
    });

    prismaMock.educationOrganization.findUnique.mockResolvedValue(existing);
    prismaMock.educationOrganization.update.mockResolvedValue(updated);
    prismaMock.testPublicLink.findMany.mockResolvedValue([]);

    await (
      service.updateEducationOrganization as (
        userId: number,
        organizationId: number,
        dto: Record<string, unknown>,
      ) => Promise<unknown>
    )(1, 31, {
      fullName: '  Новое полное имя  ',
      privacyPolicyUrl: '   ',
    });

    const updateMock = prismaMock.educationOrganization.update as jest.Mock<
      Promise<unknown>,
      [{ data: Record<string, unknown> }]
    >;
    const data = updateMock.mock.calls[0]?.[0].data;
    expect(data).toEqual({
      fullName: 'Новое полное имя',
      privacyPolicyUrl: null,
      groupValidationMode: 'NONE',
      groupValidationPattern: null,
      groupValidationExample: null,
      groupValidationHint: null,
    });
    expect(data).not.toHaveProperty('shortName');
    expect(data).not.toHaveProperty('consentDocumentUrl');
  });

  describe('format checks', () => {
    const update = (organizationId: number, dto: Record<string, unknown>) =>
      (
        service.updateEducationOrganization as (
          userId: number,
          organizationId: number,
          dto: Record<string, unknown>,
        ) => Promise<unknown>
      )(1, organizationId, dto);

    it('rejects a group example that does not match the pattern on create', async () => {
      prismaMock.educationOrganization.findFirst.mockResolvedValue(null);

      await expect(
        service.createEducationOrganization(1, {
          name: 'Лицей 42',
          groupValidationMode: 'STRICT',
          groupValidationPattern: '^\\d{1,2}[А-Я]$',
          groupValidationExample: '9 А',
        }),
      ).rejects.toThrow('Пример не подходит под шаблон формата группы/класса');
      expect(prismaMock.educationOrganization.create).not.toHaveBeenCalled();
    });

    it('checks the example against the stored pattern when only the example changes', async () => {
      prismaMock.educationOrganization.findUnique.mockResolvedValue(
        createEducationOrganizationRecordFixture({
          id: 31,
          groupValidationMode: 'STRICT',
          groupValidationPattern: '^\\d{1,2}[А-Я]$',
          groupValidationExample: '9А',
        }),
      );

      await expect(update(31, { groupValidationExample: '9 А' })).rejects.toThrow(
        'Пример не подходит под шаблон формата группы/класса',
      );
    });

    it('does not let a stored mismatching example block an unrelated edit', async () => {
      const existing = createEducationOrganizationRecordFixture({
        id: 31,
        groupValidationMode: 'STRICT',
        groupValidationPattern: '^\\d{1,2}[А-Я]$',
        groupValidationExample: '9 А',
      });
      prismaMock.educationOrganization.findUnique.mockResolvedValue(existing);
      prismaMock.educationOrganization.update.mockResolvedValue(existing);
      prismaMock.testPublicLink.findMany.mockResolvedValue([]);

      await expect(update(31, { phone: '+7 900 000-00-00' })).resolves.toBeDefined();
    });

    it.each([
      [{ inn: '12345' }, 'ИНН должен состоять из 10 или 12 цифр'],
      [{ ogrn: '123456789012' }, 'ОГРН должен состоять из 13 цифр (для ИП — из 15)'],
    ])('rejects malformed requisites %p on create', async (requisites, message) => {
      prismaMock.educationOrganization.findFirst.mockResolvedValue(null);

      await expect(
        service.createEducationOrganization(1, { name: 'Лицей 42', ...requisites }),
      ).rejects.toThrow(message);
    });

    it('checks requisites only when the update changes them', async () => {
      const existing = createEducationOrganizationRecordFixture({ id: 31, inn: '12345' });
      prismaMock.educationOrganization.findUnique.mockResolvedValue(existing);
      prismaMock.educationOrganization.update.mockResolvedValue(existing);
      prismaMock.testPublicLink.findMany.mockResolvedValue([]);

      await expect(update(31, { inn: '12345', phone: '+7 900' })).resolves.toBeDefined();
      await expect(update(31, { inn: '123456' })).rejects.toThrow(
        'ИНН должен состоять из 10 или 12 цифр',
      );
    });
  });

  describe('operator snapshot of on-behalf links', () => {
    const complete = {
      id: 31,
      fullName: 'Старое полное имя',
      shortName: 'Старое краткое имя',
      privacyPolicyUrl: 'https://example.edu/old-privacy',
    };
    const update = (dto: Record<string, unknown>) =>
      (
        service.updateEducationOrganization as (
          userId: number,
          organizationId: number,
          dto: Record<string, unknown>,
        ) => Promise<unknown>
      )(1, 31, dto);

    it('recomputes the snapshot of non-archived on-behalf links in the same transaction', async () => {
      const existing = createEducationOrganizationRecordFixture(complete);
      const updated = createEducationOrganizationRecordFixture({
        ...complete,
        privacyPolicyUrl: 'https://example.edu/new-privacy',
        consentDocumentUrl: 'https://example.edu/consent',
      });
      prismaMock.educationOrganization.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce(updated);
      prismaMock.educationOrganization.update.mockResolvedValue(updated);
      prismaMock.testPublicLink.count.mockResolvedValue(2);
      prismaMock.testPublicLink.findMany.mockResolvedValue([]);

      await update({
        privacyPolicyUrl: 'https://example.edu/new-privacy',
        consentDocumentUrl: 'https://example.edu/consent',
      });

      expect(prismaMock.testPublicLink.updateMany).toHaveBeenCalledWith({
        where: {
          educationOrganizationId: 31,
          personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
          archivedAt: null,
        },
        data: {
          personalDataProcessingMode: 'ON_BEHALF_OF_EDUCATION_ORGANIZATION',
          operatorFullNameSnapshot: 'Старое полное имя',
          operatorShortNameSnapshot: 'Старое краткое имя',
          operatorPrivacyPolicyUrlSnapshot: 'https://example.edu/new-privacy',
          operatorConsentDocumentUrlSnapshot: 'https://example.edu/consent',
        },
      });
    });

    it('rejects an edit that leaves the operator incomplete while links exist', async () => {
      const existing = createEducationOrganizationRecordFixture(complete);
      prismaMock.educationOrganization.findUnique
        .mockResolvedValueOnce(existing)
        .mockResolvedValueOnce({ ...existing, privacyPolicyUrl: null });
      prismaMock.educationOrganization.update.mockResolvedValue({
        ...existing,
        privacyPolicyUrl: null,
      });
      prismaMock.testPublicLink.count.mockResolvedValue(1);

      await expect(update({ privacyPolicyUrl: null })).rejects.toThrow(ConflictException);
      expect(prismaMock.testPublicLink.updateMany).not.toHaveBeenCalled();
    });

    it('allows leaving the operator incomplete when no link depends on it', async () => {
      const existing = createEducationOrganizationRecordFixture(complete);
      prismaMock.educationOrganization.findUnique.mockResolvedValue(existing);
      prismaMock.educationOrganization.update.mockResolvedValue({
        ...existing,
        privacyPolicyUrl: null,
      });
      prismaMock.testPublicLink.findMany.mockResolvedValue([]);

      await expect(update({ privacyPolicyUrl: null })).resolves.toBeDefined();
      expect(prismaMock.testPublicLink.updateMany).not.toHaveBeenCalled();
    });

    it('leaves links alone when the edit does not touch operator fields or deactivates the organization', async () => {
      const existing = createEducationOrganizationRecordFixture(complete);
      prismaMock.educationOrganization.findUnique.mockResolvedValue(existing);
      prismaMock.educationOrganization.update.mockResolvedValue(existing);
      prismaMock.testPublicLink.count.mockResolvedValue(3);
      prismaMock.testPublicLink.findMany.mockResolvedValue([]);

      await update({ phone: '+7 900 000-00-00' });
      prismaMock.educationOrganization.update.mockResolvedValue({ ...existing, isActive: false });
      await update({ fullName: 'Другое имя', isActive: false });

      expect(prismaMock.testPublicLink.updateMany).not.toHaveBeenCalled();
    });
  });

  it('rejects education organization duplicates regardless of name case', async () => {
    prismaMock.educationOrganization.findFirst.mockResolvedValue({ id: 31 });

    await expect(
      (
        service.createEducationOrganization as (
          userId: number,
          dto: { name: string },
        ) => Promise<unknown>
      )(1, {
        name: 'лицей 42',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.educationOrganization.create).not.toHaveBeenCalled();
  });

  it('maps database unique races to the same education organization duplicate error', async () => {
    prismaMock.educationOrganization.findFirst.mockResolvedValue(null);
    prismaMock.educationOrganization.create.mockRejectedValue({
      code: 'P2002',
      meta: { target: ['name'] },
    });

    await expect(
      (
        service.createEducationOrganization as (
          userId: number,
          dto: { name: string },
        ) => Promise<unknown>
      )(1, {
        name: 'Лицей 42',
      }),
    ).rejects.toThrow('Учебное заведение с таким названием уже существует');
  });
});
