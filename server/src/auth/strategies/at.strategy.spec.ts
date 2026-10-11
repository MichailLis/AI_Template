import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';

import { setSessionEpochMs } from '../session-epoch';
import { AccessTokenStrategy } from './at.strategy';

describe('AccessTokenStrategy', () => {
  const strategy = new AccessTokenStrategy({
    get: () => 'test-secret',
  } as unknown as ConfigService);

  it('rejects tokens issued before the last database restore', () => {
    const restoredAtSeconds = 2_000_000_000;
    setSessionEpochMs(restoredAtSeconds * 1000 + 700);

    expect(() =>
      strategy.validate({ sub: 1, email: 'admin@example.com', iat: restoredAtSeconds - 1 }),
    ).toThrow(UnauthorizedException);
    expect(
      strategy.validate({ sub: 1, email: 'admin@example.com', iat: restoredAtSeconds }),
    ).toMatchObject({ sub: 1 });
  });
});
