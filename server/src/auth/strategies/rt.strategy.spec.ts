import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { REFRESH_TOKEN_COOKIE_NAME } from '../auth-cookie';
import { RefreshTokenStrategy } from './rt.strategy';

const createRequest = (cookie?: string, authorization?: string): Request =>
  ({
    headers: {
      ...(authorization === undefined ? {} : { authorization }),
      ...(cookie === undefined ? {} : { cookie }),
    },
    get: jest.fn((headerName: string) => {
      if (headerName.toLowerCase() === 'authorization') {
        return authorization;
      }

      return undefined;
    }),
  }) as unknown as Request;

describe('RefreshTokenStrategy', () => {
  let strategy: RefreshTokenStrategy;

  beforeEach(() => {
    strategy = new RefreshTokenStrategy({
      get: jest.fn((key: string) => {
        if (key === 'JWT_REFRESH_SECRET') return 'rt-secret';
        return undefined;
      }),
    } as unknown as ConfigService);
  });

  it('validate should attach the exact refresh token from cookie', () => {
    const payload = { sub: 7, email: 'user@example.com' };

    const result = strategy.validate(
      createRequest(`other=value; ${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`),
      payload,
    );

    expect(result).toEqual({
      ...payload,
      refreshToken: 'refresh-token',
    });
  });

  it('validate should decode an encoded refresh cookie value', () => {
    const payload = { sub: 7, email: 'user@example.com' };

    const result = strategy.validate(
      createRequest(`${REFRESH_TOKEN_COOKIE_NAME}=refresh%20token`),
      payload,
    );

    expect(result).toEqual({
      ...payload,
      refreshToken: 'refresh token',
    });
  });

  it('validate should reject missing refresh cookie', () => {
    expect(() => strategy.validate(createRequest(), { sub: 7 })).toThrow(UnauthorizedException);
  });

  it('validate should ignore authorization header refresh tokens', () => {
    expect(() =>
      strategy.validate(createRequest(undefined, 'Bearer refresh-token'), { sub: 7 }),
    ).toThrow(UnauthorizedException);
  });
});
