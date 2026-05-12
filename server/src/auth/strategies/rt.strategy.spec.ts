import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

import { RefreshTokenStrategy } from './rt.strategy';

const createRequest = (authorization?: string): Request =>
  ({
    headers: authorization === undefined ? {} : { authorization },
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

  it('validate should attach the exact bearer refresh token', () => {
    const payload = { sub: 7, email: 'user@example.com' };

    const result = strategy.validate(createRequest('Bearer refresh-token'), payload);

    expect(result).toEqual({
      ...payload,
      refreshToken: 'refresh-token',
    });
  });

  it('validate should reject missing authorization header', () => {
    expect(() => strategy.validate(createRequest(), { sub: 7 })).toThrow(UnauthorizedException);
  });

  it('validate should reject malformed authorization header', () => {
    expect(() => strategy.validate(createRequest('Basic refresh-token'), { sub: 7 })).toThrow(
      UnauthorizedException,
    );
  });

  it('validate should reject a bearer header without a token value', () => {
    expect(() => strategy.validate(createRequest('Bearer'), { sub: 7 })).toThrow(
      UnauthorizedException,
    );
  });
});
