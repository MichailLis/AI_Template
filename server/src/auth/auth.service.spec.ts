import { ForbiddenException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import type { PrismaService } from '../prisma.service';
import { AuthService, SESSION_IDLE_TIMEOUT_MS, SESSION_MAX_AGE_MS } from './auth.service';
import type { SigninDto } from './dto/auth.dto';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

type TestUser = {
  id: number;
  email: string;
  name: string | null;
  password: string;
  role: 'USER' | 'ADMIN';
  deactivatedAt: Date | null;
};

type TestSession = {
  id: number;
  userId: number;
  hashedRefreshToken: string;
  rememberDevice: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  user: { email: string; deactivatedAt: Date | null };
};

type PrismaUserDelegate = {
  findUnique: jest.Mock;
  update: jest.Mock;
};

type PrismaAuthSessionDelegate = {
  create: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  deleteMany: jest.Mock;
  findFirst: jest.Mock;
};

const NOW = new Date('2026-10-30T12:00:00.000Z').getTime();

const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: 1,
  email: 'user@example.com',
  name: 'User',
  password: 'hashed-password',
  role: 'USER',
  deactivatedAt: null,
  ...overrides,
});

const createTestSession = (overrides: Partial<TestSession> = {}): TestSession => ({
  id: 5,
  userId: 1,
  hashedRefreshToken: 'hashed-refresh-token',
  rememberDevice: false,
  createdAt: new Date(NOW - 60 * 60 * 1000),
  lastUsedAt: new Date(NOW - 10 * 60 * 1000),
  user: { email: 'user@example.com', deactivatedAt: null },
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: {
    user: PrismaUserDelegate;
    authSession: PrismaAuthSessionDelegate;
    $transaction: jest.Mock;
  };
  let jwtServiceMock: {
    signAsync: jest.Mock;
  };
  let configMock: { get: jest.Mock };

  beforeEach(() => {
    jest.useFakeTimers({ now: NOW });

    prismaMock = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      authSession: {
        create: jest.fn().mockResolvedValue({ id: 5 }),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    prismaMock.$transaction.mockImplementation((run: (tx: typeof prismaMock) => unknown) =>
      run(prismaMock),
    );

    jwtServiceMock = {
      signAsync: jest.fn(),
    };

    configMock = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_ACCESS_SECRET') return 'at-secret';
        if (key === 'JWT_REFRESH_SECRET') return 'rt-secret';
        return undefined;
      }),
    };

    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock as unknown as JwtService,
      configMock as unknown as ConfigService,
    );

    jest.mocked(argon2.hash).mockReset();
    jest.mocked(argon2.verify).mockReset();
    jest.mocked(argon2.hash).mockResolvedValue('dummy-hash');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const mockTokens = (accessToken = 'access-token', refreshToken = 'refresh-token') =>
    jest.spyOn(service, 'getTokens').mockResolvedValue({ accessToken, refreshToken });

  it('signin should throw ForbiddenException when user does not exist', async () => {
    const dto: SigninDto = {
      email: 'missing@example.com',
      password: 'Password123',
    };

    prismaMock.user.findUnique.mockResolvedValue(null);
    jest.mocked(argon2.verify).mockResolvedValue(false);

    await expect(service.signin(dto)).rejects.toThrow(ForbiddenException);
  });

  it('signin should spend one password check on an unknown email, as for a known one', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    jest.mocked(argon2.verify).mockResolvedValue(false);

    await expect(
      service.signin({ email: 'missing@example.com', password: 'Password123' }),
    ).rejects.toMatchObject({
      message: 'Access Denied',
      response: { error: 'INVALID_CREDENTIALS' },
    });
    expect(argon2.verify).toHaveBeenCalledTimes(1);
    expect(argon2.verify).toHaveBeenCalledWith('dummy-hash', 'Password123');
  });

  it('signin should throw ForbiddenException when password is invalid', async () => {
    const dto: SigninDto = {
      email: 'user@example.com',
      password: 'wrong-password',
    };

    prismaMock.user.findUnique.mockResolvedValue(createTestUser());
    jest.mocked(argon2.verify).mockResolvedValue(false);

    await expect(service.signin(dto)).rejects.toThrow(ForbiddenException);
    // Форма входа различает отказы по коду (#148): неизвестный email и неверный пароль — одно и то же.
    await expect(service.signin(dto)).rejects.toMatchObject({
      response: { error: 'INVALID_CREDENTIALS' },
    });
  });

  it('signin should open a new device session and leave the other sessions alone', async () => {
    prismaMock.user.findUnique.mockResolvedValue(createTestUser());
    jest.mocked(argon2.verify).mockResolvedValue(true);
    const getTokensSpy = mockTokens();
    jest.mocked(argon2.hash).mockResolvedValue('hashed-refresh-token');

    const result = await service.signin({ email: ' User@Example.COM ', password: 'Password123' });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    // Только истёкшие сессии этого пользователя: вход с ноутбука не выбивает рабочий компьютер (#123).
    expect(prismaMock.authSession.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 1,
        OR: [
          { lastUsedAt: { lt: new Date(NOW - SESSION_IDLE_TIMEOUT_MS) } },
          { createdAt: { lt: new Date(NOW - SESSION_MAX_AGE_MS) } },
        ],
      },
    });
    expect(prismaMock.authSession.create).toHaveBeenCalledWith({
      data: { userId: 1, hashedRefreshToken: '', rememberDevice: false },
    });
    expect(getTokensSpy).toHaveBeenCalledWith(1, 'user@example.com', 5);
    expect(argon2.hash).toHaveBeenCalledWith('refresh-token');
    expect(prismaMock.authSession.update).toHaveBeenCalledWith({
      where: { id: 5 },
      data: { hashedRefreshToken: 'hashed-refresh-token' },
    });
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { lastLoginAt: expect.any(Date) as Date },
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshCookieMaxAgeMs: undefined,
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'User',
        role: 'USER',
      },
    });
  });

  it('signin should keep the cookie for the whole session on a remembered device', async () => {
    prismaMock.user.findUnique.mockResolvedValue(createTestUser());
    jest.mocked(argon2.verify).mockResolvedValue(true);
    mockTokens();

    const result = await service.signin({
      email: 'user@example.com',
      password: 'Password123',
      rememberDevice: true,
    });

    expect(prismaMock.authSession.create).toHaveBeenCalledWith({
      data: { userId: 1, hashedRefreshToken: '', rememberDevice: true },
    });
    expect(result.refreshCookieMaxAgeMs).toBe(SESSION_MAX_AGE_MS);
  });

  it('signin should reject a deactivated account without issuing tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      createTestUser({ deactivatedAt: new Date('2026-09-01T00:00:00.000Z') }),
    );
    jest.mocked(argon2.verify).mockResolvedValue(true);
    const getTokensSpy = jest.spyOn(service, 'getTokens');

    await expect(
      service.signin({ email: 'user@example.com', password: 'Password123' }),
    ).rejects.toMatchObject({
      message: 'Account is deactivated',
      response: { error: 'ACCOUNT_DEACTIVATED' },
    });
    expect(getTokensSpy).not.toHaveBeenCalled();
    expect(prismaMock.authSession.create).not.toHaveBeenCalled();
  });

  it('signin should not reveal deactivation to a wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      createTestUser({ deactivatedAt: new Date('2026-09-01T00:00:00.000Z') }),
    );
    jest.mocked(argon2.verify).mockResolvedValue(false);

    await expect(
      service.signin({ email: 'user@example.com', password: 'wrong-password' }),
    ).rejects.toThrow('Access Denied');
  });

  it('logout should end only the session of this device', async () => {
    await service.logout(11, 5);

    expect(prismaMock.authSession.deleteMany).toHaveBeenCalledWith({
      where: { id: 5, userId: 11 },
    });
  });

  it('logout should not touch sessions for an access token without a session id', async () => {
    await service.logout(11, undefined);

    expect(prismaMock.authSession.deleteMany).not.toHaveBeenCalled();
  });

  it('refreshTokens should reject a refresh token without a session id', async () => {
    await expect(service.refreshTokens(1, undefined, 'refresh-token')).rejects.toMatchObject({
      response: { error: 'REFRESH_DENIED' },
    });
    expect(prismaMock.authSession.findFirst).not.toHaveBeenCalled();
  });

  it('refreshTokens should reject a session that no longer exists', async () => {
    prismaMock.authSession.findFirst.mockResolvedValue(null);

    await expect(service.refreshTokens(1, 5, 'refresh-token')).rejects.toThrow(ForbiddenException);
    expect(prismaMock.authSession.findFirst).toHaveBeenCalledWith({
      where: { id: 5, userId: 1 },
      include: { user: { select: { email: true, deactivatedAt: true } } },
    });
  });

  it('refreshTokens should reject a deactivated account even with a matching token', async () => {
    prismaMock.authSession.findFirst.mockResolvedValue(
      createTestSession({
        user: { email: 'user@example.com', deactivatedAt: new Date('2026-09-01T00:00:00.000Z') },
      }),
    );
    jest.mocked(argon2.verify).mockResolvedValue(true);

    await expect(service.refreshTokens(1, 5, 'refresh-token')).rejects.toThrow(ForbiddenException);
    expect(prismaMock.authSession.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ['idle for more than 8 hours', { lastUsedAt: new Date(NOW - SESSION_IDLE_TIMEOUT_MS - 1) }],
    [
      'older than 7 days despite activity',
      { createdAt: new Date(NOW - SESSION_MAX_AGE_MS - 1), lastUsedAt: new Date(NOW - 1000) },
    ],
  ])('refreshTokens should end a session %s', async (_, overrides) => {
    prismaMock.authSession.findFirst.mockResolvedValue(createTestSession(overrides));
    jest.mocked(argon2.verify).mockResolvedValue(true);

    await expect(service.refreshTokens(1, 5, 'refresh-token')).rejects.toMatchObject({
      response: { error: 'REFRESH_DENIED' },
    });
    expect(prismaMock.authSession.deleteMany).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(prismaMock.authSession.updateMany).not.toHaveBeenCalled();
  });

  it('refreshTokens should throw ForbiddenException when refresh token does not match', async () => {
    prismaMock.authSession.findFirst.mockResolvedValue(createTestSession());
    jest.mocked(argon2.verify).mockResolvedValue(false);

    await expect(service.refreshTokens(1, 5, 'invalid-refresh-token')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refreshTokens should rotate the token inside the session and mark it used', async () => {
    prismaMock.authSession.findFirst.mockResolvedValue(createTestSession());
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jest.mocked(argon2.hash).mockResolvedValue('new-hashed-refresh-token');
    const getTokensSpy = mockTokens('new-access-token', 'new-refresh-token');
    prismaMock.authSession.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.refreshTokens(1, 5, 'valid-refresh-token');

    expect(getTokensSpy).toHaveBeenCalledWith(1, 'user@example.com', 5);
    expect(prismaMock.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: 5, hashedRefreshToken: 'hashed-refresh-token' },
      data: { hashedRefreshToken: 'new-hashed-refresh-token', lastUsedAt: new Date(NOW) },
    });
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      refreshCookieMaxAgeMs: undefined,
    });
  });

  it('refreshTokens should not extend a remembered cookie past the session limit', async () => {
    const createdAt = new Date(NOW - 2 * 24 * 60 * 60 * 1000);
    prismaMock.authSession.findFirst.mockResolvedValue(
      createTestSession({ rememberDevice: true, createdAt }),
    );
    jest.mocked(argon2.verify).mockResolvedValue(true);
    mockTokens();
    prismaMock.authSession.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.refreshTokens(1, 5, 'valid-refresh-token');

    expect(result.refreshCookieMaxAgeMs).toBe(createdAt.getTime() + SESSION_MAX_AGE_MS - NOW);
  });

  it('refreshTokens should reject a stale parallel refresh after the stored hash changes', async () => {
    prismaMock.authSession.findFirst.mockResolvedValue(
      createTestSession({ hashedRefreshToken: 'old-hash' }),
    );
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jest.mocked(argon2.hash).mockResolvedValue('new-hash');
    mockTokens('new-access-token', 'new-refresh-token');
    prismaMock.authSession.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.refreshTokens(1, 5, 'old-refresh-token')).rejects.toThrow(
      ForbiddenException,
    );

    expect(prismaMock.authSession.updateMany).toHaveBeenCalledWith({
      where: { id: 5, hashedRefreshToken: 'old-hash' },
      data: { hashedRefreshToken: 'new-hash', lastUsedAt: new Date(NOW) },
    });
  });

  it('getTokens should sign both tokens with the session id using configured secrets', async () => {
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.getTokens(99, 'tokens@example.com', 7);

    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      1,
      { sub: 99, email: 'tokens@example.com', sid: 7 },
      { secret: 'at-secret', expiresIn: '15m' },
    );
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      2,
      {
        sub: 99,
        email: 'tokens@example.com',
        sid: 7,
        refreshNonce: expect.any(String) as string,
      },
      { secret: 'rt-secret', expiresIn: '7d' },
    );
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });
});
