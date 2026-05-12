import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const extractBearerToken = ExtractJwt.fromAuthHeaderAsBearerToken();

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: extractBearerToken,
      secretOrKey: config.get<string>('JWT_REFRESH_SECRET')!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: Record<string, unknown>) {
    const refreshToken = extractBearerToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    return {
      ...payload,
      refreshToken,
    };
  }
}
