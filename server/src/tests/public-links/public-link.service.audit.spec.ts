import { NotFoundException } from '@nestjs/common';

import {
  createExistingPublicLinkUpdateFixture,
  createPublicLinkRecordFixture,
  createPublicLinkServiceHarness,
  type PublicLinkServiceHarness,
} from '../public-links/public-link.service.spec-harness';

jest.mock('../../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

/**
 * Находка аудита FLOW-06: у ссылок был только автор создания, а кто и когда отключил ссылку,
 * поменял согласие или перевыпустил код, не было видно.
 */
describe('TestsPublicLinkService audit trail', () => {
  let service: PublicLinkServiceHarness['service'];
  let prismaMock: PublicLinkServiceHarness['prismaMock'];
  let auditMock: PublicLinkServiceHarness['auditMock'];

  beforeEach(() => {
    ({ service, prismaMock, auditMock } = createPublicLinkServiceHarness());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('createPublicLink records the new link with its code and test version', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);
    prismaMock.testPublicLink.create.mockResolvedValue(createPublicLinkRecordFixture());

    await service.createPublicLink(7, {
      publishedVersionId: 50,
      shortCode: 'DEMO2026',
      consentVersion: 'v1',
      consentText: 'Согласие',
    });

    const [recordedEvent] = auditMock.record.mock.calls[0] as [
      {
        entityType: string;
        entityId: number;
        action: string;
        actorUserId: number;
        changes: unknown[];
      },
    ];

    expect(recordedEvent).toMatchObject({
      entityType: 'PUBLIC_LINK',
      entityId: 100,
      action: 'PUBLIC_LINK_CREATED',
      actorUserId: 7,
    });
    expect(recordedEvent.changes).toEqual(
      expect.arrayContaining([
        { field: 'shortCode', before: null, after: 'DEMO2026' },
        { field: 'topicVersionNumber', before: null, after: '1' },
      ]),
    );
  });

  it('updatePublicLink records only the settings that changed and hides the consent text', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(
      createExistingPublicLinkUpdateFixture({
        shortCode: 'DEMO2026',
        isActive: true,
        publicTemplate: 'STANDARD',
        timeLimitMinutes: null,
        allowResume: true,
        consentVersion: 'v1',
        consentTextSnapshot: 'Согласие',
        publicBranding: null,
        topicVersion: { versionNumber: 1 },
      }),
    );
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({
        isActive: false,
        maxAttemptsPerStudent: 5,
        consentTextSnapshot: 'Новое согласие',
      }),
    );

    await service.updatePublicLink(7, 100, {
      isActive: false,
      maxAttemptsPerStudent: 5,
      consentText: 'Новое согласие',
    });

    expect(auditMock.record).toHaveBeenCalledWith(
      {
        entityType: 'PUBLIC_LINK',
        entityId: 100,
        action: 'PUBLIC_LINK_UPDATED',
        actorUserId: 7,
        changes: [
          { field: 'isActive', before: 'true', after: 'false' },
          { field: 'maxAttemptsPerStudent', before: '3', after: '5' },
          { field: 'consentText', before: null, after: null },
        ],
      },
      prismaMock,
    );
    expect(JSON.stringify(auditMock.record.mock.calls)).not.toContain('Новое согласие');
  });

  it('createPublicLink rolls back and throws when audit write fails (atomic audit)', async () => {
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({
      id: 50,
      topicId: 7,
      status: 'PUBLISHED',
    });
    prismaMock.testPublicLink.create.mockResolvedValue(createPublicLinkRecordFixture());
    auditMock.record.mockRejectedValue(new Error('Audit DB failure'));

    await expect(
      service.createPublicLink(7, {
        publishedVersionId: 50,
        shortCode: 'DEMO2026',
        consentVersion: 'v1',
        consentText: 'Согласие',
      }),
    ).rejects.toThrow('Audit DB failure');
  });

  it('regeneratePublicLinkShortCode records the old and the new code', async () => {
    prismaMock.testPublicLink.findUnique
      .mockResolvedValueOnce({ id: 100, archivedAt: null, shortCode: 'OLD2026' })
      .mockResolvedValue(null);
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({ shortCode: 'NEW2026' }),
    );

    await service.regeneratePublicLinkShortCode(7, 100);

    expect(auditMock.record).toHaveBeenCalledWith(
      {
        entityType: 'PUBLIC_LINK',
        entityId: 100,
        action: 'PUBLIC_LINK_CODE_REGENERATED',
        actorUserId: 7,
        changes: [{ field: 'shortCode', before: 'OLD2026', after: 'NEW2026' }],
      },
      prismaMock,
    );
  });

  it('deletePublicLink records the archive', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue({ id: 100, archivedAt: null });
    prismaMock.testPublicLink.update.mockResolvedValue({});

    await service.deletePublicLink(7, 100);

    expect(auditMock.record).toHaveBeenCalledWith(
      {
        entityType: 'PUBLIC_LINK',
        entityId: 100,
        action: 'PUBLIC_LINK_ARCHIVED',
        actorUserId: 7,
      },
      prismaMock,
    );
  });

  it('deletePublicLink records nothing for a link that is already archived', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue({
      id: 100,
      archivedAt: new Date('2026-09-01T10:00:00.000Z'),
    });

    await service.deletePublicLink(7, 100);

    expect(auditMock.record).not.toHaveBeenCalled();
  });

  it('restorePublicLink records the restore', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue({
      id: 100,
      archivedAt: new Date('2026-09-01T10:00:00.000Z'),
    });
    prismaMock.testPublicLink.update.mockResolvedValue(createPublicLinkRecordFixture());

    await service.restorePublicLink(7, 100);

    expect(auditMock.record).toHaveBeenCalledWith(
      {
        entityType: 'PUBLIC_LINK',
        entityId: 100,
        action: 'PUBLIC_LINK_RESTORED',
        actorUserId: 7,
      },
      prismaMock,
    );
  });

  it('moveToActivePublishedVersion records the version the link moved from and to', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue({
      id: 100,
      archivedAt: null,
      topicVersion: { versionNumber: 1, topic: { activePublishedVersionId: 51 } },
    });
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({
        topicVersion: {
          id: 51,
          topicId: 7,
          versionNumber: 2,
          title: 'Профориентация',
          topic: { archivedAt: null, activePublishedVersion: { id: 51, versionNumber: 2 } },
        },
      }),
    );

    await service.moveToActivePublishedVersion(7, 100);

    expect(auditMock.record).toHaveBeenCalledWith(
      {
        entityType: 'PUBLIC_LINK',
        entityId: 100,
        action: 'PUBLIC_LINK_MOVED_TO_ACTIVE_VERSION',
        actorUserId: 7,
        changes: [{ field: 'topicVersionNumber', before: '1', after: '2' }],
      },
      prismaMock,
    );
  });

  it('getPublicLinkHistory returns the history of a link, archived or not', async () => {
    const events = [
      {
        id: 9,
        action: 'PUBLIC_LINK_ARCHIVED',
        actor: { id: 7, email: 'admin@admin.admin', name: null },
        changes: [],
        createdAt: '2026-09-13T10:00:00.000Z',
      },
    ];
    prismaMock.testPublicLink.findUnique.mockResolvedValue({ id: 100 });
    auditMock.listForEntity.mockResolvedValue(events);

    await expect(service.getPublicLinkHistory(7, 100)).resolves.toEqual({ events });
    expect(auditMock.listForEntity).toHaveBeenCalledWith('PUBLIC_LINK', 100);
  });

  it('getPublicLinkHistory reports a missing link as not found', async () => {
    prismaMock.testPublicLink.findUnique.mockResolvedValue(null);

    await expect(service.getPublicLinkHistory(7, 404)).rejects.toBeInstanceOf(NotFoundException);
  });
});
