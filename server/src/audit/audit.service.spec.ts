import { AuditService } from './audit.service';

import type { PrismaService } from '../prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prismaMock: {
    auditEvent: {
      create: jest.Mock;
      findMany: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: 1 }),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
    service = new AuditService(prismaMock as unknown as PrismaService);
  });

  it('records who changed which entity and what changed', async () => {
    await service.record({
      entityType: 'USER',
      entityId: 42,
      action: 'USER_ROLE_CHANGED',
      actorUserId: 7,
      changes: [{ field: 'role', before: 'USER', after: 'ADMIN' }],
    });

    expect(prismaMock.auditEvent.create).toHaveBeenCalledWith({
      data: {
        entityType: 'USER',
        entityId: '42',
        action: 'USER_ROLE_CHANGED',
        actorUserId: 7,
        changes: [{ field: 'role', before: 'USER', after: 'ADMIN' }],
      },
    });
  });

  it('records through a transaction client when provided', async () => {
    const txMock = {
      auditEvent: {
        create: jest.fn().mockResolvedValue({ id: 99 }),
      },
    };

    await service.record(
      {
        entityType: 'USER',
        entityId: 42,
        action: 'USER_ROLE_CHANGED',
        actorUserId: 7,
        changes: [{ field: 'role', before: 'USER', after: 'ADMIN' }],
      },
      txMock as never,
    );

    expect(txMock.auditEvent.create).toHaveBeenCalledWith({
      data: {
        entityType: 'USER',
        entityId: '42',
        action: 'USER_ROLE_CHANGED',
        actorUserId: 7,
        changes: [{ field: 'role', before: 'USER', after: 'ADMIN' }],
      },
    });
    expect(prismaMock.auditEvent.create).not.toHaveBeenCalled();
  });

  it('records an event without changes as an empty list', async () => {
    await service.record({
      entityType: 'USER',
      entityId: 42,
      action: 'USER_PASSWORD_RESET',
      actorUserId: 7,
    });

    const [createArgs] = prismaMock.auditEvent.create.mock.calls[0] as [
      { data: { changes: unknown } },
    ];

    expect(createArgs.data.changes).toEqual([]);
  });

  it('lists the history of one entity newest first with its authors', async () => {
    prismaMock.auditEvent.findMany.mockResolvedValue([
      {
        id: 3,
        action: 'USER_ROLE_CHANGED',
        changes: [{ field: 'role', before: 'USER', after: 'ADMIN' }],
        createdAt: new Date('2026-09-13T10:00:00.000Z'),
        actor: { id: 7, email: 'admin@admin.admin', name: null },
      },
      {
        id: 2,
        action: 'USER_CREATED',
        changes: [],
        createdAt: new Date('2026-09-12T10:00:00.000Z'),
        actor: null,
      },
    ]);

    const events = await service.listForEntity('USER', 42);

    expect(prismaMock.auditEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { entityType: 'USER', entityId: '42' },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
    );
    expect(events).toEqual([
      {
        id: 3,
        action: 'USER_ROLE_CHANGED',
        actor: { id: 7, email: 'admin@admin.admin', name: null },
        changes: [{ field: 'role', before: 'USER', after: 'ADMIN' }],
        createdAt: '2026-09-13T10:00:00.000Z',
      },
      {
        id: 2,
        action: 'USER_CREATED',
        actor: null,
        changes: [],
        createdAt: '2026-09-12T10:00:00.000Z',
      },
    ]);
  });

  it('shows an event with malformed stored changes instead of failing the whole history', async () => {
    prismaMock.auditEvent.findMany.mockResolvedValue([
      {
        id: 4,
        action: 'SETTING_UPDATED',
        changes: { unexpected: true },
        createdAt: new Date('2026-09-13T11:00:00.000Z'),
        actor: null,
      },
    ]);

    await expect(service.listForEntity('APP_SETTING', 'privacy-policy')).resolves.toEqual([
      {
        id: 4,
        action: 'SETTING_UPDATED',
        actor: null,
        changes: [],
        createdAt: '2026-09-13T11:00:00.000Z',
      },
    ]);
  });
});
