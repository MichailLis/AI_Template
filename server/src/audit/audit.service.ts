import { Injectable } from '@nestjs/common';
import type { AuditEntityType, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import type { AuditAction, AuditChange } from './audit.types';

export interface AuditEventInput {
  entityType: AuditEntityType;
  /** Числовой id сущности или ключ настройки; хранится текстом. */
  entityId: number | string;
  action: AuditAction;
  actorUserId: number | null;
  changes?: AuditChange[];
}

export interface AuditHistoryEvent {
  id: number;
  action: string;
  actor: { id: number; email: string; name: string | null } | null;
  changes: AuditChange[];
  createdAt: string;
}

/** Карточке нужна недавняя история, а не весь журнал сущности. */
const HISTORY_LIMIT = 100;

const isAuditChange = (value: unknown): value is AuditChange => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.field === 'string' &&
    (candidate.before === null || typeof candidate.before === 'string') &&
    (candidate.after === null || typeof candidate.after === 'string')
  );
};

/** Поврежденная запись изменений не должна ронять всю историю: событие показывается без них. */
const toStoredChanges = (value: Prisma.JsonValue): AuditChange[] => {
  const storedChanges: unknown[] = Array.isArray(value) ? value : [];

  return storedChanges.every(isAuditChange) ? storedChanges.filter(isAuditChange) : [];
};

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    { entityType, entityId, action, actorUserId, changes = [] }: AuditEventInput,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx ?? this.prisma;
    await client.auditEvent.create({
      data: {
        entityType,
        entityId: String(entityId),
        action,
        actorUserId,
        changes: changes.map(({ field, before, after }) => ({ field, before, after })),
      },
    });
  }

  async listForEntity(
    entityType: AuditEntityType,
    entityId: number | string,
  ): Promise<AuditHistoryEvent[]> {
    const events = await this.prisma.auditEvent.findMany({
      where: { entityType, entityId: String(entityId) },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: HISTORY_LIMIT,
      select: {
        id: true,
        action: true,
        changes: true,
        createdAt: true,
        actor: { select: { id: true, email: true, name: true } },
      },
    });

    return events.map((event) => ({
      id: event.id,
      action: event.action,
      actor: event.actor,
      changes: toStoredChanges(event.changes),
      createdAt: event.createdAt.toISOString(),
    }));
  }
}
