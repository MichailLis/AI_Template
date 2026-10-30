import type { Response } from 'express';

import { AuthController } from './auth.controller';
import { REFRESH_TOKEN_COOKIE_NAME } from './auth-cookie';
import type { AuthService } from './auth.service';
import type { SigninDto } from './dto/auth.dto';

type MockResponse = Omit<Response, 'clearCookie' | 'cookie'> & {
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

  it('signin should set a session cookie when the device is not remembered', async () => {
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
    // Без maxAge cookie умирает с закрытием браузера (#176).
    const [, , cookieOptions] = responseMock.cookie.mock.calls[0] as [string, string, object];
    expect(cookieOptions).not.toHaveProperty('maxAge');
  });

  it('signin should keep the cookie on a remembered device', async () => {
    const responseMock = createMockResponse();
    authServiceMock.signin.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      refreshCookieMaxAgeMs: 1000,
      user: { id: 1, email: 'signin@example.com', name: null },
    });

    await controller.signin(
      { email: 'signin@example.com', password: 'Password123', rememberDevice: true },
      responseMock,
    );

    expect(responseMock.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'refresh-token',
      expect.objectContaining({ maxAge: 1000 }),
    );
  });

  it('logout should delegate to auth service with user and session ids', async () => {
    const responseMock = createMockResponse();
    authServiceMock.logout.mockResolvedValue(undefined);

    await expect(controller.logout(17, 4, responseMock)).resolves.toBeUndefined();
    expect(authServiceMock.logout).toHaveBeenCalledWith(17, 4);
    expect(responseMock.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      expect.objectContaining({
        httpOnly: true,
        path: '/auth/refresh',
        sameSite: 'lax',
      }),
    );
  });

  it('refreshTokens should delegate to auth service with user, session and refresh token', async () => {
    const responseMock = createMockResponse();
    const response = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    authServiceMock.refreshTokens.mockResolvedValue(response);

    await expect(controller.refreshTokens(22, 4, 'refresh-token', responseMock)).resolves.toEqual({
      accessToken: response.accessToken,
    });
    expect(authServiceMock.refreshTokens).toHaveBeenCalledWith(22, 4, 'refresh-token');
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
