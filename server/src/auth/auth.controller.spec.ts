import type { Response } from 'express';

import { AuthController } from './auth.controller';
import { REFRESH_TOKEN_COOKIE_NAME } from './auth-cookie';
import { AuthService } from './auth.service';
import { SigninDto } from './dto/auth.dto';

type MockResponse = Response & {
  clearCookie: jest.Mock;
  cookie: jest.Mock;
};

const createMockResponse = (): MockResponse =>
  ({
    clearCookie: jest.fn(),
    cookie: jest.fn(),
  }) as unknown as MockResponse;

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: {
    signin: jest.Mock;
    logout: jest.Mock;
    refreshTokens: jest.Mock;
  };

  beforeEach(() => {
    authServiceMock = {
      signin: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
    };

    controller = new AuthController(authServiceMock as unknown as AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('signin should delegate to auth service', async () => {
    const responseMock = createMockResponse();
    const dto: SigninDto = {
      email: 'signin@example.com',
      password: 'Password123',
    };
    const response = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        email: dto.email,
        name: 'Signin User',
      },
    };

    authServiceMock.signin.mockResolvedValue(response);

    await expect(controller.signin(dto, responseMock)).resolves.toEqual({
      accessToken: response.accessToken,
      user: response.user,
    });
    expect(authServiceMock.signin).toHaveBeenCalledWith(dto);
    expect(responseMock.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      response.refreshToken,
      expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        sameSite: 'lax',
      }),
    );
  });

  it('logout should delegate to auth service with user id', async () => {
    const responseMock = createMockResponse();
    authServiceMock.logout.mockResolvedValue(undefined);

    await expect(controller.logout(17, responseMock)).resolves.toBeUndefined();
    expect(authServiceMock.logout).toHaveBeenCalledWith(17);
    expect(responseMock.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        sameSite: 'lax',
      }),
    );
  });

  it('refreshTokens should delegate to auth service with user id and refresh token', async () => {
    const responseMock = createMockResponse();
    const response = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    authServiceMock.refreshTokens.mockResolvedValue(response);

    await expect(controller.refreshTokens(22, 'refresh-token', responseMock)).resolves.toEqual({
      accessToken: response.accessToken,
    });
    expect(authServiceMock.refreshTokens).toHaveBeenCalledWith(22, 'refresh-token');
    expect(responseMock.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      response.refreshToken,
      expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        sameSite: 'lax',
      }),
    );
  });
});
