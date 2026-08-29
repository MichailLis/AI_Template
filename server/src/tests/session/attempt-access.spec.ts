import { BadRequestException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma.service';
import { getSessionAttemptByTokenOrThrow } from '../session/attempt-access';
import { attemptWithSessionInclude } from '../attempts/attempt.query';

const createAttemptFixture = (publicLinkOverrides: Record<string, unknown> = {}) => ({
  id: 5,
  status: 'IN_PROGRESS',
  expiresAt: new Date('2026-05-12T12:30:00.000Z'),
  finishedAt: null,
  topicVersion: {
    status: 'PUBLISHED',
  },
  publicLink: {
    isActive: true,
    archivedAt: null,
    startsAt: null,
    endsAt: null,
    ...publicLinkOverrides,
  },
});

describe('getSessionAttemptByTokenOrThrow', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('reads an expired in-progress attempt without mutating it', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const expiredAttempt = {
      ...createAttemptFixture(),
      expiresAt: new Date('2026-05-12T11:59:00.000Z'),
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

  it.each([
    {
      label: 'archived',
      publicLink: { archivedAt: new Date('2026-05-12T11:00:00.000Z') },
      exception: NotFoundException,
      message: 'Public test link not found',
    },
    {
      label: 'disabled',
      publicLink: { isActive: false },
      exception: BadRequestException,
      message: 'Public test link is disabled',
    },
    {
      label: 'not active yet',
      publicLink: { startsAt: new Date('2026-05-12T12:01:00.000Z') },
      exception: BadRequestException,
      message: 'Public test link is not active yet',
    },
    {
      label: 'expired',
      publicLink: { endsAt: new Date('2026-05-12T11:59:00.000Z') },
      exception: BadRequestException,
      message: 'Public test link has expired',
    },
  ])('rejects an existing session token when its public link is $label', async (testCase) => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const findUniqueMock = jest.fn().mockResolvedValue(createAttemptFixture(testCase.publicLink));
    const prismaMock = {
      testStudentAttempt: {
        findUnique: findUniqueMock,
      },
    } as unknown as PrismaService;

    const result = getSessionAttemptByTokenOrThrow(prismaMock, 'session-token');

    await expect(result).rejects.toBeInstanceOf(testCase.exception);
    await expect(result).rejects.toMatchObject({ message: testCase.message });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { resumeToken: 'session-token' },
      include: attemptWithSessionInclude,
    });
  });
});
