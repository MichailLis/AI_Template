import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { GroupOrClassValidationMode } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import type {
  AdminCreateEducationOrganizationDto,
  AdminCreatePublicLinkDto,
  AdminUpdateEducationOrganizationDto,
  AdminUpdatePublicLinkDto,
} from './dto/tests-links.dto';
import type { PublicLinkAccessResponseDto } from './dto/tests-public.dto';
import { ensureTestsAdminAccess } from './tests-admin-access.utils';
import { parseDateOrNull } from './tests-date.utils';
import { mapAdminPublicLink, toOptionalIsoString } from './tests-public-link.mapper';
import {
  publicLinkAccessInclude,
  publicLinkAdminInclude,
  type PublicLinkWithTopicVersion,
} from './tests-public-link.query';
import { createShortCodeCandidate } from './tests-domain.utils';

const DEFAULT_MAX_ATTEMPTS = 1;
const DEFAULT_ALLOW_RESUME = true;

/**
 * Сервис публичных ссылок для прохождения теста.
 *
 * Ключевые инварианты:
 * - доступ к админским операциям только для роли ADMIN;
 * - публичная ссылка всегда указывает на опубликованную версию теста;
 * - удаление в UI реализовано как архивирование, чтобы не терять историю прохождений.
 */
@Injectable()
export class TestsPublicLinkService {
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

  private async ensureActiveEducationOrganizationIfProvided(
    educationOrganizationId?: number | null,
  ) {
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

  private async ensurePublishedVersion(versionId: number) {
    const version = await this.prisma.testTopicVersion.findUnique({
      where: { id: versionId },
      select: {
        id: true,
        topicId: true,
        status: true,
      },
    });

    if (!version) {
      throw new NotFoundException('Published version not found');
    }

    if (version.status !== 'PUBLISHED') {
      throw new BadRequestException('Public link can be created only for published test version');
    }

    return version;
  }

  private async ensureUniqueShortCode(explicitShortCode?: string) {
    if (explicitShortCode) {
      const normalizedCode = explicitShortCode.trim().toUpperCase();
      const existing = await this.prisma.testPublicLink.findUnique({
        where: { shortCode: normalizedCode },
        select: { id: true },
      });

      if (existing) {
        throw new BadRequestException(`Public link short code "${normalizedCode}" already exists`);
      }

      return normalizedCode;
    }

    // Ограничиваем количество попыток, чтобы при высоких коллизиях не зависать
    // в бесконечном цикле и явно сигнализировать о проблеме вызывающему коду.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const candidate = createShortCodeCandidate();
      const existing = await this.prisma.testPublicLink.findUnique({
        where: { shortCode: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }
    }

    throw new BadRequestException('Unable to generate unique short code for public link');
  }

  async createPublicLink(userId: number, dto: AdminCreatePublicLinkDto) {
    await ensureTestsAdminAccess(this.prisma, userId);
    await this.ensurePublishedVersion(dto.publishedVersionId);
    const educationOrganizationId = await this.ensureActiveEducationOrganizationIfProvided(
      dto.educationOrganizationId,
    );

    const shortCode = await this.ensureUniqueShortCode(dto.shortCode);

    const created = await this.prisma.testPublicLink.create({
      data: {
        topicVersionId: dto.publishedVersionId,
        shortCode,
        isActive: dto.isActive ?? true,
        startsAt: parseDateOrNull(dto.startsAt),
        endsAt: parseDateOrNull(dto.endsAt),
        maxAttemptsPerStudent: dto.maxAttemptsPerStudent ?? DEFAULT_MAX_ATTEMPTS,
        timeLimitMinutes: dto.timeLimitMinutes ?? null,
        allowResume: dto.allowResume ?? DEFAULT_ALLOW_RESUME,
        educationOrganizationId,
        consentVersion: dto.consentVersion,
        consentTextSnapshot: dto.consentText,
        createdByUserId: userId,
      },
      include: publicLinkAdminInclude,
    });

    return mapAdminPublicLink(created);
  }

  async listPublicLinks(userId: number) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const links = await this.prisma.testPublicLink.findMany({
      where: {
        archivedAt: null,
      },
      include: publicLinkAdminInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      links: links.map((link) => mapAdminPublicLink(link)),
    };
  }

  async listArchivedPublicLinks(userId: number) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const links = await this.prisma.testPublicLink.findMany({
      where: {
        archivedAt: {
          not: null,
        },
      },
      include: publicLinkAdminInclude,
      orderBy: {
        archivedAt: 'desc',
      },
    });

    return {
      links: links.map((link) => mapAdminPublicLink(link)),
    };
  }

  async updatePublicLink(userId: number, linkId: number, dto: AdminUpdatePublicLinkDto) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const educationOrganizationId =
      dto.educationOrganizationId !== undefined
        ? await this.ensureActiveEducationOrganizationIfProvided(dto.educationOrganizationId)
        : undefined;

    const existing = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true, archivedAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Public link not found');
    }

