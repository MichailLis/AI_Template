import { NotFoundException } from '@nestjs/common';

import { AnalysisPromptsService } from './analysis-prompts.service';

describe('AnalysisPromptsService concurrency guards', () => {
  it('does not archive a prompt that another transaction already archived', async () => {
    const prompt = {
      id: 7,
      title: 'Prompt',
      description: null,
      archivedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      versions: [{ id: 1 }],
    };
    const tx = {
      analysisPrompt: {
        findUnique: jest.fn().mockResolvedValueOnce(prompt).mockResolvedValueOnce(null),
        update: jest.fn().mockResolvedValue({ ...prompt, archivedAt: new Date() }),
      },
      testTopic: { findMany: jest.fn().mockResolvedValue([]) },
      testTopicVersion: { findMany: jest.fn().mockResolvedValue([]) },
      testStudentAnalysis: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const prisma = {
      ...tx,
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const audit = { record: jest.fn(), listForEntity: jest.fn() };
    const service = new AnalysisPromptsService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      audit as never,
    );

    await expect(service.deletePrompt(3, 7)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.analysisPrompt.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  const createPublishFixture = (archivedAt: Date | null) => {
    const tx = {
      analysisPrompt: { findUnique: jest.fn().mockResolvedValue({ archivedAt }) },
      analysisPromptVersion: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn().mockResolvedValue({ id: 43, versionNumber: 2, status: 'PUBLISHED' }),
      },
    };
    const prisma = {
      analysisPromptVersion: {
        findUnique: jest.fn().mockResolvedValue({ id: 43, promptId: 7 }),
        update: jest.fn(),
      },
      testTopicVersion: { findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const service = new AnalysisPromptsService(
      prisma as never,
      {} as never,
      {} as never,
      {} as never,
      { record: jest.fn(), listForEntity: jest.fn() } as never,
    );
    jest.spyOn(service as never, 'toVersionResponse').mockReturnValue({} as never);

    return { tx, prisma, service };
  };

  it('publishes serializable, so two concurrent publishes cannot both stay PUBLISHED', async () => {
    const { prisma, service } = createPublishFixture(null);

    await service.publishVersion(3, 43);

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'Serializable',
    });
  });

  it('refuses to publish a version of an archived prompt', async () => {
    const { tx, service } = createPublishFixture(new Date('2026-10-01T10:00:00.000Z'));

    await expect(service.publishVersion(3, 43)).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.analysisPromptVersion.updateMany).not.toHaveBeenCalled();
    expect(tx.analysisPromptVersion.update).not.toHaveBeenCalled();
  });
});
