import { PrismaService } from '../prisma.service';
import { getSessionAttemptByTokenOrThrow } from './tests-attempt-access';
import { attemptWithSessionInclude } from './tests-attempt.query';

describe('getSessionAttemptByTokenOrThrow', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('reads an expired in-progress attempt without mutating it', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const expiredAttempt = {
      id: 5,
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
      finishedAt: null,
    };
    const findUniqueMock = jest.fn().mockResolvedValue(expiredAttempt);
    const updateMock = jest.fn().mockResolvedValue({
      ...expiredAttempt,
      status: 'EXPIRED',
      finishedAt: new Date('2026-05-12T12:00:00.000Z'),
    });
    const prismaMock = {
      testStudentAttempt: {
        findUnique: findUniqueMock,
        update: updateMock,
      },
    } as unknown as PrismaService;

    await expect(getSessionAttemptByTokenOrThrow(prismaMock, 'session-token')).resolves.toBe(
      expiredAttempt,
    );

    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { resumeToken: 'session-token' },
      include: attemptWithSessionInclude,
    });
    expect(updateMock).not.toHaveBeenCalled();
  });
});
