import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SigninDto, SignupDto } from './dto/auth.dto';

describe('AuthController', () => {
  let controller: AuthController;
  let authServiceMock: {
    signup: jest.Mock;
    signin: jest.Mock;
    logout: jest.Mock;
    refreshTokens: jest.Mock;
  };

  beforeEach(() => {
    authServiceMock = {
      signup: jest.fn(),
      signin: jest.fn(),
      logout: jest.fn(),
      refreshTokens: jest.fn(),
    };

    controller = new AuthController(authServiceMock as unknown as AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('signup should delegate to auth service', async () => {
    const dto: SignupDto = {
      email: 'signup@example.com',
      password: 'Password123',
      name: 'Signup User',
    };
    const response = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: {
        id: 1,
        email: dto.email,
        name: dto.name,
      },
    };

    authServiceMock.signup.mockResolvedValue(response);

    await expect(controller.signup(dto)).resolves.toEqual(response);
    expect(authServiceMock.signup).toHaveBeenCalledWith(dto);
  });

  it('signin should delegate to auth service', async () => {
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

    await expect(controller.signin(dto)).resolves.toEqual(response);
    expect(authServiceMock.signin).toHaveBeenCalledWith(dto);
  });

  it('logout should delegate to auth service with user id', async () => {
    authServiceMock.logout.mockResolvedValue(undefined);

    await expect(controller.logout(17)).resolves.toBeUndefined();
    expect(authServiceMock.logout).toHaveBeenCalledWith(17);
  });

  it('refreshTokens should delegate to auth service with user id and refresh token', async () => {
    const response = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    authServiceMock.refreshTokens.mockResolvedValue(response);

    await expect(controller.refreshTokens(22, 'refresh-token')).resolves.toEqual(response);
    expect(authServiceMock.refreshTokens).toHaveBeenCalledWith(22, 'refresh-token');
  });
});
