import { ConflictException } from '@nestjs/common';

import {
  createExistingPublicLinkUpdateFixture,
  createPublicLinkRecordFixture,
  createPublicLinkServiceHarness,
} from './public-link.service.spec-harness';

jest.mock('../../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

describe('TestsPublicLinkService concurrency guards', () => {
  afterEach(() => jest.clearAllMocks());

  it('checks the current link version when activating after a concurrent move', async () => {
    const { service, prismaMock } = createPublicLinkServiceHarness();
    prismaMock.testPublicLink.findUnique
      .mockResolvedValueOnce(createExistingPublicLinkUpdateFixture({ topicVersionId: 50 }))
      .mockResolvedValueOnce(createExistingPublicLinkUpdateFixture({ topicVersionId: 51 }));
    prismaMock.testTopicVersion.findUnique.mockImplementation(
      ({ where }: { where: { id: number } }) =>
        Promise.resolve({
          analysisPromptVersion: {
            analysisPrompt: { archivedAt: where.id === 51 ? new Date() : null },
          },
        }),
    );
    prismaMock.testPublicLink.update.mockResolvedValue(createPublicLinkRecordFixture());

    await expect(service.updatePublicLink(7, 100, { isActive: true })).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prismaMock.testPublicLink.update).not.toHaveBeenCalled();
  });

  it('moves to the active published version read inside the transaction', async () => {
    const { service, prismaMock } = createPublicLinkServiceHarness();
    prismaMock.testPublicLink.findUnique
      .mockResolvedValueOnce({
        id: 100,
        archivedAt: null,
        topicVersion: { versionNumber: 1, topic: { activePublishedVersionId: 51 } },
      })
      .mockResolvedValueOnce({
        id: 100,
        archivedAt: null,
        topicVersion: { versionNumber: 1, topic: { activePublishedVersionId: 52 } },
      });
    prismaMock.testTopicVersion.findUnique.mockResolvedValue({ analysisPromptVersion: null });
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({
        topicVersion: {
          id: 52,
          topicId: 7,
          versionNumber: 3,
          title: 'Профориентация',
          topic: { archivedAt: null, activePublishedVersion: { id: 52, versionNumber: 3 } },
        },
      }),
    );

    await service.moveToActivePublishedVersion(7, 100);
    expect(prismaMock.testPublicLink.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { topicVersionId: 52 } }),
    );
  });

  it('does not overwrite a concurrently changed attempt limit on retry', async () => {
    const { service, prismaMock } = createPublicLinkServiceHarness();
    prismaMock.testPublicLink.findUnique
      .mockResolvedValueOnce(createExistingPublicLinkUpdateFixture({ maxAttemptsPerStudent: 3 }))
      .mockResolvedValueOnce(createExistingPublicLinkUpdateFixture({ maxAttemptsPerStudent: 7 }));
    prismaMock.testPublicLink.update.mockResolvedValue(
      createPublicLinkRecordFixture({ isActive: false, maxAttemptsPerStudent: 7 }),
    );

    await service.updatePublicLink(7, 100, { isActive: false });
    expect(prismaMock.testPublicLink.update.mock.calls[0]?.[0].data.maxAttemptsPerStudent).toBe(7);
  });
});
