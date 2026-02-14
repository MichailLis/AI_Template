import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Prisma, TestPublicLink, TestTopicVersion } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import type { AdminCreatePublicLinkDto, AdminUpdatePublicLinkDto } from './dto/tests-links.dto';
import type { PublicLinkAccessResponseDto } from './dto/tests-public.dto';
import { createShortCodeCandidate } from './tests-domain.utils';

const DEFAULT_MAX_ATTEMPTS = 1;
const DEFAULT_ALLOW_RESUME = true;

type PublicLinkWithTopicVersion = Prisma.TestPublicLinkGetPayload<{
  include: {
    topicVersion: {
      include: {
        _count: {
          select: {
            questions: true;
          };
        };
        questions: {
          orderBy: {
            order: 'asc';
          };
          include: {
            options: {
              orderBy: {
                order: 'asc';
              };
            };
            sliderBands: {
              orderBy: {
                order: 'asc';
              };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class TestsPublicLinkService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureAdminAccess(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!user || user.role !== 'ADMIN') {
      throw new ForbiddenException('Admin area only');
    }
  }

  private toIso(value: Date | null) {
    return value ? value.toISOString() : null;
  }

  private toAdminPublicLink(
    link: TestPublicLink & { topicVersion: Pick<TestTopicVersion, 'id' | 'topicId' | 'title'> },
  ) {
    return {
      id: link.id,
      publishedVersionId: link.topicVersion.id,
      topicId: link.topicVersion.topicId,
      shortCode: link.shortCode,
      shortUrl: `/t/${link.shortCode}`,
      isActive: link.isActive,
      startsAt: this.toIso(link.startsAt),
      endsAt: this.toIso(link.endsAt),
      maxAttemptsPerStudent: link.maxAttemptsPerStudent,
      timeLimitMinutes: link.timeLimitMinutes,
      allowResume: link.allowResume,
      consentVersion: link.consentVersion,
      consentText: link.consentTextSnapshot,
      title: link.topicVersion.title,
      updatedAt: link.updatedAt.toISOString(),
      createdAt: link.createdAt.toISOString(),
    };
  }

  private parseDateOrNull(value: string | null | undefined) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    return new Date(value);
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

  async createPublicLink(userId: number, dto: AdminCreatePublicLinkDto) {
    await this.ensureAdminAccess(userId);
    await this.ensurePublishedVersion(dto.publishedVersionId);

    const shortCode = await this.ensureUniqueShortCode(dto.shortCode);

    const created = await this.prisma.testPublicLink.create({
      data: {
        topicVersionId: dto.publishedVersionId,
        shortCode,
        isActive: dto.isActive ?? true,
        startsAt: this.parseDateOrNull(dto.startsAt),
        endsAt: this.parseDateOrNull(dto.endsAt),
        maxAttemptsPerStudent: dto.maxAttemptsPerStudent ?? DEFAULT_MAX_ATTEMPTS,
        timeLimitMinutes: dto.timeLimitMinutes ?? null,
        allowResume: dto.allowResume ?? DEFAULT_ALLOW_RESUME,
        consentVersion: dto.consentVersion,
        consentTextSnapshot: dto.consentText,
        createdByUserId: userId,
      },
      include: {
        topicVersion: {
          select: {
            id: true,
            topicId: true,
            title: true,
          },
        },
      },
    });

    return this.toAdminPublicLink(created);
  }

  async listPublicLinks(userId: number) {
    await this.ensureAdminAccess(userId);

    const links = await this.prisma.testPublicLink.findMany({
      include: {
        topicVersion: {
          select: {
            id: true,
            topicId: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      links: links.map((link) => this.toAdminPublicLink(link)),
    };
  }

  async updatePublicLink(userId: number, linkId: number, dto: AdminUpdatePublicLinkDto) {
    await this.ensureAdminAccess(userId);

    const existing = await this.prisma.testPublicLink.findUnique({
      where: { id: linkId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('Public link not found');
    }

    const updated = await this.prisma.testPublicLink.update({
      where: { id: linkId },
      data: {
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.startsAt !== undefined ? { startsAt: this.parseDateOrNull(dto.startsAt) } : {}),
        ...(dto.endsAt !== undefined ? { endsAt: this.parseDateOrNull(dto.endsAt) } : {}),
        ...(dto.maxAttemptsPerStudent !== undefined
          ? { maxAttemptsPerStudent: dto.maxAttemptsPerStudent }
          : {}),
        ...(dto.timeLimitMinutes !== undefined ? { timeLimitMinutes: dto.timeLimitMinutes } : {}),
        ...(dto.allowResume !== undefined ? { allowResume: dto.allowResume } : {}),
        ...(dto.consentVersion !== undefined ? { consentVersion: dto.consentVersion } : {}),
        ...(dto.consentText !== undefined ? { consentTextSnapshot: dto.consentText } : {}),
      },
      include: {
        topicVersion: {
          select: {
            id: true,
            topicId: true,
            title: true,
          },
        },
      },
    });

    return this.toAdminPublicLink(updated);
  }

  async getAccessiblePublicLinkByCode(shortCode: string): Promise<PublicLinkWithTopicVersion> {
    const normalizedCode = shortCode.trim().toUpperCase();
    const link = await this.prisma.testPublicLink.findUnique({
      where: {
        shortCode: normalizedCode,
      },
      include: {
        topicVersion: {
          include: {
            _count: {
              select: {
                questions: true,
              },
            },
            questions: {
              orderBy: { order: 'asc' },
              include: {
                options: {
                  orderBy: { order: 'asc' },
                },
                sliderBands: {
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!link) {
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

  async getPublicLinkAccessByCode(shortCode: string): Promise<PublicLinkAccessResponseDto> {
    const link = await this.getAccessiblePublicLinkByCode(shortCode);

    return {
      shortCode: link.shortCode,
      title: link.topicVersion.title,
      description: link.topicVersion.description,
      questionCount: link.topicVersion._count.questions,
      maxAttemptsPerStudent: link.maxAttemptsPerStudent,
      timeLimitMinutes: link.timeLimitMinutes,
      allowResume: link.allowResume,
      startsAt: this.toIso(link.startsAt),
      endsAt: this.toIso(link.endsAt),
      consentVersion: link.consentVersion,
      consentText: link.consentTextSnapshot,
    };
  }
}
