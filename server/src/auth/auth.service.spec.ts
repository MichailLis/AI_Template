import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/auth.dto';

jest.mock('argon2', () => ({
  hash: jest.fn(),
  verify: jest.fn(),
}));

type TestUser = {
  id: number;
  email: string;
  name: string | null;
  password: string;
  hashedRefreshToken: string | null;
  role: 'USER' | 'ADMIN';
  deactivatedAt: Date | null;
};

type PrismaUserDelegate = {
  create: jest.Mock;
  findUnique: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
};

const createTestUser = (overrides: Partial<TestUser> = {}): TestUser => ({
  id: 1,
  email: 'user@example.com',
  name: 'User',
  password: 'hashed-password',
  hashedRefreshToken: 'hashed-refresh-token',
  role: 'USER',
  deactivatedAt: null,
  ...overrides,
});

describe('AuthService', () => {
  let service: AuthService;
  let prismaMock: { user: PrismaUserDelegate };
  let jwtServiceMock: {
    signAsync: jest.Mock;
  };
  let configMock: { get: jest.Mock };

  beforeEach(() => {
    prismaMock = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };

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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('signin should throw ForbiddenException when user does not exist', async () => {
    const dto: SigninDto = {
      email: 'missing@example.com',
      password: 'Password123',
    };

    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(service.signin(dto)).rejects.toThrow(ForbiddenException);
  });

  it('signin should throw ForbiddenException when password is invalid', async () => {
    const dto: SigninDto = {
      email: 'user@example.com',
      password: 'wrong-password',
    };

    prismaMock.user.findUnique.mockResolvedValue(createTestUser());
    jest.mocked(argon2.verify).mockResolvedValue(false);

    await expect(service.signin(dto)).rejects.toThrow(ForbiddenException);
  });

  it('signin should look up users by normalized email and return user data', async () => {
    const dto: SigninDto = {
      email: ' User@Example.COM ',
      password: 'Password123',
    };

    prismaMock.user.findUnique.mockResolvedValue(createTestUser());
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jest.spyOn(service, 'getTokens').mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    jest.mocked(argon2.hash).mockResolvedValue('hashed-refresh-token');

    const result = await service.signin(dto);

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'user@example.com' },
    });
    expect(argon2.hash).toHaveBeenCalledWith('refresh-token');
    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        hashedRefreshToken: 'hashed-refresh-token',
        lastLoginAt: expect.any(Date) as Date,
      },
    });
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'User',
        role: 'USER',
      },
    });
  });

  it('signin should reject a deactivated account without issuing tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      createTestUser({ deactivatedAt: new Date('2026-09-01T00:00:00.000Z') }),
    );
    jest.mocked(argon2.verify).mockResolvedValue(true);
    const getTokensSpy = jest.spyOn(service, 'getTokens');

    await expect(
      service.signin({ email: 'user@example.com', password: 'Password123' }),
    ).rejects.toThrow('Account is deactivated');
    expect(getTokensSpy).not.toHaveBeenCalled();
    expect(prismaMock.user.update).not.toHaveBeenCalled();
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

  it('logout should clear user refresh token hash', async () => {
    prismaMock.user.update.mockResolvedValue(createTestUser({ hashedRefreshToken: null }));

    await service.logout(11);

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 11 },
      data: { hashedRefreshToken: null },
    });
  });

  it('refreshTokens should throw ForbiddenException when user has no refresh hash', async () => {
    prismaMock.user.findUnique.mockResolvedValue(createTestUser({ hashedRefreshToken: null }));

    await expect(service.refreshTokens(1, 'refresh-token')).rejects.toThrow(ForbiddenException);
  });

  it('refreshTokens should reject a deactivated account even with a matching token', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      createTestUser({ deactivatedAt: new Date('2026-09-01T00:00:00.000Z') }),
    );
    jest.mocked(argon2.verify).mockResolvedValue(true);

    await expect(service.refreshTokens(1, 'refresh-token')).rejects.toThrow(ForbiddenException);
    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it('refreshTokens should throw ForbiddenException when refresh token does not match', async () => {
    prismaMock.user.findUnique.mockResolvedValue(createTestUser());
    jest.mocked(argon2.verify).mockResolvedValue(false);

    await expect(service.refreshTokens(1, 'invalid-refresh-token')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('refreshTokens should return new tokens when refresh token is valid', async () => {
    prismaMock.user.findUnique.mockResolvedValue(createTestUser());
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jest.mocked(argon2.hash).mockResolvedValue('new-hashed-refresh-token');
    jest.spyOn(service, 'getTokens').mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    prismaMock.user.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.refreshTokens(1, 'valid-refresh-token');

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 1,
        hashedRefreshToken: 'hashed-refresh-token',
      },
      data: { hashedRefreshToken: 'new-hashed-refresh-token' },
    });
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
  });

  it('refreshTokens should reject a stale parallel refresh after the stored hash changes', async () => {
    prismaMock.user.findUnique.mockResolvedValue(
      createTestUser({ hashedRefreshToken: 'old-hash' }),
    );
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jest.mocked(argon2.hash).mockResolvedValue('new-hash');
    jest.spyOn(service, 'getTokens').mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });
    prismaMock.user.updateMany.mockResolvedValue({ count: 0 });

    await expect(service.refreshTokens(1, 'old-refresh-token')).rejects.toThrow(ForbiddenException);

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 1,
        hashedRefreshToken: 'old-hash',
      },
      data: { hashedRefreshToken: 'new-hash' },
    });
  });

  it('getTokens should sign access and refresh tokens using configured secrets', async () => {
    jwtServiceMock.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.getTokens(99, 'tokens@example.com');

    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      1,
      { sub: 99, email: 'tokens@example.com' },
      { secret: 'at-secret', expiresIn: '15m' },
    );
    expect(jwtServiceMock.signAsync).toHaveBeenNthCalledWith(
      2,
      {
        sub: 99,
        email: 'tokens@example.com',
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
