import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { PersonalDataProcessingMode, Prisma } from '@prisma/client';

import { PrivacyPolicySettingsService } from '../../app-settings/privacy-policy-settings.service';
import { collectAuditChanges } from '../../audit/audit-changes';
import { AuditService } from '../../audit/audit.service';
import { PrismaService } from '../../prisma.service';
import type {
  AdminCreateEducationOrganizationDto,
  AdminCreatePublicLinkInput,
  AdminEducationOrganizationsListQueryDto,
  AdminUpdateEducationOrganizationDto,
  AdminUpdatePublicLinkDto,
} from '../dto/tests-links.dto';
import type { PublicLinkAccessResponseDto } from '../dto/tests-public.dto';
import { ensureAdminAccess } from '../../common/authz/admin-access.utils';
import { parseDateOrNull, toOptionalIsoString } from '../shared/date.utils';
import { createShortCodeCandidate } from '../shared/domain.utils';
import { TestsEducationOrganizationService } from '../public-links/education-organization.service';
import { toPrismaPublicBranding, toPublicBrandingResponse } from '../shared/public-branding.utils';
import { mapAdminPublicLink } from '../public-links/public-link.mapper';
import { ensurePublicLinkAccessible } from '../public-links/public-link-access';
import {
  PUBLIC_OPERATOR_FULL_NAME,
  PUBLIC_PRIVACY_POLICY_URL,
  resolvePersonalDataOperator,
  type ResolvedPersonalDataOperator,
} from '../shared/personal-data-operator';
import {
  publicLinkAccessInclude,
  publicLinkAdminInclude,
  type PublicLinkWithTopicVersion,
} from '../public-links/public-link.query';

const DEFAULT_MAX_ATTEMPTS = 1;
const DEFAULT_ALLOW_RESUME = true;
const DEFAULT_ENTRY_PROFILE_MODE = 'EDUCATION';
const DEFAULT_PUBLIC_TEMPLATE = 'STANDARD';
const DEFAULT_PERSONAL_DATA_PROCESSING_MODE = 'PUBLIC';
type EntryProfileMode = 'DEMOGRAPHIC' | 'EDUCATION' | 'EDUCATION_DEMOGRAPHIC';
type PublicTemplate = 'STANDARD' | 'POLUS';

const toOperatorSnapshotData = (operator: ResolvedPersonalDataOperator) => ({
  personalDataProcessingMode: operator.processingMode,
  operatorFullNameSnapshot: operator.operatorFullNameSnapshot,
  operatorShortNameSnapshot: operator.operatorShortNameSnapshot,
  operatorPrivacyPolicyUrlSnapshot: operator.operatorPrivacyPolicyUrlSnapshot,
  operatorConsentDocumentUrlSnapshot: operator.operatorConsentDocumentUrlSnapshot,
});

const toPublicPersonalData = (link: PublicLinkWithTopicVersion) => {
  const isPublicProcessing = link.personalDataProcessingMode === 'PUBLIC';

  return {
    processingMode: link.personalDataProcessingMode,
    operatorFullName: isPublicProcessing
      ? (link.operatorFullNameSnapshot ?? PUBLIC_OPERATOR_FULL_NAME)
      : link.operatorFullNameSnapshot!,
    operatorShortName: link.operatorShortNameSnapshot,
    privacyPolicyUrl: isPublicProcessing
      ? (link.operatorPrivacyPolicyUrlSnapshot ?? PUBLIC_PRIVACY_POLICY_URL)
      : link.operatorPrivacyPolicyUrlSnapshot!,
    consentDocumentUrl: link.operatorConsentDocumentUrlSnapshot,
    logoUrl: isPublicProcessing ? null : (link.educationOrganization?.logoUrl ?? null),
  };
};

const ensureValidPublicLinkDateValue = (value: Date | null) => {
  if (value && !Number.isFinite(value.getTime())) {
    throw new BadRequestException('Invalid public link date format');
  }
};

const ensureValidPublicLinkDateWindow = (startsAt: Date | null, endsAt: Date | null) => {
  ensureValidPublicLinkDateValue(startsAt);
  ensureValidPublicLinkDateValue(endsAt);

  if (startsAt && endsAt && endsAt.getTime() <= startsAt.getTime()) {
    throw new BadRequestException('endsAt must be greater than startsAt');
  }
};

const resolveDateUpdate = (value: string | null | undefined, fallback: Date | null) => {
  if (value === undefined) {
    return fallback;
  }

  return parseDateOrNull(value) ?? null;
};

const resolveMaxAttemptsForEntryProfileMode = (
  entryProfileMode: EntryProfileMode,
  requestedMaxAttempts: number | undefined,
) => {
  if (entryProfileMode === 'DEMOGRAPHIC') {
    return 1;
  }

  return requestedMaxAttempts ?? DEFAULT_MAX_ATTEMPTS;
};

