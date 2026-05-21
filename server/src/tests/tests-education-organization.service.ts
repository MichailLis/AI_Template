import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { GroupOrClassValidationMode, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import type {
  AdminCreateEducationOrganizationDto,
  AdminEducationOrganizationsListQueryDto,
  AdminUpdateEducationOrganizationDto,
} from './dto/tests-links.dto';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';

const EDUCATION_ORGANIZATION_DUPLICATE_MESSAGE =
  'Учебное заведение с таким названием уже существует';

const isPrismaUniqueConstraintError = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';

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
