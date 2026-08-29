import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { GroupOrClassValidationMode, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma.service';
import type {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationsListQueryDto,
  AdminUpdateEducationOrganizationDto,
} from '../dto/tests-links.dto';
import { ensureAdminAccess } from '../../common/authz/admin-access.utils';

const EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE =
  'Учебное заведение с таким названием уже существует';

const isPrismaUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';

const normalizeNullableString = (value?: string | null) => value?.trim() || null;

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

@Injectable()
export class TestsEducationOrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeGroupValidationConfig(value: {
    groupValidationMode?: GroupOrClassValidationMode;
    groupValidationPattern?: string | null;
    groupValidationExample?: string | null;
    groupValidationHint?: string | null;
  }) {
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

  async listEducationOrganizations(
    userId: number,
    query: AdminEducationOrganizationsListQueryDto = {},
  ) {
    await ensureAdminAccess(this.prisma, userId);

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
          statsByOrganizationId.get(organization.id) ?? {
            linksCount: 0,
            activeLinksCount: 0,
            attemptsCount: 0,
          },
        ),
      ),
    };
  }

  async createEducationOrganization(userId: number, dto: AdminCreateEducationOrganizationDto) {
    await ensureAdminAccess(this.prisma, userId);

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

    const validationConfig = this.normalizeGroupValidationConfig({
      groupValidationMode: dto.groupValidationMode,
      groupValidationPattern: dto.groupValidationPattern,
      groupValidationExample: dto.groupValidationExample,
      groupValidationHint: dto.groupValidationHint,
    });

    const created = await this.createEducationOrganizationRecord({
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
    await ensureAdminAccess(this.prisma, userId);

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

    const validationConfig = this.normalizeGroupValidationConfig({
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
    });

    const updated = await this.updateEducationOrganizationRecord(organizationId, {
      ...(dto.name !== undefined ? { name: nextName } : {}),
      ...(dto.fullName !== undefined ? { fullName: normalizeNullableString(dto.fullName) } : {}),
      ...(dto.shortName !== undefined ? { shortName: normalizeNullableString(dto.shortName) } : {}),
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
    });

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

  private async createEducationOrganizationRecord(data: Prisma.EducationOrganizationCreateInput) {
    try {
      return await this.prisma.educationOrganization.create({ data });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new BadRequestException(EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE);
      }

      throw error;
    }
  }

  private async updateEducationOrganizationRecord(
    organizationId: number,
    data: Prisma.EducationOrganizationUpdateInput,
  ) {
    try {
      return await this.prisma.educationOrganization.update({
        where: { id: organizationId },
        data,
      });
    } catch (error) {
      if (isPrismaUniqueConstraintError(error)) {
        throw new BadRequestException(EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE);
      }

      throw error;
    }
  }
}