/** Поля ссылки, которые пишутся в журнал значениями. */
const PUBLIC_LINK_AUDIT_FIELDS = [
  'shortCode',
  'topicVersionNumber',
  'isActive',
  'startsAt',
  'endsAt',
  'entryProfileMode',
  'publicTemplate',
  'maxAttemptsPerStudent',
  'timeLimitMinutes',
  'allowResume',
  'educationOrganizationId',
  'personalDataProcessingMode',
  'consentVersion',
] as const;

/** Длинный текст согласия и оформление страницы пишутся только фактом изменения. */
const PUBLIC_LINK_REDACTED_AUDIT_FIELDS = ['consentText', 'publicBranding'] as const;

const PUBLIC_LINK_AUDIT_SELECT = {
  shortCode: true,
  isActive: true,
  startsAt: true,
  endsAt: true,
  entryProfileMode: true,
  publicTemplate: true,
  maxAttemptsPerStudent: true,
  timeLimitMinutes: true,
  allowResume: true,
  educationOrganizationId: true,
  personalDataProcessingMode: true,
  consentVersion: true,
  consentTextSnapshot: true,
  publicBranding: true,
  topicVersion: { select: { versionNumber: true } },
} as const satisfies Prisma.TestPublicLinkSelect;

type PublicLinkAuditSource = Prisma.TestPublicLinkGetPayload<{
  select: typeof PUBLIC_LINK_AUDIT_SELECT;
}>;

const toPublicLinkAuditState = (link: PublicLinkAuditSource) => ({
  shortCode: link.shortCode,
  topicVersionNumber: link.topicVersion.versionNumber,
  isActive: link.isActive,
  startsAt: link.startsAt,
  endsAt: link.endsAt,
  entryProfileMode: link.entryProfileMode,
  publicTemplate: link.publicTemplate,
  maxAttemptsPerStudent: link.maxAttemptsPerStudent,
  timeLimitMinutes: link.timeLimitMinutes,
  allowResume: link.allowResume,
  educationOrganizationId: link.educationOrganizationId,
  personalDataProcessingMode: link.personalDataProcessingMode,
  consentVersion: link.consentVersion,
  consentText: link.consentTextSnapshot,
  publicBranding: link.publicBranding,
});

const collectPublicLinkChanges = (
  before: PublicLinkAuditSource | null,
  after: PublicLinkAuditSource,
) =>
  collectAuditChanges(before ? toPublicLinkAuditState(before) : {}, toPublicLinkAuditState(after), {
    fields: PUBLIC_LINK_AUDIT_FIELDS,
    redactedFields: PUBLIC_LINK_REDACTED_AUDIT_FIELDS,
  });

