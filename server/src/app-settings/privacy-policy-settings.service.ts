import { BadRequestException, Injectable } from '@nestjs/common';
import { z } from 'zod';

import { collectAuditChanges } from '../audit/audit-changes';
import { AuditService } from '../audit/audit.service';
import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { PrismaService } from '../prisma.service';
import {
  DEFAULT_PRIVACY_POLICY_CONTENT,
  DEFAULT_PRIVACY_POLICY_PUBLISHED_AT,
  DEFAULT_PRIVACY_POLICY_VERSION,
} from './privacy-policy.default';
import {
  DEFAULT_PLATFORM_OPERATOR_FULL_NAME,
  PRIVACY_POLICY_SETTING_KEY,
} from './privacy-policy.constants';

const PrivacyPolicyPayloadSchema = z.object({
  version: z.string().trim().min(1).max(64),
  publishedAt: z.string().datetime(),
  content: z.string().trim().min(1).max(160000),
  operatorFullName: z.string().trim().min(1).max(512).default(DEFAULT_PLATFORM_OPERATOR_FULL_NAME),
});

type PrivacyPolicyPayload = z.infer<typeof PrivacyPolicyPayloadSchema>;

type StoredPolicy = {
  payload: PrivacyPolicyPayload;
  updatedAt: Date | null;
};

/** Идентификатор настройки в журнале изменений. */
const PRIVACY_POLICY_AUDIT_ENTITY_ID = 'privacy-policy';

@Injectable()
export class PrivacyPolicySettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  private getDefaultPolicy(): StoredPolicy {
    return {
      payload: {
        version: DEFAULT_PRIVACY_POLICY_VERSION,
        publishedAt: DEFAULT_PRIVACY_POLICY_PUBLISHED_AT,
        content: DEFAULT_PRIVACY_POLICY_CONTENT,
        operatorFullName: DEFAULT_PLATFORM_OPERATOR_FULL_NAME,
      },
      updatedAt: null,
    };
  }

  private normalizePayload(input: unknown) {
    const parsed = PrivacyPolicyPayloadSchema.safeParse(input);

    if (!parsed.success) {
      throw new BadRequestException('Privacy policy settings are invalid');
    }

    return {
      version: parsed.data.version.trim(),
      publishedAt: new Date(parsed.data.publishedAt).toISOString(),
      content: parsed.data.content.trim().replace(/\r\n?/g, '\n'),
      operatorFullName: parsed.data.operatorFullName.trim(),
    };
  }

  private parseStoredPolicy(value: string) {
    try {
      return this.normalizePayload(JSON.parse(value));
    } catch {
      return null;
    }
  }

  private async getStoredPolicy(): Promise<StoredPolicy | null> {
    const setting = await this.prisma.appSetting.findUnique({
      where: {
        key: PRIVACY_POLICY_SETTING_KEY,
      },
    });

    if (!setting) {
      return null;
    }

    const payload = this.parseStoredPolicy(setting.value);

    if (!payload) {
      return null;
    }

    return {
      payload,
      updatedAt: setting.updatedAt,
    };
  }

  private async getEffectivePolicy() {
    return (await this.getStoredPolicy()) ?? this.getDefaultPolicy();
  }

  private toPublicResponse(policy: StoredPolicy) {
    return {
      privacyPolicy: {
        version: policy.payload.version,
        publishedAt: policy.payload.publishedAt,
        content: policy.payload.content,
        updatedAt: policy.updatedAt ? policy.updatedAt.toISOString() : null,
      },
    };
  }

  private toAdminResponse(policy: StoredPolicy) {
    return {
      privacyPolicy: {
        ...this.toPublicResponse(policy).privacyPolicy,
        operatorFullName: policy.payload.operatorFullName,
      },
    };
  }

  async getPublicPrivacyPolicy() {
    return this.toPublicResponse(await this.getEffectivePolicy());
  }

  async getAdminPrivacyPolicy(userId: number) {
    await ensureAdminAccess(this.prisma, userId);

    return this.toAdminResponse(await this.getEffectivePolicy());
  }

  async updatePrivacyPolicy(userId: number, input: unknown) {
    await ensureAdminAccess(this.prisma, userId);

    const payload = this.normalizePayload(input);
    const value = JSON.stringify(payload);
    const previousPolicy = await this.getEffectivePolicy();
    const changes = collectAuditChanges(previousPolicy.payload, payload, {
      fields: ['version', 'publishedAt', 'operatorFullName'],
      redactedFields: ['content'],
    });

    const setting = await this.prisma.$transaction(async (transaction) => {
      const saved = await transaction.appSetting.upsert({
        where: {
          key: PRIVACY_POLICY_SETTING_KEY,
        },
        create: {
          key: PRIVACY_POLICY_SETTING_KEY,
          value,
        },
        update: {
          value,
        },
      });

      await transaction.testPublicLink.updateMany({
        where: { personalDataProcessingMode: 'PUBLIC' },
        data: { operatorFullNameSnapshot: payload.operatorFullName },
      });

      if (changes.length > 0) {
        await this.auditService.record(
          {
            entityType: 'APP_SETTING',
            entityId: PRIVACY_POLICY_AUDIT_ENTITY_ID,
            action: 'SETTING_UPDATED',
            actorUserId: userId,
            changes,
          },
          transaction,
        );
      }

      return saved;
    });

    return this.toAdminResponse({
      payload,
      updatedAt: setting.updatedAt,
    });
  }

  async getPlatformOperatorFullName() {
    const policy = await this.getEffectivePolicy();

    return policy.payload.operatorFullName;
  }

  async getActivePolicySnapshot() {
    const policy = await this.getEffectivePolicy();

    return {
      version: policy.payload.version,
      publishedAt: new Date(policy.payload.publishedAt),
      content: policy.payload.content,
    };
  }
}