    if (existing.archivedAt) {
      throw new NotFoundException('Public link not found');
    }

    const updated = await this.prisma.testPublicLink.update({
      where: { id: linkId },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: parseDateOrNull(dto.startsAt) } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: parseDateOrNull(dto.endsAt) } : {}),
        ...(dto.maxAttemptsPerStudent !== undefined
          ? { maxAttemptsPerStudent: dto.maxAttemptsPerStudent }
          : {}),
        ...(dto.timeLimitMinutes !== undefined ? { timeLimitMinutes: dto.timeLimitMinutes } : {}),
        ...(dto.allowResume !== undefined ? { allowResume: dto.allowResume } : {}),
        ...(educationOrganizationId !== undefined ? { educationOrganizationId } : {}),
        ...(dto.consentVersion !== undefined ? { consentVersion: dto.consentVersion } : {}),
        ...(dto.consentText !== undefined ? { consentTextSnapshot: dto.consentText } : {}),
      },
      include: publicLinkAdminInclude,
    });

    return mapAdminPublicLink(updated);
  }

  async regeneratePublicLinkShortCode(userId: number, linkId: number) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const existing = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true, archivedAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Public link not found');
    }

    if (existing.archivedAt) {
      throw new NotFoundException('Public link not found');
    }

    const shortCode = await this.ensureUniqueShortCode();

    const updated = await this.prisma.testPublicLink.update({
      where: { id: linkId },
      data: {
        shortCode,
      },
      include: publicLinkAdminInclude,
    });

    return mapAdminPublicLink(updated);
  }

  /**
   * Архивирует публичную ссылку вместо hard delete.
   *
   * Причина: статистика и результаты прохождений должны оставаться доступными в админской аналитике.
   */
  async deletePublicLink(userId: number, linkId: number) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const existing = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true, archivedAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Public link not found');
    }

    if (existing.archivedAt) {
      return {
        linkId,
      };
    }

    await this.prisma.testPublicLink.update({
      where: { id: linkId },
      data: {
        isActive: false,
        archivedAt: new Date(),
      },
    });

    return {
      linkId,
    };
  }

  async restorePublicLink(userId: number, linkId: number) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const existing = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true, archivedAt: true },
    });

    if (!existing) {
      throw new NotFoundException('Public link not found');
    }

    if (!existing.archivedAt) {
      const current = await this.prisma.testPublicLink.findUnique({
        where: { id: linkId },
        include: publicLinkAdminInclude,
      });

      if (!current) {
        throw new NotFoundException('Public link not found');
      }

      return mapAdminPublicLink(current);
    }

    const restored = await this.prisma.testPublicLink.update({
      where: { id: linkId },
      data: {
        archivedAt: null,
        isActive: true,
      },
      include: publicLinkAdminInclude,
    });

    return mapAdminPublicLink(restored);
  }

  /**
   * Возвращает ссылку только если она действительно доступна для публичного прохождения.
   *
   * Проверяем доступность централизованно, чтобы все consumers сервиса использовали
   * единые правила (архив, active-флаг, публикация версии, окно доступности).
   */
  async getAccessiblePublicLinkByCode(shortCode: string): Promise<PublicLinkWithTopicVersion> {
    const normalizedCode = shortCode.trim().toUpperCase();
    const link = await this.prisma.testPublicLink.findUnique({
      where: {
        shortCode: normalizedCode,
      },
      include: publicLinkAccessInclude,
    });

    if (!link) {
      throw new NotFoundException('Public test link not found');
    }

    // Специально маскируем архивную ссылку как "not found":
    // это не раскрывает пользователю, что код когда-то существовал.
    if (link.archivedAt) {
      throw new NotFoundException('Public test link not found');
    }

    if (!link.isActive) {
      throw new BadRequestException('Public test link is disabled');
    }

    if (link.topicVersion.status !== 'PUBLISHED') {
      throw new BadRequestException('Public test link points to unpublished test version');
    }

    const now = new Date();

    if (link.startsAt && now < link.startsAt) {
      throw new BadRequestException('Public test link is not active yet');
    }

    if (link.endsAt && now > link.endsAt) {
      throw new BadRequestException('Public test link has expired');
    }

    return link;
  }

  /**
   * Возвращает DTO для публичной entry-страницы без раскрытия лишних технических деталей.
   */
  async getPublicLinkAccessByCode(shortCode: string): Promise<PublicLinkAccessResponseDto> {
    const link = await this.getAccessiblePublicLinkByCode(shortCode);

    return {
      shortCode: link.shortCode,
      title: link.topicVersion.title,
      description: link.topicVersion.description,
      educationOrganization: link.educationOrganization?.name ?? null,
      groupValidationMode: link.educationOrganization?.groupValidationMode ?? 'NONE',
      groupValidationPattern: link.educationOrganization?.groupValidationPattern ?? null,
      groupValidationExample: link.educationOrganization?.groupValidationExample ?? null,
      groupValidationHint: link.educationOrganization?.groupValidationHint ?? null,
      questionCount: link.topicVersion._count.questions,
      maxAttemptsPerStudent: link.maxAttemptsPerStudent,
      timeLimitMinutes: link.timeLimitMinutes,
      allowResume: link.allowResume,
      startsAt: toOptionalIsoString(link.startsAt),
      endsAt: toOptionalIsoString(link.endsAt),
      consentVersion: link.consentVersion,
      consentText: link.consentTextSnapshot,
    };
  }

  async listEducationOrganizations(userId: number) {
    await ensureTestsAdminAccess(this.prisma, userId);

    const organizations = await this.prisma.educationOrganization.findMany({
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
    });

    const statsByOrganizationId = await this.getOrganizationStatsByIds(
      organizations.map((organization) => organization.id),
    );

    return {
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
    await ensureTestsAdminAccess(this.prisma, userId);

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
      throw new BadRequestException('Учебное заведение с таким названием уже существует');
    }

    const validationConfig = this.normalizeGroupValidationConfig({
      groupValidationMode: dto.groupValidationMode,
      groupValidationPattern: dto.groupValidationPattern,
      groupValidationExample: dto.groupValidationExample,
      groupValidationHint: dto.groupValidationHint,
    });

    const created = await this.prisma.educationOrganization.create({
      data: {
        name,
        ...validationConfig,
      },
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
    await ensureTestsAdminAccess(this.prisma, userId);

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
        throw new BadRequestException('Учебное заведение с таким названием уже существует');
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

    const updated = await this.prisma.educationOrganization.update({
      where: { id: organizationId },
      data: {
        ...(dto.name !== undefined ? { name: nextName } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...validationConfig,
      },
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
}
