import { BadRequestException, NotFoundException } from '@nestjs/common';

import type { PrismaService } from '../../prisma.service';
import {
  getResultAttemptByTokenOrThrow,
  getSessionAttemptByTokenOrThrow,
} from '../session/attempt-access';
import { attemptWithSessionInclude } from '../attempts/attempt.query';

const createAttemptFixture = (
  publicLinkOverrides: Record<string, unknown> = {},
  topicVersionOverrides: Record<string, unknown> = {},
) => ({
  id: 5,
  status: 'IN_PROGRESS',
  expiresAt: new Date('2026-05-12T12:30:00.000Z'),
  finishedAt: null,
  topicVersion: {
    status: 'PUBLISHED',
    topic: { archivedAt: null },
    ...topicVersionOverrides,
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
      code: 'LINK_NOT_FOUND',
    },
    {
      label: 'disabled',
      publicLink: { isActive: false },
      exception: BadRequestException,
      message: 'Public test link is disabled',
      code: 'LINK_DISABLED',
    },
    {
      label: 'not active yet',
      publicLink: { startsAt: new Date('2026-05-12T12:01:00.000Z') },
      exception: BadRequestException,
      message: 'Public test link is not active yet',
      code: 'LINK_NOT_STARTED',
    },
    {
      label: 'expired',
      publicLink: { endsAt: new Date('2026-05-12T11:59:00.000Z') },
      exception: BadRequestException,
      message: 'Public test link has expired',
      code: 'LINK_EXPIRED',
    },
    {
      label: 'disabled by education organization',
      publicLink: {
        isActive: true,
        educationOrganization: { isActive: false },
      },
      exception: BadRequestException,
      message: 'Public test link is disabled because its education organization is disabled',
      code: 'LINK_DISABLED',
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
    await expect(result).rejects.toMatchObject({
      response: { error: testCase.code },
    });
    expect(findUniqueMock).toHaveBeenCalledWith({
      where: { resumeToken: 'session-token' },
      include: attemptWithSessionInclude,
    });
  });

  it('rejects an existing session token when the test topic is archived', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const findUniqueMock = jest.fn().mockResolvedValue(
      createAttemptFixture(
        {},
        {
          topic: { archivedAt: new Date('2026-05-12T11:00:00.000Z') },
        },
      ),
    );
    const prismaMock = {
      testStudentAttempt: {
        findUnique: findUniqueMock,
      },
    } as unknown as PrismaService;

    const result = getSessionAttemptByTokenOrThrow(prismaMock, 'session-token');

    await expect(result).rejects.toBeInstanceOf(BadRequestException);
    await expect(result).rejects.toMatchObject({
      message: 'Public test link is disabled because its test is archived',
    });
  });
});

describe('getResultAttemptByTokenOrThrow', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const createPrismaMock = (attempt: unknown) =>
    ({
      testStudentAttempt: { findUnique: jest.fn().mockResolvedValue(attempt) },
    }) as unknown as PrismaService;

  it.each([
    { label: 'disabled', publicLink: { isActive: false }, topicVersion: {} },
    {
      label: 'expired',
      publicLink: { endsAt: new Date('2026-05-12T11:59:00.000Z') },
      topicVersion: {},
    },
    {
      label: 'disabled by education organization',
      publicLink: { educationOrganization: { isActive: false } },
      topicVersion: {},
    },
    {
      label: 'attached to an archived test',
      publicLink: {},
      topicVersion: { topic: { archivedAt: new Date('2026-05-12T11:00:00.000Z') } },
    },
  ])('returns the attempt when its public link is $label', async (testCase) => {
    jest.useFakeTimers().setSystemTime(new Date('2026-05-12T12:00:00.000Z'));

    const attempt = createAttemptFixture(testCase.publicLink, testCase.topicVersion);

    await expect(
      getResultAttemptByTokenOrThrow(createPrismaMock(attempt), 'session-token'),
    ).resolves.toBe(attempt);
  });

  it('rejects the attempt when its public link was deleted', async () => {
    const attempt = createAttemptFixture({ archivedAt: new Date('2026-05-12T11:00:00.000Z') });
    const result = getResultAttemptByTokenOrThrow(createPrismaMock(attempt), 'session-token');

    await expect(result).rejects.toBeInstanceOf(NotFoundException);
    await expect(result).rejects.toMatchObject({ response: { error: 'LINK_NOT_FOUND' } });
  });

  it('rejects an unknown session token', async () => {
    const result = getResultAttemptByTokenOrThrow(createPrismaMock(null), 'session-token');

    await expect(result).rejects.toMatchObject({ response: { error: 'SESSION_NOT_FOUND' } });
  });
});
