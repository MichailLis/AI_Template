import { NotFoundException } from '@nestjs/common';

import { ensureAdminAccess } from '../common/authz/admin-access.utils';
import { AnalysisPromptsService } from './analysis-prompts.service';

jest.mock('../common/authz/admin-access.utils', () => ({
  ensureAdminAccess: jest.fn().mockResolvedValue(undefined),
}));

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
    jest.mocked(ensureAdminAccess).mockResolvedValue(undefined);

    await expect(service.deletePrompt(3, 7)).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.analysisPrompt.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });
});