@Injectable()
export class TestsPublicLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly educationOrganizationService: TestsEducationOrganizationService,
    private readonly privacyPolicySettingsService: PrivacyPolicySettingsService,
    private readonly auditService: AuditService,
  ) {}

  private async resolveOperator(
    processingMode: PersonalDataProcessingMode,
    educationOrganizationId?: number | null,
  ) {
    const platformOperatorFullName =
      processingMode === 'PUBLIC'
        ? await this.privacyPolicySettingsService.getPlatformOperatorFullName()
        : undefined;

    return resolvePersonalDataOperator(
      this.prisma,
      processingMode,
      educationOrganizationId,
      platformOperatorFullName,
    );
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

  async createPublicLink(userId: number, dto: AdminCreatePublicLinkInput) {
    await ensureAdminAccess(this.prisma, userId);
    await this.ensurePublishedVersion(dto.publishedVersionId);
    const personalDataProcessingMode: PersonalDataProcessingMode =
      dto.personalDataProcessingMode ?? DEFAULT_PERSONAL_DATA_PROCESSING_MODE;
    const operator = await this.resolveOperator(
      personalDataProcessingMode,
      dto.educationOrganizationId,
    );
    const educationOrganizationId =
      personalDataProcessingMode === 'ON_BEHALF_OF_EDUCATION_ORGANIZATION'
        ? operator.operatorEducationOrganizationId
        : await this.educationOrganizationService.ensureActiveEducationOrganizationIfProvided(
            dto.educationOrganizationId,
          );

    const shortCode = await this.ensureUniqueShortCode(dto.shortCode);
    const entryProfileMode = dto.entryProfileMode ?? DEFAULT_ENTRY_PROFILE_MODE;
    const publicTemplate: PublicTemplate = dto.publicTemplate ?? DEFAULT_PUBLIC_TEMPLATE;
    const publicBranding = toPrismaPublicBranding(dto.publicBranding);
    const maxAttemptsPerStudent = resolveMaxAttemptsForEntryProfileMode(
      entryProfileMode,
      dto.maxAttemptsPerStudent,
    );
    const startsAt = resolveDateUpdate(dto.startsAt, null);
    const endsAt = resolveDateUpdate(dto.endsAt, null);

    ensureValidPublicLinkDateWindow(startsAt, endsAt);

    const created = await this.prisma.testPublicLink.create({
      data: {
        topicVersionId: dto.publishedVersionId,
        shortCode,
        isActive: dto.isActive ?? true,
        startsAt,
        endsAt,
        entryProfileMode,
        publicTemplate,
        ...(publicBranding !== undefined ? { publicBranding } : {}),
        maxAttemptsPerStudent,
        timeLimitMinutes: dto.timeLimitMinutes ?? null,
        allowResume: dto.allowResume ?? DEFAULT_ALLOW_RESUME,
        educationOrganizationId,
        ...toOperatorSnapshotData(operator),
        consentVersion: dto.consentVersion,
        consentTextSnapshot: dto.consentText,
        createdByUserId: userId,
      },
      include: publicLinkAdminInclude,
    });

    await this.auditService.record({
      entityType: 'PUBLIC_LINK',
      entityId: created.id,
      action: 'PUBLIC_LINK_CREATED',
      actorUserId: userId,
      changes: collectPublicLinkChanges(null, created),
    });

    return mapAdminPublicLink(created);
  }

  /** История доступна и у архивной ссылки: архивация — тоже событие ее жизни. */
  async getPublicLinkHistory(userId: number, linkId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const link = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true },
    });

    if (!link) {
      throw new NotFoundException('Public link not found');
    }

    return { events: await this.auditService.listForEntity('PUBLIC_LINK', linkId) };
  }

  async listPublicLinks(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

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
    await ensureAdminAccess(this.prisma, userId);

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
    await ensureAdminAccess(this.prisma, userId);

    const existing = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: {
        ...PUBLIC_LINK_AUDIT_SELECT,
        id: true,
        archivedAt: true,
        operatorFullNameSnapshot: true,
        operatorShortNameSnapshot: true,
        operatorPrivacyPolicyUrlSnapshot: true,
        operatorConsentDocumentUrlSnapshot: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Public link not found');
    }

    if (existing.archivedAt) {
      throw new NotFoundException('Public link not found');
    }

    const personalDataProcessingMode =
      dto.personalDataProcessingMode ?? existing.personalDataProcessingMode;
    const effectiveEducationOrganizationId =
      dto.educationOrganizationId !== undefined
        ? dto.educationOrganizationId
        : existing.educationOrganizationId;
    const processingModeChanged =
      personalDataProcessingMode !== existing.personalDataProcessingMode;
    const educationOrganizationChanged =
      dto.educationOrganizationId !== undefined &&
      dto.educationOrganizationId !== existing.educationOrganizationId;
    const shouldRefreshOperator = processingModeChanged || educationOrganizationChanged;
    let educationOrganizationId: number | null | undefined;
    let operator: ResolvedPersonalDataOperator | undefined;

    if (shouldRefreshOperator) {
      operator = await this.resolveOperator(
        personalDataProcessingMode,
        effectiveEducationOrganizationId,
      );
    }

    if (dto.educationOrganizationId !== undefined) {
      educationOrganizationId =
        personalDataProcessingMode === 'ON_BEHALF_OF_EDUCATION_ORGANIZATION'
          ? operator?.operatorEducationOrganizationId
          : await this.educationOrganizationService.ensureActiveEducationOrganizationIfProvided(
              dto.educationOrganizationId,
            );
    }

    const entryProfileMode = dto.entryProfileMode ?? existing.entryProfileMode;
    const maxAttemptsPerStudent = resolveMaxAttemptsForEntryProfileMode(
      entryProfileMode,
      dto.maxAttemptsPerStudent ?? existing.maxAttemptsPerStudent,
    );
    const startsAt = resolveDateUpdate(dto.startsAt, existing.startsAt);
    const endsAt = resolveDateUpdate(dto.endsAt, existing.endsAt);
    const publicBranding = toPrismaPublicBranding(dto.publicBranding);

    ensureValidPublicLinkDateWindow(startsAt, endsAt);

    const updated = await this.prisma.testPublicLink.update({
      where: { id: linkId },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.startsAt !== undefined ? { startsAt } : {}),
        ...(dto.endsAt !== undefined ? { endsAt } : {}),
        ...(dto.entryProfileMode !== undefined ? { entryProfileMode } : {}),
        ...(publicBranding !== undefined ? { publicBranding } : {}),
        maxAttemptsPerStudent,
        ...(dto.timeLimitMinutes !== undefined ? { timeLimitMinutes: dto.timeLimitMinutes } : {}),
        ...(dto.allowResume !== undefined ? { allowResume: dto.allowResume } : {}),
        ...(educationOrganizationId !== undefined ? { educationOrganizationId } : {}),
        ...(dto.personalDataProcessingMode !== undefined ? { personalDataProcessingMode } : {}),
        ...(operator ? toOperatorSnapshotData(operator) : {}),
        ...(dto.consentVersion !== undefined ? { consentVersion: dto.consentVersion } : {}),
        ...(dto.consentText !== undefined ? { consentTextSnapshot: dto.consentText } : {}),
      },
      include: publicLinkAdminInclude,
    });

    const changes = collectPublicLinkChanges(existing, updated);

    if (changes.length > 0) {
      await this.auditService.record({
        entityType: 'PUBLIC_LINK',
        entityId: linkId,
        action: 'PUBLIC_LINK_UPDATED',
        actorUserId: userId,
        changes,
      });
    }

    return mapAdminPublicLink(updated);
  }

  async regeneratePublicLinkShortCode(userId: number, linkId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const existing = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true, archivedAt: true, shortCode: true },
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

    await this.auditService.record({
      entityType: 'PUBLIC_LINK',
      entityId: linkId,
      action: 'PUBLIC_LINK_CODE_REGENERATED',
      actorUserId: userId,
      changes: collectAuditChanges(existing, updated, { fields: ['shortCode'] }),
    });

    return mapAdminPublicLink(updated);
  }

  async deletePublicLink(userId: number, linkId: number) {
    await ensureAdminAccess(this.prisma, userId);

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

    await this.auditService.record({
      entityType: 'PUBLIC_LINK',
      entityId: linkId,
      action: 'PUBLIC_LINK_ARCHIVED',
      actorUserId: userId,
    });

    return {
      linkId,
    };
  }

  async restorePublicLink(userId: number, linkId: number) {
    await ensureAdminAccess(this.prisma, userId);

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

    await this.auditService.record({
      entityType: 'PUBLIC_LINK',
      entityId: linkId,
      action: 'PUBLIC_LINK_RESTORED',
      actorUserId: userId,
    });

    return mapAdminPublicLink(restored);
  }

  /**
   * Ссылка сама за новой версией теста не следует (решение ait-rcw.2), поэтому перевод — явное
   * действие. Начатые прохождения доводятся по своей версии: вопросы берутся из версии попытки.
   */
  async moveToActivePublishedVersion(userId: number, linkId: number) {
    await ensureAdminAccess(this.prisma, userId);

    const existing = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: {
        id: true,
        archivedAt: true,
        topicVersion: {
          select: {
            versionNumber: true,
            topic: {
              select: { activePublishedVersionId: true },
            },
          },
        },
      },
    });

    if (!existing || existing.archivedAt) {
      throw new NotFoundException('Public link not found');
    }

    const activePublishedVersionId = existing.topicVersion.topic.activePublishedVersionId;

    if (!activePublishedVersionId) {
      throw new BadRequestException('Test has no published version to move the link to');
    }

    const moved = await this.prisma.testPublicLink.update({
      where: { id: linkId },
      data: { topicVersionId: activePublishedVersionId },
      include: publicLinkAdminInclude,
    });

    await this.auditService.record({
      entityType: 'PUBLIC_LINK',
      entityId: linkId,
      action: 'PUBLIC_LINK_MOVED_TO_ACTIVE_VERSION',
      actorUserId: userId,
      changes: collectAuditChanges(
        { topicVersionNumber: existing.topicVersion.versionNumber },
        { topicVersionNumber: moved.topicVersion.versionNumber },
        { fields: ['topicVersionNumber'] },
      ),
    });

    return mapAdminPublicLink(moved);
  }

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

    ensurePublicLinkAccessible(link, link.topicVersion);

    return link;
  }

  async getPublicLinkAccessByCode(shortCode: string): Promise<PublicLinkAccessResponseDto> {
    const link = await this.getAccessiblePublicLinkByCode(shortCode);

    return {
      shortCode: link.shortCode,
      title: link.topicVersion.title,
      description: link.topicVersion.description,
      entryProfileMode: link.entryProfileMode,
      publicTemplate: link.publicTemplate,
      publicBranding: toPublicBrandingResponse(link.publicBranding),
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
      personalData: toPublicPersonalData(link),
    };
  }

  listEducationOrganizations(userId: number, query: AdminEducationOrganizationsListQueryDto = {}) {
    return this.educationOrganizationService.listEducationOrganizations(userId, query);
  }

  createEducationOrganization(userId: number, dto: AdminCreateEducationOrganizationDto) {
    return this.educationOrganizationService.createEducationOrganization(userId, dto);
  }

  updateEducationOrganization(
    userId: number,
    organizationId: number,
    dto: AdminUpdateEducationOrganizationDto,
  ) {
    return this.educationOrganizationService.updateEducationOrganization(
      userId,
      organizationId,
      dto,
    );
  }
}
