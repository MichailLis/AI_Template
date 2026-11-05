import type { AiUsageService, AiUsageSummary } from '../ai-provider/ai-usage.service';
import { AdminAiUsageController } from './admin-ai-usage.controller';

const bucket = {
  calls: 2,
  failedCalls: 0,
  callsWithoutCost: 0,
  promptTokens: 10,
  completionTokens: 5,
  totalTokens: 15,
  cost: '0.30000000',
};

describe('AdminAiUsageController', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('summarizes from the moment the browser sent up to now', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-05T10:00:00.000Z'));
    const summary: AiUsageSummary = { totals: bucket, byPurpose: [], byModel: [] };
    const summarize = jest.fn().mockResolvedValue(summary);
    const controller = new AdminAiUsageController({ summarize } as unknown as AiUsageService);

    // Midnight in UTC+3 is 21:00 UTC of the day before: the server must not move it.
    const result = await controller.getSummary({ from: '2026-11-04T21:00:00.000Z' });

    expect(summarize).toHaveBeenCalledWith(
      new Date('2026-11-04T21:00:00.000Z'),
      new Date('2026-11-05T10:00:00.000Z'),
    );
    expect(result).toEqual({
      from: '2026-11-04T21:00:00.000Z',
      to: '2026-11-05T10:00:00.000Z',
      ...summary,
    });
  });
});
