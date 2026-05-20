import { ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';

import { PrismaService } from '../prisma.service';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto } from './dto/auth.dto';

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

  it('signup should create user and return tokens with public user fields', async () => {
    const dto: SignupDto = {
      email: 'new@example.com',
      password: 'Password123',
      name: 'New User',
    };
    const createdUser = createTestUser({
      id: 7,
      email: dto.email,
      name: dto.name ?? null,
      password: 'stored-hash',
    });

    jest.mocked(argon2.hash).mockResolvedValue('stored-hash');
    prismaMock.user.create.mockResolvedValue(createdUser);
    jest.spyOn(service, 'getTokens').mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const updateRefreshTokenSpy = jest.spyOn(service, 'updateRefreshToken').mockResolvedValue();

    const result = await service.signup(dto);

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: dto.email,
        password: 'stored-hash',
        name: dto.name,
      },
    });
    expect(updateRefreshTokenSpy).toHaveBeenCalledWith(7, 'refresh-token');
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 7,
        email: dto.email,
        name: dto.name,
      },
    });
  });

  it('signup should throw ForbiddenException when email already exists', async () => {
    const dto: SignupDto = {
      email: 'duplicate@example.com',
      password: 'Password123',
      name: 'Duplicate User',
    };

    jest.mocked(argon2.hash).mockResolvedValue('stored-hash');
    prismaMock.user.create.mockRejectedValue({ code: 'P2002' });

    const signupPromise = service.signup(dto);

    await expect(signupPromise).rejects.toThrow(ForbiddenException);
    await expect(signupPromise).rejects.toThrow('Email already exists');
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

  it('signin should return tokens and user data for valid credentials', async () => {
    const dto: SigninDto = {
      email: 'user@example.com',
      password: 'Password123',
    };

    prismaMock.user.findUnique.mockResolvedValue(createTestUser());
    jest.mocked(argon2.verify).mockResolvedValue(true);
    jest.spyOn(service, 'getTokens').mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    const updateRefreshTokenSpy = jest.spyOn(service, 'updateRefreshToken').mockResolvedValue();

    const result = await service.signin(dto);

    expect(updateRefreshTokenSpy).toHaveBeenCalledWith(1, 'refresh-token');
    expect(result).toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        email: 'user@example.com',
        name: 'User',
      },
    });
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

  it('updateRefreshToken should hash and persist token', async () => {
    jest.mocked(argon2.hash).mockResolvedValue('hashed-refresh-token');
    prismaMock.user.update.mockResolvedValue(
      createTestUser({ hashedRefreshToken: 'hashed-refresh-token' }),
    );

    await service.updateRefreshToken(9, 'plain-refresh-token');

    expect(prismaMock.user.update).toHaveBeenCalledWith({
      where: { id: 9 },
      data: { hashedRefreshToken: 'hashed-refresh-token' },
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
