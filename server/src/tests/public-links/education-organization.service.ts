import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { GroupOrClassValidationMode, Prisma } from '@prisma/client';

import { collectAuditChanges } from '../../audit/audit-changes';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma.service';
import type {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationsListQueryDto,
  AdminUpdateEducationOrganizationDto,
} from '../dto/tests-links.dto';
import { matchesGroupPattern } from '../session/session-profile';
import { isValidInn, isValidOgrn } from '../shared/organization-requisites';
import {
  resolvePersonalDataOperator,
  toOperatorSnapshotData,
  type ResolvedPersonalDataOperator,
} from '../shared/personal-data-operator';

const PERSONAL_DATA_ON_BEHALF_MODE = 'ON_BEHALF_OF_EDUCATION_ORGANIZATION';

/** Поля заведения, из которых собирается снимок оператора ПДн у ссылки. */
const OPERATOR_SNAPSHOT_FIELDS = [
  'fullName',
  'shortName',
  'privacyPolicyUrl',
  'consentDocumentUrl',
] as const;

/** Реквизиты оператора ПДн и правила формата класса: всё это попадает в снимки у ссылок и попыток. */
const ORGANIZATION_AUDIT_FIELDS = [
  'name',
  'fullName',
  'shortName',
  'inn',
  'ogrn',
  'legalAddress',
  'email',
  'phone',
  'privacyPolicyUrl',
  'consentDocumentUrl',
  'logoUrl',
  'isActive',
  'groupValidationMode',
  'groupValidationPattern',
  'groupValidationExample',
  'groupValidationHint',
] as const;

const EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE =
  'Учебное заведение с таким названием уже существует';

const isPrismaUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';

const normalizeNullableString = (value?: string | null) => value?.trim() || null;

/**
 * Формат ИНН/ОГРН проверяется только у значений, которые правка меняет: уже сохранённое
 * некорректное значение не должно ломать остальные правки заведения.
 */
const assertRequisitesFormat = (
  dto: { inn?: string | null; ogrn?: string | null },
  existing?: { inn: string | null; ogrn: string | null },
) => {
  const inn = normalizeNullableString(dto.inn);
  const ogrn = normalizeNullableString(dto.ogrn);

  if (inn && inn !== existing?.inn && !isValidInn(inn)) {
    throw new BadRequestException('ИНН должен состоять из 10 или 12 цифр');
  }

  if (ogrn && ogrn !== existing?.ogrn && !isValidOgrn(ogrn)) {
    throw new BadRequestException('ОГРН должен состоять из 13 цифр (для ИП — из 15)');
  }
};

const isPersonalDataReady = (organization: {
  isActive: boolean;
  fullName: string | null;
  shortName: string | null;
  privacyPolicyUrl: string | null;
}) =>
  organization.isActive &&
  Boolean(organization.fullName?.trim()) &&
  Boolean(organization.shortName?.trim()) &&
  Boolean(organization.privacyPolicyUrl?.trim());

const EMPTY_ORGANIZATION_STATS = { linksCount: 0, activeLinksCount: 0, attemptsCount: 0 };

const EDUCATION_ORGANIZATIONS_ORDER: Prisma.EducationOrganizationOrderByWithRelationInput[] = [
  { isActive: 'desc' },
  { name: 'asc' },
];

