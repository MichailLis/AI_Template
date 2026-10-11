import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { getSessionEpochMs } from '../session-epoch';

type JwtPayload = {
  sub: number;
  email: string;
  iat?: number;
};

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
    });
  }

  validate(payload: JwtPayload) {
    // Токен, выданный до восстановления базы, может указывать на чужой id в новых данных.
    // iat в секундах, поэтому граница округляется вниз: вход в ту же секунду, что и восстановление,
    // не должен отклоняться.
    if (payload.iat !== undefined && payload.iat < Math.floor(getSessionEpochMs() / 1000)) {
      throw new UnauthorizedException('Session expired');
    }

    return payload;
  }
}