@Injectable()
export class TestsEducationOrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /** История заведения: кто и когда менял реквизиты, которые попадают в согласие ученика. */
  async getEducationOrganizationHistory(organizationId: number) {
    const organization = await this.prisma.educationOrganization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!organization) {
      throw new NotFoundException('Учебное заведение не найдено');
    }

    return {
      events: await this.auditService.listForEntity('EDUCATION_ORGANIZATION', organizationId),
    };
  }

  /**
   * `checkExample` выключен, когда правка не трогает ни шаблон, ни пример: уже сохранённый
   * несовпадающий пример не должен блокировать правку телефона или названия.
   */
  private normalizeGroupValidationConfig(
    value: {
      groupValidationMode?: GroupOrClassValidationMode;
      groupValidationPattern?: string | null;
      groupValidationExample?: string | null;
      groupValidationHint?: string | null;
    },
    checkExample = true,
  ) {
    const mode = value.groupValidationMode ?? 'NONE';
    const pattern = value.groupValidationPattern?.trim() || null;
    const example = value.groupValidationExample?.trim() || null;
    const hint = value.groupValidationHint?.trim() || null;

    if (mode === 'NONE') {
      return {
        groupValidationMode: mode,
        groupValidationPattern: null,
        groupValidationExample: null,
        groupValidationHint: null,
      };
    }

    if (!pattern) {
      throw new BadRequestException('Укажите шаблон формата группы/класса для выбранного режима');
    }

    if (checkExample && example && !matchesGroupPattern(example, pattern)) {
      throw new BadRequestException('Пример не подходит под шаблон формата группы/класса');
    }

    return {
      groupValidationMode: mode,
      groupValidationPattern: pattern,
      groupValidationExample: example,
      groupValidationHint: hint,
    };
  }

  private mapEducationOrganization(
    organization: {
      id: number;
      name: string;
      fullName: string | null;
      shortName: string | null;
      inn: string | null;
      ogrn: string | null;
      legalAddress: string | null;
      email: string | null;
      phone: string | null;
      privacyPolicyUrl: string | null;
      consentDocumentUrl: string | null;
      logoUrl: string | null;
      isActive: boolean;
      groupValidationMode: GroupOrClassValidationMode;
      groupValidationPattern: string | null;
      groupValidationExample: string | null;
      groupValidationHint: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
    stats: {
      linksCount: number;
      activeLinksCount: number;
      attemptsCount: number;
    },
  ) {
    return {
      id: organization.id,
      name: organization.name,
      fullName: normalizeNullableString(organization.fullName),
      shortName: normalizeNullableString(organization.shortName),
      inn: normalizeNullableString(organization.inn),
      ogrn: normalizeNullableString(organization.ogrn),
      legalAddress: normalizeNullableString(organization.legalAddress),
      email: normalizeNullableString(organization.email),
      phone: normalizeNullableString(organization.phone),
      privacyPolicyUrl: normalizeNullableString(organization.privacyPolicyUrl),
      consentDocumentUrl: normalizeNullableString(organization.consentDocumentUrl),
      logoUrl: normalizeNullableString(organization.logoUrl),
      personalDataReady: isPersonalDataReady(organization),
      isActive: organization.isActive,
      groupValidationMode: organization.groupValidationMode,
      groupValidationPattern: organization.groupValidationPattern,
      groupValidationExample: organization.groupValidationExample,
      groupValidationHint: organization.groupValidationHint,
      linksCount: stats.linksCount,
      activeLinksCount: stats.activeLinksCount,
      attemptsCount: stats.attemptsCount,
      createdAt: organization.createdAt.toISOString(),
      updatedAt: organization.updatedAt.toISOString(),
    };
  }

  private async getOrganizationStatsByIds(organizationIds: number[]) {
    const statsMap = new Map<
      number,
      {
        linksCount: number;
        activeLinksCount: number;
        attemptsCount: number;
      }
    >();

    for (const organizationId of organizationIds) {
      statsMap.set(organizationId, {
        linksCount: 0,
        activeLinksCount: 0,
        attemptsCount: 0,
      });
    }

    if (organizationIds.length === 0) {
      return statsMap;
    }

    const links = await this.prisma.testPublicLink.findMany({
      where: {
        educationOrganizationId: {
          in: organizationIds,
        },
      },
      select: {
        educationOrganizationId: true,
        isActive: true,
        _count: {
          select: {
            attempts: true,
          },
        },
      },
    });

    for (const link of links) {
      if (!link.educationOrganizationId) {
        continue;
      }

      const currentStats = statsMap.get(link.educationOrganizationId);

      if (!currentStats) {
        continue;
      }

      currentStats.linksCount += 1;
      currentStats.attemptsCount += link._count.attempts;

      if (link.isActive) {
        currentStats.activeLinksCount += 1;
      }
    }

    return statsMap;
  }

  async ensureActiveEducationOrganizationIfProvided(educationOrganizationId?: number | null) {
    if (!educationOrganizationId) {
      return null;
    }

    const organization = await this.prisma.educationOrganization.findUnique({
      where: { id: educationOrganizationId },
      select: { id: true, isActive: true },
    });

    if (!organization || !organization.isActive) {
      throw new BadRequestException('Выбранное учебное заведение недоступно');
    }

    return organization.id;
  }

  async listEducationOrganizations(query: AdminEducationOrganizationsListQueryDto = {}) {
    if (query.needsPersonalData) {
      return this.listOrganizationsNeedingPersonalData(query);
    }

    const total = await this.prisma.educationOrganization.count();
    const isPaginated = query.page !== undefined || query.limit !== undefined;
    const page = query.page ?? 1;
    const limit = query.limit ?? (isPaginated ? 10 : Math.max(total, 1));
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(page, totalPages);
    const findManyArgs: Prisma.EducationOrganizationFindManyArgs = {
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    };

    if (isPaginated) {
      findManyArgs.skip = (currentPage - 1) * limit;
      findManyArgs.take = limit;
    }

    const organizations = await this.prisma.educationOrganization.findMany(findManyArgs);

    const statsByOrganizationId = await this.getOrganizationStatsByIds(
      organizations.map((organization) => organization.id),
    );

    return {
      page: currentPage,
      limit,
      total,
      totalPages,
      organizations: organizations.map((organization) =>
        this.mapEducationOrganization(
          organization,
          statsByOrganizationId.get(organization.id) ?? EMPTY_ORGANIZATION_STATS,
        ),
      ),
    };
  }

  /**
   * Готовность реквизитов вычисляется в коде (isPersonalDataReady), а не хранится в базе, поэтому
   * фильтр и пагинация идут в памяти: так список совпадает с бейджем, а заведений немного.
   */
  private async listOrganizationsNeedingPersonalData(
    query: AdminEducationOrganizationsListQueryDto,
  ) {
    const organizations = (
      await this.prisma.educationOrganization.findMany({ orderBy: EDUCATION_ORGANIZATIONS_ORDER })
    ).filter((organization) => !isPersonalDataReady(organization));

    const total = organizations.length;
    const isPaginated = query.page !== undefined || query.limit !== undefined;
    const limit = query.limit ?? (isPaginated ? 10 : Math.max(total, 1));
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const currentPage = Math.min(query.page ?? 1, totalPages);
    const pageOrganizations = organizations.slice((currentPage - 1) * limit, currentPage * limit);

    const statsByOrganizationId = await this.getOrganizationStatsByIds(
      pageOrganizations.map((organization) => organization.id),
    );

    return {
      page: currentPage,
      limit,
      total,
      totalPages,
      organizations: pageOrganizations.map((organization) =>
        this.mapEducationOrganization(
          organization,
          statsByOrganizationId.get(organization.id) ?? EMPTY_ORGANIZATION_STATS,
        ),
      ),
    };
  }

  async createEducationOrganization(userId: number, dto: AdminCreateEducationOrganizationDto) {
    const name = dto.name.trim();

    const existing = await this.prisma.educationOrganization.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE);
    }

    assertRequisitesFormat(dto);

    const validationConfig = this.normalizeGroupValidationConfig({
      groupValidationMode: dto.groupValidationMode,
      groupValidationPattern: dto.groupValidationPattern,
      groupValidationExample: dto.groupValidationExample,
      groupValidationHint: dto.groupValidationHint,
    });

    const created = await this.createEducationOrganizationRecord(userId, {
      name,
      fullName: normalizeNullableString(dto.fullName),
      shortName: normalizeNullableString(dto.shortName),
      inn: normalizeNullableString(dto.inn),
      ogrn: normalizeNullableString(dto.ogrn),
      legalAddress: normalizeNullableString(dto.legalAddress),
      email: normalizeNullableString(dto.email),
      phone: normalizeNullableString(dto.phone),
      privacyPolicyUrl: normalizeNullableString(dto.privacyPolicyUrl),
      consentDocumentUrl: normalizeNullableString(dto.consentDocumentUrl),
      logoUrl: normalizeNullableString(dto.logoUrl),
      ...validationConfig,
    });

    const statsByOrganizationId = await this.getOrganizationStatsByIds([created.id]);

    return this.mapEducationOrganization(
      created,
      statsByOrganizationId.get(created.id) ?? {
        linksCount: 0,
        activeLinksCount: 0,
        attemptsCount: 0,
      },
    );
  }

  async updateEducationOrganization(
    userId: number,
    organizationId: number,
    dto: AdminUpdateEducationOrganizationDto,
  ) {
    const existing = await this.prisma.educationOrganization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        fullName: true,
        shortName: true,
        inn: true,
        ogrn: true,
        legalAddress: true,
        email: true,
        phone: true,
        privacyPolicyUrl: true,
        consentDocumentUrl: true,
        logoUrl: true,
        isActive: true,
        groupValidationMode: true,
        groupValidationPattern: true,
        groupValidationExample: true,
        groupValidationHint: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Учебное заведение не найдено');
    }

    const nextName = dto.name?.trim() ?? existing.name;

    if (dto.name !== undefined) {
      const duplicate = await this.prisma.educationOrganization.findFirst({
        where: {
          id: {
            not: organizationId,
          },
          name: {
            equals: nextName,
            mode: 'insensitive',
          },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new BadRequestException(EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE);
      }
    }

    assertRequisitesFormat(dto, existing);

    const validationConfig = this.normalizeGroupValidationConfig(
      {
        groupValidationMode: dto.groupValidationMode ?? existing.groupValidationMode,
        groupValidationPattern:
          dto.groupValidationPattern !== undefined
            ? dto.groupValidationPattern
            : existing.groupValidationPattern,
        groupValidationExample:
          dto.groupValidationExample !== undefined
            ? dto.groupValidationExample
            : existing.groupValidationExample,
        groupValidationHint:
          dto.groupValidationHint !== undefined
            ? dto.groupValidationHint
            : existing.groupValidationHint,
      },
      dto.groupValidationPattern !== undefined || dto.groupValidationExample !== undefined,
    );

    const operatorChanged =
      OPERATOR_SNAPSHOT_FIELDS.some(
        (field) =>
          dto[field] !== undefined &&
          normalizeNullableString(dto[field]) !== normalizeNullableString(existing[field]),
      ) ||
      (dto.isActive === true && !existing.isActive);

    const updated = await this.updateEducationOrganizationRecord(
      userId,
      existing,
      operatorChanged,
      {
        ...(dto.name !== undefined ? { name: nextName } : {}),
        ...(dto.fullName !== undefined ? { fullName: normalizeNullableString(dto.fullName) } : {}),
        ...(dto.shortName !== undefined
          ? { shortName: normalizeNullableString(dto.shortName) }
          : {}),
        ...(dto.inn !== undefined ? { inn: normalizeNullableString(dto.inn) } : {}),
        ...(dto.ogrn !== undefined ? { ogrn: normalizeNullableString(dto.ogrn) } : {}),
        ...(dto.legalAddress !== undefined
          ? { legalAddress: normalizeNullableString(dto.legalAddress) }
          : {}),
        ...(dto.email !== undefined ? { email: normalizeNullableString(dto.email) } : {}),
        ...(dto.phone !== undefined ? { phone: normalizeNullableString(dto.phone) } : {}),
        ...(dto.privacyPolicyUrl !== undefined
          ? { privacyPolicyUrl: normalizeNullableString(dto.privacyPolicyUrl) }
          : {}),
        ...(dto.consentDocumentUrl !== undefined
          ? { consentDocumentUrl: normalizeNullableString(dto.consentDocumentUrl) }
          : {}),
        ...(dto.logoUrl !== undefined ? { logoUrl: normalizeNullableString(dto.logoUrl) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...validationConfig,
      },
    );

    const statsByOrganizationId = await this.getOrganizationStatsByIds([updated.id]);

    return this.mapEducationOrganization(
      updated,
      statsByOrganizationId.get(updated.id) ?? {
        linksCount: 0,
        activeLinksCount: 0,
        attemptsCount: 0,
      },
    );
  }

  private async refreshLinkOperatorSnapshots(tx: Prisma.TransactionClient, organizationId: number) {
    const where = {
      educationOrganizationId: organizationId,
      personalDataProcessingMode: PERSONAL_DATA_ON_BEHALF_MODE,
      archivedAt: null,
    } satisfies Prisma.TestPublicLinkWhereInput;

    if ((await tx.testPublicLink.count({ where })) === 0) {
      return;
    }

    let operator: ResolvedPersonalDataOperator;

    try {
      operator = await resolvePersonalDataOperator(
        tx,
        PERSONAL_DATA_ON_BEHALF_MODE,
        organizationId,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new ConflictException(
          `У заведения есть действующие ссылки обработки ПДн от его имени, поэтому реквизиты нельзя оставить неполными. ${error.message}`,
        );
      }

      throw error;
    }

    await tx.testPublicLink.updateMany({ where, data: toOperatorSnapshotData(operator) });
  }

  private async createEducationOrganizationRecord(
    userId: number,
    data: Prisma.EducationOrganizationCreateInput,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const created = await tx.educationOrganization.create({ data });

        await this.auditService.record(
          {
            entityType: 'EDUCATION_ORGANIZATION',
            entityId: created.id,
            action: 'EDUCATION_ORGANIZATION_CREATED',
            actorUserId: userId,
            changes: collectAuditChanges({}, created, { fields: ORGANIZATION_AUDIT_FIELDS }),
          },
          tx,
        );

        return created;
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new BadRequestException(EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE);
      }

      throw error;
    }
  }

  /**
   * Ссылки «по поручению» хранят снимок реквизитов заведения, и ученик видит именно его. Поэтому
   * правка реквизитов в одной транзакции с сохранением заведения пересчитывает снимок у всех
   * неархивных ссылок; если после правки реквизитов не хватает, а ссылки есть, правка отклоняется.
   * Попытки не трогаем: их снимок — запись того, на что ученик согласился.
   */
  private async updateEducationOrganizationRecord(
    userId: number,
    existing: Record<string, unknown> & { id: number },
    refreshLinkSnapshots: boolean,
    data: Prisma.EducationOrganizationUpdateInput,
  ) {
    const organizationId = existing.id;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.educationOrganization.update({
          where: { id: organizationId },
          data,
        });
        const changes = collectAuditChanges(existing, updated, {
          fields: ORGANIZATION_AUDIT_FIELDS,
        });

        if (changes.length > 0) {
          await this.auditService.record(
            {
              entityType: 'EDUCATION_ORGANIZATION',
              entityId: organizationId,
              action: 'EDUCATION_ORGANIZATION_UPDATED',
              actorUserId: userId,
              changes,
            },
            tx,
          );
        }

        if (refreshLinkSnapshots && updated.isActive) {
          await this.refreshLinkOperatorSnapshots(tx, organizationId);
        }

        return updated;
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new BadRequestException(EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE);
      }

      throw error;
    }
  }
}
